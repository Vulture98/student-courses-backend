import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';
import successResponse from '../utils/successResponse.js';

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  console.log('Fetching notifications for user:', req.user._id);
    
  const unreadNotifications = await Notification.find({
    userId: req.user._id,
    read: false
  })
  .sort({ createdAt: -1 })
  .lean();
  
  const readNotifications = await Notification.find({
    userId: req.user._id,
    read: true
  })
  .sort({ createdAt: -1 })
  .limit(5)
  .lean();
  
  const notifications = [...unreadNotifications, ...readNotifications];
  console.log('Found notifications:', notifications.length);
  
  return successResponse(res, 200, notifications);
}));

router.put('/read', authenticate, asyncHandler(async (req, res) => {
  console.log('Marking all notifications as read for:', req.user._id);
  
  await Notification.updateMany(
    { userId: req.user._id, read: false },
    { read: true }
  );
  
  return successResponse(res, 200, null, 'Notifications marked as read');
}));

router.put('/:id/read', authenticate, asyncHandler(async (req, res) => {
  console.log('Marking notification as read:', req.params.id);
  
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { read: true },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({ 
      success: false, 
      error: 'Notification not found' 
    });
  }

  return successResponse(res, 200, notification, 'Notification marked as read');
}));

export default router;
