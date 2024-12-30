import asyncHandler from '../utils/asyncHandler.js';
// import UserCourse from '../models/userCourse.js'; // Updated to UserCourse
import User from '../models/User.js';
import Course from '../models/Course.js';
import { ValidationError, ForbiddenError, ConflictError, NotFoundError } from '../utils/error.js'; // Custom errors
import successResponse from '../utils/successResponse.js';

// @desc    Assign courses to a user
// @route   POST /assign-courses
// @access  Admin
const assignCourses = asyncHandler(async (req, res) => {  
  const { userId, courseIds } = req.body;

  // Check if the user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check if the courses exist
  const courses = await Course.find({ _id: { $in: courseIds } });
  if (courses.length !== courseIds.length) {
    throw new NotFoundError('One or more courses not found');
  }

  try {
    // Create assignments in UserCourse collection
    const assignments = courseIds.map(courseId => ({
      student: userId,
      course: courseId,
    }));

    await UserCourse.insertMany(assignments);
    
    // Update user's enrolledCourses array
    await User.findByIdAndUpdate(userId, {
      $addToSet: { enrolledCourses: { $each: courseIds } }
    });

    // Fetch updated user data with populated courses
    const updatedUser = await User.findById(userId)
      .populate({
        path: 'enrolledCourses',
        select: 'title description subjectCategory levelCategory thumbnail videoUrl'
      });
        
    
    return successResponse(res, 201, updatedUser, 'Courses assigned successfully');
  } catch (error) {
    console.error('Error in assignCourses:', error);
    throw new Error('Failed to assign courses');
  }
});

// @desc    Assign courses to a category for a user
// @route   POST /assign-courses-to-category
// @access  Admin
const assignCoursesToCategory = asyncHandler(async (req, res) => {
  const { userId, courseIds, category } = req.body;

  // Check if the user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check if the courses exist
  const courses = await Course.find({ _id: { $in: courseIds } });
  if (courses.length !== courseIds.length) {
    throw new NotFoundError('One or more courses not found');
  }

  // Check if courses are already assigned to the user in the same category
  const existingAssignments = await UserCourse.find({ student: userId, course: { $in: courseIds }, category });
  // if (existingAssignments.length > 0) {
  //   throw new ConflictError('One or more courses are already assigned to the user in this category');
  // }

  // Assign courses to the user with a category
  const assignments = courseIds.map(courseId => ({
    student: userId,
    course: courseId,
    category,
  }));

  await UserCourse.insertMany(assignments);

  return successResponse(res, 201, null, 'Courses assigned to category successfully');
});

// @desc    Get courses assigned to a user
// @route   GET /users/:userId/courses
// @access  Private
const getCoursesForUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Check if the user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Get courses assigned to the user
  const userCourses = await UserCourse.find({ student: userId }).populate('course');

  return successResponse(res, 200, userCourses, 'Courses fetched successfully');
});

// @desc    Remove course assignments from a user
// @route   DELETE /remove-courses
// @access  Admin
const removeCourseAssignments = asyncHandler(async (req, res) => {
  const { userId, courseIds } = req.body;

  // Check if the user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Remove the course assignments
  const result = await UserCourse.deleteMany({
    student: userId,
    course: { $in: courseIds }
  });

  return successResponse(res, 200, { removedCount: result.deletedCount }, 'Course assignments removed successfully');
});

// @desc    Delete course assignment for a user
// @route   DELETE /api/user-course
// @access  Admin
const deleteCourseAssignment = asyncHandler(async (req, res) => {
  const { studentId, courseId } = req.body;

  // Validate input
  if (!studentId || !courseId) {
    throw new ValidationError('Student ID and Course ID are required');
  }

  // Check if the assignment exists
  const assignment = await UserCourse.findOne({ student: studentId, course: courseId });
  if (!assignment) {
    throw new NotFoundError('Course assignment not found');
  }

  // Delete the assignment
  await UserCourse.findByIdAndDelete(assignment._id);

  // Update the user's enrolledCourses array
  await User.findByIdAndUpdate(studentId, {
    $pull: { enrolledCourses: courseId }
  });

  return successResponse(res, 200, null, 'Course assignment deleted successfully');
});

export {
  assignCourses,
  assignCoursesToCategory,
  getCoursesForUser,
  removeCourseAssignments,
  deleteCourseAssignment,
};