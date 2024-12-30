import express from 'express';
import { register, login, logout, getMe, bulkRegister } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// app.use('/api/auth', authRouter);
router.post('/register', register);
// router.post('/bulk-register', bulkRegister);
router.post('/login', login);
router.get('/verify', authenticate, getMe);
router.post('/logout', logout);

export { router as authRouter };
