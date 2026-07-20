import { User } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.findAll({ order: [['name', 'ASC']] });
  res.json(users);
});
