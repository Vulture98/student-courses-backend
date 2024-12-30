import express from 'express';
const router = express.Router();
import { getStats } from '../controllers/statsController.js';
import { protect, authorize } from '../middleware/auth.js';

router.get('/', protect, authorize('admin'), getStats);

// export { router as statsRouter };
