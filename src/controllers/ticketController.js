import { z } from 'zod';
import { Op } from 'sequelize';
import {
  sequelize, Ticket, Project, Board, Column, Label, Activity,
} from '../models/index.js';
import { PRIORITIES } from '../models/ticket.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { ticketInclude, serializeTicket } from '../lib/ticketInclude.js';
import { needsRebalance, rebalanceColumn } from '../lib/position.js';
import { emitToBoard } from '../sockets/index.js';

export const createTicketSchema = z.object({
  boardId: z.coerce.number().int().positive(),
  columnId: z.coerce.number().int().positive(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(10000).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigneeId: z.number().int().positive().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

export const updateTicketSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(10000).nullable().optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigneeId: z.number().int().positive().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

export const moveTicketSchema = z.object({
  columnId: z.coerce.number().int().positive(),
  position: z.number(),
});

export const listQuerySchema = z.object({
  boardId: z.coerce.number().int().positive().optional(),
  assigneeId: z.coerce.number().int().positive().optional(),
  labelId: z.coerce.number().int().positive().optional(),
  priority: z.enum(PRIORITIES).optional(),
  q: z.string().trim().max(200).optional(),
});

export const listTickets = asyncHandler(async (req, res) => {
  const { boardId, assigneeId, labelId, priority, q } = req.validatedQuery || {};
  const where = {};
  if (boardId) where.boardId = boardId;
  if (assigneeId) where.assigneeId = assigneeId;
  if (priority) where.priority = priority;
  if (q) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${q}%` } },
      { key: { [Op.iLike]: `%${q}%` } },
    ];
  }

  const include = [...ticketInclude];
  if (labelId) {
    // Constrain to tickets carrying this label (inner join on the join row).
    include[2] = { model: Label, through: { attributes: [] }, attributes: ['id', 'name', 'color'], where: { id: labelId } };
  }

  const tickets = await Ticket.findAll({
    where,
    include,
    order: [['position', 'ASC'], ['id', 'ASC']],
  });
  res.json(tickets);
});

export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findByPk(req.params.id, { include: ticketInclude });
  if (!ticket) throw new HttpError(404, 'Ticket not found');
  res.json(ticket);
});

export const createTicket = asyncHandler(async (req, res) => {
  const { boardId, columnId, title, description, priority, assigneeId, dueDate } = req.body;

  const ticket = await sequelize.transaction(async (t) => {
    const board = await Board.findByPk(boardId, { transaction: t });
    if (!board) throw new HttpError(404, 'Board not found');
    const column = await Column.findByPk(columnId, { transaction: t });
    if (!column || column.boardId !== boardId) throw new HttpError(400, 'Column does not belong to board');

    // Atomic, race-free key generation: lock the project row, bump its counter.
    const project = await Project.findByPk(board.projectId, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!project) throw new HttpError(404, 'Project not found');
    const seq = project.ticketSeq + 1;
    await project.update({ ticketSeq: seq }, { transaction: t });
    const key = `${project.key}-${seq}`;

    // Place at the bottom of the target column.
    const maxPos = await Ticket.max('position', { where: { columnId }, transaction: t });
    const position = (maxPos || 0) + 1000;

    const created = await Ticket.create({
      boardId, columnId, key, title, description,
      priority: priority || 'medium',
      assigneeId: assigneeId ?? null,
      reporterId: req.userId ?? null,
      dueDate: dueDate ?? null,
      position,
    }, { transaction: t });

    await Activity.create({
      ticketId: created.id, actorId: req.userId ?? null,
      type: 'created', meta: { key, title },
    }, { transaction: t });

    return created;
  });

  const full = await serializeTicket(Ticket, ticket.id);
  emitToBoard(full.boardId, 'ticket:created', full);
  res.status(201).json(full);
});

export const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findByPk(req.params.id);
  if (!ticket) throw new HttpError(404, 'Ticket not found');

  const changedAssignee = 'assigneeId' in req.body && req.body.assigneeId !== ticket.assigneeId;
  await ticket.update(req.body);

  if (changedAssignee) {
    await Activity.create({
      ticketId: ticket.id, actorId: req.userId ?? null,
      type: 'assigned', meta: { assigneeId: ticket.assigneeId },
    });
  }

  const full = await serializeTicket(Ticket, ticket.id);
  emitToBoard(full.boardId, 'ticket:updated', full);
  res.json(full);
});

export const moveTicket = asyncHandler(async (req, res) => {
  const { columnId, position } = req.body;

  const result = await sequelize.transaction(async (t) => {
    const ticket = await Ticket.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!ticket) throw new HttpError(404, 'Ticket not found');
    const column = await Column.findByPk(columnId, { transaction: t });
    if (!column || column.boardId !== ticket.boardId) throw new HttpError(400, 'Target column invalid');

    const fromColumnId = ticket.columnId;
    ticket.columnId = columnId;
    ticket.position = position;
    await ticket.save({ transaction: t });

    // If floats have collapsed around this position, re-space the column.
    const neighbours = await Ticket.findAll({
      where: { columnId, id: { [Op.ne]: ticket.id } },
      attributes: ['position'],
      order: [['position', 'ASC']],
      transaction: t,
    });
    const positions = neighbours.map((n) => n.position).sort((a, b) => a - b);
    const prev = [...positions].reverse().find((p) => p < position);
    const next = positions.find((p) => p > position);
    if (needsRebalance(prev, next)) {
      await rebalanceColumn(Ticket, columnId, t);
      await ticket.reload({ transaction: t });
    }

    if (fromColumnId !== columnId) {
      await Activity.create({
        ticketId: ticket.id, actorId: req.userId ?? null,
        type: 'moved', meta: { from: fromColumnId, to: columnId },
      }, { transaction: t });
    }
    return ticket;
  });

  const full = await serializeTicket(Ticket, result.id);
  emitToBoard(full.boardId, 'ticket:moved', full);
  res.json(full);
});

export const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findByPk(req.params.id);
  if (!ticket) throw new HttpError(404, 'Ticket not found');
  const { id, boardId } = ticket;
  // Record the deletion before soft-deleting (Activity rows survive on the hidden ticket).
  await Activity.create({ ticketId: id, actorId: req.userId ?? null, type: 'deleted', meta: { key: ticket.key } });
  await ticket.destroy(); // paranoid → sets deletedAt, keeps the row
  emitToBoard(boardId, 'ticket:deleted', { id, boardId });
  res.status(204).end();
});
