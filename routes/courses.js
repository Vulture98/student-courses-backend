import express from 'express';
import {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  toggleSuspended,
  bulkCreateCourses,
} from '../controllers/courseController.js';
import { authenticate, authorizeAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Course routes
router.post('/', authenticate, authorizeAdmin, createCourse);
router.post('/bulk', authenticate, authorizeAdmin, bulkCreateCourses);
router.get('/', getCourses);
router.get('/:id', getCourse);
router.put('/:id', authenticate, authorizeAdmin, updateCourse);
router.delete('/:id', authenticate, authorizeAdmin, deleteCourse);
router.patch('/:id/toggle-suspended', authenticate, authorizeAdmin, toggleSuspended);

export {router as courseRouter};
