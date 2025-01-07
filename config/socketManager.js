import { Server } from 'socket.io';

let io;

export const initializeSocket = (server) => {
  console.log('\n=== INITIALIZING SOCKET.IO SERVER ===');
  
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ["GET", "POST"],
      credentials: true,
    }
  });

  io.on('connection', (socket) => {
    console.log('\n=== NEW CLIENT CONNECTED ===');
    console.log('Socket ID:', socket.id);

    // Store student ID when they connect
    socket.on('authenticate', (studentId) => {
      console.log(`\n=== STUDENT AUTHENTICATED ===`);
      console.log(`Student ID: ${studentId}`);
      console.log(`Socket ID: ${socket.id}`);
      socket.studentId = studentId;
      socket.join(`student:${studentId}`);
      console.log(`Joined room: student:${studentId}`);
    });

    socket.on('disconnect', () => {
      console.log('\n=== CLIENT DISCONNECTED ===');
      console.log('Socket ID:', socket.id);
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

export const notifyStudent = (studentId, data) => {
  console.log('\n=== NOTIFICATION MANAGER ===');
  if (!io) {
    console.error('Socket.io not initialized when trying to notify student');
    return;
  }
  
  console.log(`Sending to room: student:${studentId}`);
  console.log('Notification data:', data);
  
  io.to(`student:${studentId}`).emit('courseAssigned', {
    message: data.message,
    courses: data.courses,
    timestamp: data.timestamp
  });
  console.log('=== NOTIFICATION SENT ===\n');
};
