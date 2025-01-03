import User from '../models/User.js';
import Course from '../models/Course.js';
import asyncHandler from '../utils/asyncHandler.js';
import successResponse from '../utils/successResponse.js';
import { NotFoundError, ValidationError } from '../utils/error.js';
import axios from 'axios';

const getMyCourses = asyncHandler(async (req, res) => {
  const student = await User.findById(req.user._id)
    .select('-password')
    .populate({
      path: 'enrolledCourses.course',
      select: 'title subject videoUrl thumbnail description level isSuspended'
    });

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  return successResponse(res, 200, student, 'My courses retrieved successfully');
});

const toggleCompletion = asyncHandler(async (req, res) => {
  const courseId = req.params.id; // Get courseId from the URL
  const student = await User.findById(req.user._id);

  const course = await Course.findById(courseId);
  if (!student) {
    throw new NotFoundError('Student not found');
  }

  // Find the enrolled course entry
  const enrolledCourseIndex = student.enrolledCourses.findIndex(
    enrollment => enrollment.course.toString() === courseId
  );

  if (enrolledCourseIndex === -1) {
    throw new NotFoundError('Course not found in user enrolled courses');
  }

  // Toggle the completion status
  student.enrolledCourses[enrolledCourseIndex].completed = !student.enrolledCourses[enrolledCourseIndex].completed;

  // Update progress to 100 if completed, 0 if not
  student.enrolledCourses[enrolledCourseIndex].progress = student.enrolledCourses[enrolledCourseIndex].completed ? 100 : 0;

  await student.save();

  const emailData = {
    studentEmail: student.email,
    studentName: student.name,
    courseTitle: course.title,
  };

  // console.log(`emailData:`, emailData);
  // // console.log(`student.enrolledCourses:`, student.enrolledCourses[enrolledCourseIndex].course.title);
  // console.log(`Course Title:`, course.title);
  if (student.enrolledCourses[enrolledCourseIndex].completed) {
    const response = await axios.post('https://hook.eu2.make.com/piumb3b4yx3jujg1cfkj48bf2tsjtfpz', emailData);
    console.log('Email notification sent:', response.data);
  }

  // Return updated student data with populated courses
  const updatedStudent = await User.findById(req.user._id)
    .select('-password')
    .populate({
      path: 'enrolledCourses.course',
      select: 'title subject videoUrl thumbnail description level'
    });

  return successResponse(res, 200, updatedStudent, 'Course completion status updated');
});

// Get all students with optional subject filter
const getStudents = asyncHandler(async (req, res) => {
  const { subject } = req.query;
  const query = { role: 'student' };

  if (subject) {
    query.subject = subject.toLowerCase();
  }

  const students = await User.find(query)
    .select('-password')
    .populate('enrolledCourses', 'title subject videoUrl thumbnail');

  return successResponse(res, 200, students, 'Students retrieved successfully');
});

// Get student by ID with their courses
const getStudentById = asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.id)
    .select('-password')
    .populate('enrolledCourses', 'title subject videoUrl thumbnail');

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  return successResponse(res, 200, student, 'Student retrieved successfully');
});

// Assign courses to student
const assignCourses = asyncHandler(async (req, res) => {
  const { userIds, courseIds } = req.body;

  // Validate input
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new ValidationError('User IDs must be a non-empty array');
  }

  if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
    throw new ValidationError('Course IDs must be a non-empty array');
  }

  // Verify all users exist
  const users = await User.find({
    _id: { $in: userIds },
    role: 'student'
  });

  if (users.length !== userIds.length) {
    throw new NotFoundError('One or more students not found');
  }

  // Verify all courses exist
  const courses = await Course.find({ _id: { $in: courseIds } });

  if (courses.length !== courseIds.length) {
    throw new NotFoundError('One or more courses not found');
  }

  // Bulk update students with courses
  const bulkOperations = userIds.map(studentId => ({
    updateOne: {
      filter: { _id: studentId },
      update: {
        $addToSet: { enrolledCourses: { $each: courseIds } }
      }
    }
  }));

  // Perform bulk write
  const bulkWriteResult = await User.bulkWrite(bulkOperations);

  // Fetch updated students with their courses
  const updatedStudents = await User.find({
    _id: { $in: userIds }
  })
    .select('-password')
    .populate('enrolledCourses', 'title subject videoUrl thumbnail');

  return successResponse(res, 200, updatedStudents, 'Courses assigned successfully');
});

// Unassign courses from students
const unassignCourses = asyncHandler(async (req, res) => {
  const { userIds, courseIds } = req.body;

  // Validate input
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new ValidationError('User IDs must be a non-empty array');
  }

  if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
    throw new ValidationError('Course IDs must be a non-empty array');
  }

  // Verify all users exist
  const users = await User.find({
    _id: { $in: userIds },
    role: 'student'
  });

  if (users.length !== userIds.length) {
    throw new NotFoundError('One or more students not found');
  }

  // Verify all courses exist
  const courses = await Course.find({ _id: { $in: courseIds } });

  if (courses.length !== courseIds.length) {
    throw new NotFoundError('One or more courses not found');
  }

  // Bulk update students to remove courses
  const bulkOperations = userIds.map(studentId => ({
    updateOne: {
      filter: { _id: studentId },
      update: {
        $pullAll: { enrolledCourses: courseIds }
      }
    }
  }));

  // Perform bulk write
  const bulkWriteResult = await User.bulkWrite(bulkOperations);

  // Fetch updated students with their courses
  const updatedStudents = await User.find({
    _id: { $in: userIds }
  })
    .select('-password')
    .populate('enrolledCourses', 'title subject videoUrl thumbnail');

  return successResponse(res, 200, updatedStudents, 'Courses unassigned successfully');
});

// Update student's watch history
const updateWatchHistory = asyncHandler(async (req, res) => {
  const { courseId, watchTime } = req.body;
  const studentId = req.user._id;

  await User.findByIdAndUpdate(studentId, {
    $set: {
      'watchHistory.$[elem].watchTime': watchTime,
      'watchHistory.$[elem].lastWatched': new Date()
    }
  }, {
    arrayFilters: [{ 'elem.course': courseId }],
    new: true
  });

  return successResponse(res, 200, null, 'Watch history updated successfully');
});

// Toggle student suspension
const toggleSuspension = asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.id);

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  student.isSuspended = !student.isSuspended;
  await student.save();

  return successResponse(res, 200, student, 'Student suspension status updated successfully');
});

export {
  getMyCourses,
  toggleCompletion,
  getStudents,
  getStudentById,
  assignCourses,
  unassignCourses,
  updateWatchHistory,
  toggleSuspension
};