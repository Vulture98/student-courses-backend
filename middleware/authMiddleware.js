import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import { AuthError } from '../utils/error.js';

const authenticate = asyncHandler(async (req, res, next) => {
  console.log(`inside authenticate() ***********`);
  try {
    const token = req.cookies.jwt;
    // console.log(`req.cookies:`, req.cookies);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Please login to access this resource'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log('decoded:', decoded);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    // console.log(`user:`, user);

    req.user = user;
    next();
  } catch (error) {
    throw new AuthError('Not authorized to access this route');
  }
});

const authorizeAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: `Role ${req.user.role} is not allowed to access this resource`
    });
  }
  next();
});

export {
  authenticate,
  authorizeAdmin
}