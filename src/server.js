import http from 'http';
import dotenv from 'dotenv';
import { createApp } from './app.js';
import { sequelize } from './models/index.js';
import { initSockets } from './sockets/index.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('DB connection OK');
  } catch (err) {
    console.error('Unable to connect to the database:', err.message);
    process.exit(1);
  }

  const app = createApp();
  const server = http.createServer(app);
  initSockets(server, { origin: process.env.CLIENT_ORIGIN });

  server.listen(PORT, () => {
    console.log(`Kanban server listening on http://localhost:${PORT}`);
  });
}

start();
