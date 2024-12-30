import express from 'express';
import { assignCourses, assignCoursesToCategory, getCoursesForUser, removeCourseAssignments } from '../controllers/assignController.js';
import { authenticate, authorizeAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// app.use('/api/assign-courses', assignRouter);

router.get('/users/:userId/courses', getCoursesForUser);

router.use(authenticate, authorizeAdmin);
router.post('/assign-courses', assignCourses);
router.post('/assign-courses-to-category', assignCoursesToCategory);
router.delete('/remove-courses', removeCourseAssignments);

export { router as assignRouter };
