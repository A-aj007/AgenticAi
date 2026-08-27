const { Server } = require('socket.io');
const config = require('./env');

let io = null;

const initSocket = (server) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];
  if (config.CLIENT_URL) {
    config.CLIENT_URL.split(',').map(url => url.trim()).filter(Boolean).forEach(url => {
      if (!allowedOrigins.includes(url)) allowedOrigins.push(url);
    });
  }

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join execution room for live timeline updates
    socket.on('execution:join', (executionId) => {
      if (executionId) {
        socket.join(`execution:${executionId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined execution:${executionId}`);
      }
    });

    socket.on('execution:leave', (executionId) => {
      if (executionId) {
        socket.leave(`execution:${executionId}`);
        console.log(`[Socket.IO] Socket ${socket.id} left execution:${executionId}`);
      }
    });

    // Join user room for personal notifications
    socket.on('user:join', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined user:${userId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    console.warn('[Socket.IO] Warning: io instance requested before initialization');
  }
  return io;
};

const emitToExecution = (executionId, event, data) => {
  if (io && executionId) {
    io.to(`execution:${executionId}`).emit(event, data);
  }
};

const emitToUser = (userId, event, data) => {
  if (io && userId) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const broadcastEvent = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToExecution,
  emitToUser,
  broadcastEvent,
};
