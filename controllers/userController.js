import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import successResponse from '../utils/successResponse.js';

// Get all users (Admin only)
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password'); // Exclude passwords from the response
  const formattedUsers = [{ count: users.length }, ...users];
  return successResponse(res, 200, formattedUsers, 'Users retrieved successfully');
});

// Get single user by ID (Admin only)
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password'); // Exclude password from the response

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  return successResponse(res, 200, user, 'User retrieved successfully');
});

// Update user (Admin only)
const updateUser = asyncHandler(async (req, res) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Update user fields
  user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).select('-password'); // Exclude password from the response

  return successResponse(res, 200, user, 'User updated successfully');
});

// Delete user (Admin only)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  await user.remove();
  return successResponse(res, 204, null, 'User deleted successfully');
});

// Update user role (Admin only)
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  let user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Update user role
  user.role = role;
  await user.save();

  return successResponse(res, 200, user, 'User role updated successfully');
});

// Suspend user (Admin only)
const suspendUser = asyncHandler(async (req, res) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Suspend user
  user.isSuspended = true;
  await user.save();

  return successResponse(res, 200, user, 'User suspended successfully');
});

// Unsuspend user (Admin only)
const unsuspendUser = asyncHandler(async (req, res) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Unsuspend user
  user.isSuspended = false;
  await user.save();

  return successResponse(res, 200, user, 'User unsuspended successfully');
});

// Toggle course completion status
const toggleCourseCompletion = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  const userCourse = await UserCourse.findOne({
    student: userId,
    course: courseId
  });

  if (!userCourse) {
    throw new NotFoundError('Course not found or not assigned to user');
  }

  userCourse.completed = !userCourse.completed;
  userCourse.completedAt = userCourse.completed ? new Date() : null;
  await userCourse.save();

  // Get updated course details
  const updatedCourse = await UserCourse.findById(userCourse._id)
    .populate('course', 'title description subjectCategory levelCategory thumbnail videoUrl');

  return successResponse(res, 200, updatedCourse, 'Course completion status updated');
});

export {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  suspendUser,
  unsuspendUser,
  toggleCourseCompletion
};