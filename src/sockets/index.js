import { Server } from 'socket.io';

let io = null;

export function initSockets(httpServer, { origin } = {}) {
  io = new Server(httpServer, {
    cors: { origin: origin || '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    socket.on('board:join', (boardId) => {
      if (boardId != null) socket.join(`board:${boardId}`);
    });
    socket.on('board:leave', (boardId) => {
      if (boardId != null) socket.leave(`board:${boardId}`);
    });
  });

  return io;
}

// Emit an event to everyone viewing a board. No-op if sockets not initialised.
export function emitToBoard(boardId, event, payload) {
  if (io && boardId != null) io.to(`board:${boardId}`).emit(event, payload);
}

export function getIO() {
  return io;
}
