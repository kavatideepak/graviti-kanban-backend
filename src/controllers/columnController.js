import { z } from 'zod';
import { Column, Board } from '../models/index.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { emitToBoard } from '../sockets/index.js';

export const createColumnSchema = z.object({
  boardId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(80),
  position: z.number().optional(),
  wipLimit: z.number().int().positive().nullable().optional(),
});

export const updateColumnSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  position: z.number().optional(),
  wipLimit: z.number().int().positive().nullable().optional(),
});

export const createColumn = asyncHandler(async (req, res) => {
  const board = await Board.findByPk(req.body.boardId);
  if (!board) throw new HttpError(404, 'Board not found');
  const column = await Column.create(req.body);
  emitToBoard(column.boardId, 'column:created', column);
  res.status(201).json(column);
});

export const updateColumn = asyncHandler(async (req, res) => {
  const column = await Column.findByPk(req.params.id);
  if (!column) throw new HttpError(404, 'Column not found');
  await column.update(req.body);
  emitToBoard(column.boardId, 'column:updated', column);
  res.json(column);
});

export const deleteColumn = asyncHandler(async (req, res) => {
  const column = await Column.findByPk(req.params.id);
  if (!column) throw new HttpError(404, 'Column not found');
  const boardId = column.boardId;
  await column.destroy();
  emitToBoard(boardId, 'column:deleted', { id: Number(req.params.id), boardId });
  res.status(204).end();
});
