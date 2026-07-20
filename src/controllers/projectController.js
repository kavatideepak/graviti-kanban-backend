import { z } from 'zod';
import { sequelize, Project, Board, Column } from '../models/index.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Review', 'Done'];

export const createProjectSchema = z.object({
  key: z.string().trim().min(1).max(10).regex(/^[A-Z0-9]+$/, 'Key must be uppercase letters/numbers'),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
});

export const updateProjectSchema = createProjectSchema.partial().omit({ key: true });

export const listProjects = asyncHandler(async (_req, res) => {
  const projects = await Project.findAll({
    order: [['createdAt', 'ASC']],
    include: [{ model: Board, attributes: ['id', 'name', 'position'] }],
  });
  res.json(projects);
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findByPk(req.params.id, {
    include: [{ model: Board, attributes: ['id', 'name', 'position'] }],
  });
  if (!project) throw new HttpError(404, 'Project not found');
  res.json(project);
});

export const createProject = asyncHandler(async (req, res) => {
  const { key, name, description } = req.body;

  // Create the project together with a default board + columns so it's usable right away.
  const project = await sequelize.transaction(async (t) => {
    const created = await Project.create({ key, name, description, ticketSeq: 0 }, { transaction: t });
    const board = await Board.create(
      { projectId: created.id, name: 'Main Board', position: 1000 },
      { transaction: t },
    );
    await Column.bulkCreate(
      DEFAULT_COLUMNS.map((n, i) => ({ boardId: board.id, name: n, position: (i + 1) * 1000, wipLimit: null })),
      { transaction: t },
    );
    return created;
  });

  const full = await Project.findByPk(project.id, {
    include: [{ model: Board, attributes: ['id', 'name', 'position'] }],
  });
  res.status(201).json(full);
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) throw new HttpError(404, 'Project not found');
  await project.update(req.body);
  res.json(project);
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) throw new HttpError(404, 'Project not found');
  await project.destroy();
  res.status(204).end();
});
