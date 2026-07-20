import { z } from 'zod';
import { Label, Project, Ticket } from '../models/index.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { serializeTicket } from '../lib/ticketInclude.js';
import { emitToBoard } from '../sockets/index.js';

export const createLabelSchema = z.object({
  projectId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(40),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value').optional(),
});

export const updateLabelSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const listLabels = asyncHandler(async (req, res) => {
  const where = {};
  if (req.validatedQuery?.projectId) where.projectId = req.validatedQuery.projectId;
  const labels = await Label.findAll({ where, order: [['name', 'ASC']] });
  res.json(labels);
});

export const createLabel = asyncHandler(async (req, res) => {
  const project = await Project.findByPk(req.body.projectId);
  if (!project) throw new HttpError(404, 'Project not found');
  const label = await Label.create(req.body);
  res.status(201).json(label);
});

export const updateLabel = asyncHandler(async (req, res) => {
  const label = await Label.findByPk(req.params.id);
  if (!label) throw new HttpError(404, 'Label not found');
  await label.update(req.body);
  res.json(label);
});

export const deleteLabel = asyncHandler(async (req, res) => {
  const label = await Label.findByPk(req.params.id);
  if (!label) throw new HttpError(404, 'Label not found');
  await label.destroy();
  res.status(204).end();
});

// Attach / detach labels on a ticket. Both re-emit the full ticket so boards refresh chips.
export const addLabelToTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findByPk(req.params.id);
  if (!ticket) throw new HttpError(404, 'Ticket not found');
  const label = await Label.findByPk(req.body.labelId);
  if (!label) throw new HttpError(404, 'Label not found');
  await ticket.addLabel(label);
  const full = await serializeTicket(Ticket, ticket.id);
  emitToBoard(ticket.boardId, 'ticket:updated', full);
  res.json(full);
});

export const removeLabelFromTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findByPk(req.params.id);
  if (!ticket) throw new HttpError(404, 'Ticket not found');
  const label = await Label.findByPk(req.params.labelId);
  if (!label) throw new HttpError(404, 'Label not found');
  await ticket.removeLabel(label);
  const full = await serializeTicket(Ticket, ticket.id);
  emitToBoard(ticket.boardId, 'ticket:updated', full);
  res.json(full);
});
