import { User } from '../models/index.js';

// MVP stand-in for auth: the client sends X-User-Id identifying the acting user.
// Attaches req.userId (and lazily-loadable actor) or null. Never trusts a body field.
export async function currentUser(req, _res, next) {
  const raw = req.header('X-User-Id');
  const id = raw ? Number.parseInt(raw, 10) : null;
  req.userId = Number.isInteger(id) ? id : null;
  next();
}

// Guard for routes that must have an actor (comments, etc.).
export async function requireUser(req, res, next) {
  if (!req.userId) {
    return res.status(401).json({ error: 'X-User-Id header required' });
  }
  const user = await User.findByPk(req.userId);
  if (!user) return res.status(401).json({ error: 'Unknown user' });
  req.user = user;
  next();
}
