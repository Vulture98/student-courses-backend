import express from 'express';
import { 
  getMyCourses, 
  getStudents,
  toggleCompletion, 
  getStudentById,
  assignCourses,
  unassignCourses,
  updateWatchHistory,
  toggleSuspension
} from '../controllers/studentController.js';
import { authenticate as protect, authorizeAdmin as admin, authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// app.use('/api/student', studentRouter);

router.get("/courses", authenticate, getMyCourses);
router.patch("/toggle-completion/:id", authenticate, toggleCompletion);

router.use(protect, admin);
// Admin routes
router.get('/', getStudents);
router.get('/:id', getStudentById);
router.post('/assign/', assignCourses);	//id is student id
router.post('/unassign/', unassignCourses);	//id is student id
router.patch('/suspend/:id', toggleSuspension);	//id is student id

// Student routes
router.post('/watch-history', updateWatchHistory);

export { router as studentRouter };