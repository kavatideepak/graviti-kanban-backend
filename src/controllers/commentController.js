import { z } from 'zod';
import { Comment, Ticket, User, Activity } from '../models/index.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { emitToBoard } from '../sockets/index.js';

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

const authorInclude = { model: User, as: 'author', attributes: ['id', 'name', 'avatarColor'] };

export const listComments = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findByPk(req.params.id);
  if (!ticket) throw new HttpError(404, 'Ticket not found');
  const comments = await Comment.findAll({
    where: { ticketId: ticket.id },
    include: [authorInclude],
    order: [['createdAt', 'ASC']],
  });
  res.json(comments);
});

export const createComment = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findByPk(req.params.id);
  if (!ticket) throw new HttpError(404, 'Ticket not found');

  const comment = await Comment.create({
    ticketId: ticket.id,
    authorId: req.userId,
    body: req.body.body,
  });
  await Activity.create({
    ticketId: ticket.id, actorId: req.userId, type: 'commented', meta: { commentId: comment.id },
  });

  const full = await Comment.findByPk(comment.id, { include: [authorInclude] });
  emitToBoard(ticket.boardId, 'comment:created', { ticketId: ticket.id, comment: full });
  res.status(201).json(full);
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findByPk(req.params.id, { include: [{ model: Ticket }] });
  if (!comment) throw new HttpError(404, 'Comment not found');
  const { ticketId } = comment;
  const boardId = comment.Ticket?.boardId;
  await comment.destroy();
  emitToBoard(boardId, 'comment:deleted', { ticketId, id: Number(req.params.id) });
  res.status(204).end();
});
