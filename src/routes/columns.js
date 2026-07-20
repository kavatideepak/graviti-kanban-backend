import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import {
  createColumn, updateColumn, deleteColumn,
  createColumnSchema, updateColumnSchema,
} from '../controllers/columnController.js';

const router = Router();
router.post('/', validate({ body: createColumnSchema }), createColumn);
router.patch('/:id', validate({ body: updateColumnSchema }), updateColumn);
router.delete('/:id', deleteColumn);
export default router;
