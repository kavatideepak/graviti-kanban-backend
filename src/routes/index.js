import { Router } from 'express';
import users from './users.js';
import projects from './projects.js';
import boards from './boards.js';
import columns from './columns.js';
import tickets from './tickets.js';
import labels from './labels.js';
import comments from './comments.js';

const router = Router();
router.get('/health', (_req, res) => res.json({ ok: true }));
router.use('/users', users);
router.use('/projects', projects);
router.use('/boards', boards);
router.use('/columns', columns);
router.use('/tickets', tickets);
router.use('/labels', labels);
router.use('/comments', comments);
export default router;
