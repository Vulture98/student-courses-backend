import express from 'express';
import {  
  getUserStats,
  getStudentCourses,
  getStudent,
  toggleUserSuspension,
  toggleCourseSuspension,
  getStudents,
  assignCourses,
  unassignCourses,
  deleteStudent
} from '../controllers/adminController.js';
import { authenticate, authorizeAdmin } from '../middleware/authMiddleware.js';
import { getStats } from '../controllers/statsController.js';

const router = express.Router();

router.use(authenticate);
router.use(authorizeAdmin);

// app.use('/api/admin', adminRouter);

router.get('/students', getStudents);
// router.get('/stats', getUserStats);
router.get('/stats', getStats);
router.get('/students/:id', getStudent);
router.get('/students/:id/courses', getStudentCourses);
router.put('/students/toggleSuspension/:id', toggleUserSuspension);
router.put('/courses/toggleSuspension/:id', toggleCourseSuspension);
router.post('/assign-courses', assignCourses);
router.post('/unassign-courses', unassignCourses);
router.delete('/students/:id', deleteStudent);

export { router as adminRouter };
