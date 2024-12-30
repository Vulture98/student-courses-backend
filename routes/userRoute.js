import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  suspendUser,
  unsuspendUser,
} from '../controllers/userController.js';
import { authenticate, authorizeAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();


router.use(authenticate, authorizeAdmin);
router.route('/').get(getUsers);

router.route('/:id').get(getUserById);
router.route('/:id').put(updateUser);
router.route('/:id').delete(deleteUser);
// router.route('/:id/role').put(updateUserRole);

router.route('/:id/suspend').put(suspendUser);
router.route('/:id/unsuspend').put(unsuspendUser);

// export { router as userRouter };