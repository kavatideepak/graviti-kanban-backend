import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import {
  listBoards, getBoardFull, createBoard, updateBoard, deleteBoard,
  createBoardSchema, updateBoardSchema,
} from '../controllers/boardController.js';

const router = Router();
router.get('/', validate({ query: z.object({ projectId: z.coerce.number().int().positive().optional() }) }), listBoards);
router.get('/:id/full', getBoardFull);
router.post('/', validate({ body: createBoardSchema }), createBoard);
router.patch('/:id', validate({ body: updateBoardSchema }), updateBoard);
router.delete('/:id', deleteBoard);
export default router;
