import { Server } from 'socket.io';

let io;
const connectedStudents = new Map();

const NOTIFICATION_TYPES = {
  COURSE_ASSIGNED: 'course_assigned',
  COURSE_UNASSIGNED: 'course_unassigned'
};

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    
    socket.on('authenticate', (studentId) => {
      if (!studentId) {
        console.error('Authentication failed: No student ID provided');
        return;
      }

      console.log('Student authenticated:', studentId);
      socket.studentId = studentId;
      socket.join(`student:${studentId}`);
      connectedStudents.set(studentId, socket.id);
      console.log(`Joined room: student:${studentId}`);
    });

    socket.on('disconnect', () => {
      if (socket.studentId) {
        connectedStudents.delete(socket.studentId);
      }
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

export const notifyStudent = async (studentId, notification) => {
  if (!io) {
    console.error('Socket.io not initialized');
    return;
  }

  if (!studentId) {
    console.error('No student ID provided for notification');
    return;
  }

  console.log('Sending notification:', { to: studentId, type: notification.type });

  try {
    const socketNotification = {
      id: Date.now().toString(),
      message: notification.message,
      type: notification.type,
      data: notification.data,
      timestamp: new Date().toISOString()
    };
    
    const eventName = notification.type === 'COURSE_ASSIGNED' 
      ? NOTIFICATION_TYPES.COURSE_ASSIGNED 
      : NOTIFICATION_TYPES.COURSE_UNASSIGNED;
    
    const isConnected = connectedStudents.has(studentId);
    console.log(`Student ${studentId} is ${isConnected ? 'connected' : 'not connected'}`);

    io.to(`student:${studentId}`).emit(eventName, socketNotification);
        
    console.log('Notification sent successfully:', {
      studentId,
      type: notification.type,
      eventName,
      timestamp: socketNotification.timestamp
    });
  } catch (error) {
    console.error('Failed to send notification:', {
      studentId,
      type: notification.type,
      error: error.message
    });
  }
};
