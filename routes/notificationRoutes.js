import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';
import successResponse from '../utils/successResponse.js';

const router = express.Router();

// Get unread notifications
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    userId: req.user._id,
    read: false
  }).sort('-createdAt');
  
  return successResponse(res, 200, notifications, 'Notifications retrieved successfully');
}));

// Mark all notifications as read
router.put('/read', authenticate, asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, read: false },
    { read: true }
  );
  
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
