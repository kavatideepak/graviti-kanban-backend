import { User, Label } from '../models/index.js';

// Standard association set returned with a ticket so the client can render cards
// and the detail modal without extra round-trips.
export const ticketInclude = [
  { model: User, as: 'assignee', attributes: ['id', 'name', 'avatarColor'] },
  { model: User, as: 'reporter', attributes: ['id', 'name', 'avatarColor'] },
  { model: Label, through: { attributes: [] }, attributes: ['id', 'name', 'color'] },
];

// Reload a ticket with its associations (used after mutations, for responses + socket payloads).
export async function serializeTicket(Ticket, id) {
  return Ticket.findByPk(id, { include: ticketInclude });
}
