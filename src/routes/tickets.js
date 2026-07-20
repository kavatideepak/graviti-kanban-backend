import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireUser } from '../middleware/currentUser.js';
import {
  listTickets, getTicket, createTicket, updateTicket, moveTicket, deleteTicket,
  createTicketSchema, updateTicketSchema, moveTicketSchema, listQuerySchema,
} from '../controllers/ticketController.js';
import {
  listComments, createComment, createCommentSchema,
} from '../controllers/commentController.js';
import { listActivity } from '../controllers/activityController.js';
import { addLabelToTicket, removeLabelFromTicket } from '../controllers/labelController.js';

const router = Router();
router.get('/', validate({ query: listQuerySchema }), listTickets);
router.get('/:id', getTicket);
router.post('/', validate({ body: createTicketSchema }), createTicket);
router.patch('/:id/move', validate({ body: moveTicketSchema }), moveTicket);
router.patch('/:id', validate({ body: updateTicketSchema }), updateTicket);
router.delete('/:id', deleteTicket);

// Sub-resources
router.get('/:id/comments', listComments);
router.post('/:id/comments', requireUser, validate({ body: createCommentSchema }), createComment);
router.get('/:id/activity', listActivity);
router.post('/:id/labels', validate({ body: z.object({ labelId: z.coerce.number().int().positive() }) }), addLabelToTicket);
router.delete('/:id/labels/:labelId', removeLabelFromTicket);

export default router;
