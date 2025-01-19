import { Server } from 'socket.io';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ["GET", "POST"],
      credentials: true,
    }
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    
    socket.on('authenticate', (studentId) => {
      console.log('Student authenticated:', studentId);
      socket.studentId = studentId;
      socket.join(`student:${studentId}`);
      console.log(`Joined room: student:${studentId}`);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const notifyStudent = (studentId, notification) => {
  console.log('Sending notification:', { to: studentId, type: notification.type });

  if (io) {    
    const socketNotification = {
      id: Date.now().toString(),
      message: notification.message,
      type: notification.type,
      data: notification.data,
      timestamp: new Date().toISOString()
    };

    io.to(`student:${studentId}`).emit(`${notification.type.toLowerCase()}`, socketNotification);
  }
};
