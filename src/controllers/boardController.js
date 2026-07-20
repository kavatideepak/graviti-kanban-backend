import { z } from 'zod';
import { Board, Column, Ticket, Project } from '../models/index.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { ticketInclude } from '../lib/ticketInclude.js';

export const createBoardSchema = z.object({
  projectId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(120),
  position: z.number().optional(),
});

export const updateBoardSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  position: z.number().optional(),
});

export const listBoards = asyncHandler(async (req, res) => {
  const where = {};
  if (req.validatedQuery?.projectId) where.projectId = req.validatedQuery.projectId;
  const boards = await Board.findAll({ where, order: [['position', 'ASC']] });
  res.json(boards);
});

// Full board snapshot: columns (ordered) + all tickets (ordered, with assignee/labels).
export const getBoardFull = asyncHandler(async (req, res) => {
  const board = await Board.findByPk(req.params.id, {
    include: [
      { model: Column, separate: true, order: [['position', 'ASC']] },
      { model: Project, attributes: ['id', 'key', 'name'] },
    ],
  });
  if (!board) throw new HttpError(404, 'Board not found');

  const tickets = await Ticket.findAll({
    where: { boardId: board.id },
    include: ticketInclude,
    order: [['position', 'ASC'], ['id', 'ASC']],
  });

  res.json({ board, project: board.Project, columns: board.Columns, tickets });
});

export const createBoard = asyncHandler(async (req, res) => {
  const board = await Board.create(req.body);
  res.status(201).json(board);
});

export const updateBoard = asyncHandler(async (req, res) => {
  const board = await Board.findByPk(req.params.id);
  if (!board) throw new HttpError(404, 'Board not found');
  await board.update(req.body);
  res.json(board);
});

export const deleteBoard = asyncHandler(async (req, res) => {
  const board = await Board.findByPk(req.params.id);
  if (!board) throw new HttpError(404, 'Board not found');
  await board.destroy();
  res.status(204).end();
});
