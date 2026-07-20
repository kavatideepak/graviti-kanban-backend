import { Activity, Ticket, User } from '../models/index.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';

export const listActivity = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findByPk(req.params.id);
  if (!ticket) throw new HttpError(404, 'Ticket not found');
  const activity = await Activity.findAll({
    where: { ticketId: ticket.id },
    include: [{ model: User, as: 'actor', attributes: ['id', 'name', 'avatarColor'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(activity);
});
