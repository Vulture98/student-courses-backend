import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';
import successResponse from '../utils/successResponse.js';

const router = express.Router();

// Get notifications (unread + 5 read)
router.get('/', authenticate, asyncHandler(async (req, res) => {
  console.log('\n=== FETCHING NOTIFICATIONS ===');
  console.log('User ID:', req.user._id);
  
  // Get unread notifications
  const unreadNotifications = await Notification.find({
    userId: req.user._id,
    read: false
  })
  .sort({ createdAt: -1 })
  .lean();

  // Get last 5 read notifications
  const readNotifications = await Notification.find({
    userId: req.user._id,
    read: true
  })
  .sort({ createdAt: -1 })
  .limit(5)
  .lean();

  // Combine both
  const notifications = [...unreadNotifications, ...readNotifications];
  
  console.log('Found notifications:', notifications);
  return successResponse(res, 200, notifications, 'Notifications retrieved successfully');
}));

// Mark all notifications as read
router.put('/read', authenticate, asyncHandler(async (req, res) => {
  console.log('\n=== MARKING ALL NOTIFICATIONS AS READ ===');
  console.log('User ID:', req.user._id);
  
  const result = await Notification.updateMany(
    { userId: req.user._id, read: false },
    { read: true }
  );
  
  console.log('Updated notifications:', result.modifiedCount);
  return successResponse(res, 200, null, 'Notifications marked as read');
}));

// Mark specific notifications as read
router.put('/:id/read', authenticate, asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { read: true },
    { new: true }
  );
  
  return successResponse(res, 200, notification, 'Notification marked as read');
}));

export default router;
