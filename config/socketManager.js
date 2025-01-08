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

export const notifyStudent = (studentId, notification) => {
  console.log('\n=== SENDING SOCKET NOTIFICATION ===');
  console.log('To student:', studentId);
  console.log('Notification:', notification);

  if (io) {
    // Ensure consistent data structure with stored notifications
    const socketNotification = {
      id: Date.now().toString(),
      message: notification.message,
      type: notification.type || 'COURSE_ASSIGNED',
      data: {
        courses: notification.data?.courses || []
      },
      timestamp: notification.timestamp,
      read: false
    };

    console.log('Formatted notification:', socketNotification);
    io.to(`student:${studentId}`).emit('courseAssigned', socketNotification);
  }
};
