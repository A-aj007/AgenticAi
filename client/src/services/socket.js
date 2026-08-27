import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket && typeof window !== 'undefined') {
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to Agentflow server:', socket.id);
      
      // Auto join user room if user exists in localStorage
      try {
        const storedUser = localStorage.getItem('agentflow_user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user?.id) {
            socket.emit('user:join', user.id);
          }
        }
      } catch (e) {}
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected from Agentflow server:', reason);
    });
  }
  return socket;
};

export const joinExecutionRoom = (executionId) => {
  const s = getSocket();
  if (s && executionId) {
    s.emit('execution:join', executionId);
  }
};

export const leaveExecutionRoom = (executionId) => {
  const s = getSocket();
  if (s && executionId) {
    s.emit('execution:leave', executionId);
  }
};

export const joinUserRoom = (userId) => {
  const s = getSocket();
  if (s && userId) {
    s.emit('user:join', userId);
  }
};
