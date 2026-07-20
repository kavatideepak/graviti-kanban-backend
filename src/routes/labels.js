import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import {
  listLabels, createLabel, updateLabel, deleteLabel,
  createLabelSchema, updateLabelSchema,
} from '../controllers/labelController.js';

const router = Router();
router.get('/', validate({ query: z.object({ projectId: z.coerce.number().int().positive().optional() }) }), listLabels);
router.post('/', validate({ body: createLabelSchema }), createLabel);
router.patch('/:id', validate({ body: updateLabelSchema }), updateLabel);
router.delete('/:id', deleteLabel);
export default router;
