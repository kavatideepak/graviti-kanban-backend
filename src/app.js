import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import { currentUser } from './middleware/currentUser.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
  app.use(express.json());
  app.use(morgan('dev'));
  app.use(currentUser);

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
