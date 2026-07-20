import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import {
  listProjects, getProject, createProject, updateProject, deleteProject,
  createProjectSchema, updateProjectSchema,
} from '../controllers/projectController.js';

const router = Router();
router.get('/', listProjects);
router.get('/:id', getProject);
router.post('/', validate({ body: createProjectSchema }), createProject);
router.patch('/:id', validate({ body: updateProjectSchema }), updateProject);
router.delete('/:id', deleteProject);
export default router;
