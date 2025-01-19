import Course from '../models/Course.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import successResponse from '../utils/successResponse.js';

// Create course (Admin only)
const createCourse = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user.id;
  const course = await Course.create(req.body);
  return successResponse(res, 201, course, 'Course added!');
});

const createMultipleCourses = asyncHandler(async (req, res) => {
  const userId = req.user.id; // Get the user ID from the request
  const user = await User.findById(userId);

  // Add the `createdBy` field to each course in the array
  const coursesData = req.body.map(course => ({
    ...course,
    createdBy: userId,
  }));

  // Create multiple courses in the database
  const courses = await Course.insertMany(coursesData);
  const formattedCourses = [{ count: courses.length }, ...courses];

  // Return success response
  return successResponse(res, 201, formattedCourses, 'All courses added!');
});

// Get all courses (Admin sees all, Students see only enrolled)
const getCourses = asyncHandler(async (req, res) => {
  let query;
  
  if (req.user.role === 'admin') {
    query = Course.find();
  } else {
    query = Course.find({
      _id: { $in: req.user.enrolledCourses },
      isSuspended: false
    });
  }

  const courses = await query.populate('createdBy', 'name email');
  const formattedCourses = [{count: courses.length}, ...courses];
  return successResponse(res, 200, formattedCourses, 'Got courses');
});

// Get single course
const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate('createdBy', 'name email');

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  if (course.isSuspended && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'This course is currently suspended' });
  }

  if (req.user.role === 'student' && !req.user.enrolledCourses.includes(course._id)) {
    return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
  }

  return successResponse(res, 200, course, 'Got course');

});

// Update course (Admin only)
const updateCourse = asyncHandler(async (req, res) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  return successResponse(res, 200, course, 'Course updated!');

});

// Delete course (Admin only)
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  await course.remove();
  return successResponse(res, 204, null, 'Course deleted!');

});

// Update course stats
const updateCourseStats = asyncHandler(async (req, res) => {
  const { watchTime } = req.body;
  const courseId = req.params.id;
  const userId = req.user.id;

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const user = await User.findById(userId);
  const watchHistoryIndex = user.watchHistory.findIndex(
    item => item.course.toString() === courseId
  );

  if (watchHistoryIndex > -1) {
    user.watchHistory[watchHistoryIndex].watchTime += watchTime;
    user.watchHistory[watchHistoryIndex].lastWatched = Date.now();
  } else {
    user.watchHistory.push({
      course: courseId,
      watchTime,
      lastWatched: Date.now()
    });
  }

  course.stats.totalViews += 1;
  course.stats.totalWatchTime += watchTime;
  course.stats.averageWatchTime = course.stats.totalWatchTime / course.stats.totalViews;

  await Promise.all([course.save(), user.save()]);

  return successResponse(res, 200, course, 'Stats updated!');
});

// export {
//   createCourse,
//   createMultipleCourses, 
//   getCourses,
//   getCourse,
//   updateCourse,
//   deleteCourse,
//   updateCourseStats
// };