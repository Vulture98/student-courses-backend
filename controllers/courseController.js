import Course from '../models/Course.js';
// import UserCourse from '../models/userCourse.js';
import successResponse from '../utils/successResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/error.js';

// Get all courses with pagination and search
const getCourses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 9;
  const search = req.query.search || '';
  const skip = (page - 1) * limit;

  // Build search query
  const searchQuery = search
    ? {
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { level: { $regex: search, $options: 'i' } }
      ]
    }
    : {};

  const [courses, total] = await Promise.all([
    Course.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Course.countDocuments(searchQuery)
  ]);

  return successResponse(res, 200, {
    courses,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    hasMore: skip + courses.length < total
  });
});

// Create a new course
const createCourse1 = asyncHandler(async (req, res) => {
  const course = await Course.create(req.body);
  return successResponse(res, 201, course);
});

const createCourse = asyncHandler(async (req, res) => {
  const { title, description, subject, level, videoUrl, thumbnail } = req.body;

  if (!title || !description || !subject || !level || !videoUrl || !thumbnail) {
    throw new ValidationError('All fields are required');
  }
  // Convert subject and level to lowercase
  if (req.body.subject) {
    req.body.subject = req.body.subject.toLowerCase();
  }
  if (req.body.level) {
    req.body.level = req.body.level.toLowerCase();
  }

  // Check if title is being updated and if it already exists (excluding current course)
  if (req.body.title) {
    const existingCourse = await Course.findOne({
      title: req.body.title,
      _id: { $ne: req.params.id } // exclude current course
    });

    if (existingCourse) {
      throw new ValidationError('A course with this title already exists');
    }
  }

  const course = await Course.create({
    title,
    description,
    subject,
    level,
    videoUrl,
    thumbnail
  });

  // res.status(201).json(course);
  return successResponse(res, 201, course);
});

const bulkCreateCourses = asyncHandler(async (req, res) => {
  const courses = await Course.insertMany(req.body);
  return successResponse(res, 201, courses);
});

// Get a single course
const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }
  return successResponse(res, 200, course);
});

// Update a course
const updateCourse = asyncHandler(async (req, res) => {
  // Convert subject and level to lowercase
  if (req.body.subject) {
    req.body.subject = req.body.subject.toLowerCase();
  }
  if (req.body.level) {
    req.body.level = req.body.level.toLowerCase();
  }

  // Check if title is being updated and if it already exists (excluding current course)
  if (req.body.title) {
    const existingCourse = await Course.findOne({
      title: req.body.title,
      _id: { $ne: req.params.id } // exclude current course
    });

    if (existingCourse) {
      throw new ValidationError('A course with this title already exists');
    }
  }

  const course = await Course.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!course) {
    // return res.status(404).json({
    //   success: false,
    //   message: 'Course not found'
    // });
    throw new ValidationError('Course not found');
  }

  return successResponse(res, 200, course, "successfully updated");
});

// Delete a course
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const result = await Course.findOneAndDelete({ _id: req.params.id });

  // // Delete the course
  // await course.remove();

  return successResponse(res, 200, null, 'Course deleted successfully');
});

// Toggle course status (active/inactive)
const toggleCourseStatus = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  course.isActive = !course.isActive;
  await course.save();

  return successResponse(res, 200, course);
});

const toggleSuspended = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    course.isSuspended = !course.isSuspended;
    await course.save();

    res.json({
      success: true,
      message: `Course ${course.isSuspended ? 'suspended' : 'activated'} successfully`,
      data: { course }
    });
  } catch (error) {
    console.error('Error toggling course status:', error);
    res.status(500).json({ success: false, message: 'Error toggling course status' });
  }
};

// Bulk assign courses to students
// const bulkAssignCourses = asyncHandler(async (req, res) => {
//   const { studentIds, courseIds } = req.body;

//   if (!studentIds?.length || !courseIds?.length) {
//     return res.status(400).json({ message: 'Please provide both students and courses' });
//   }

//   const assignments = [];
//   for (const studentId of studentIds) {
//     for (const courseId of courseIds) {
//       assignments.push({
//         student: studentId,
//         course: courseId,
//         completed: false
//       });
//     }
//   }

//   await UserCourse.insertMany(assignments, { ordered: false });
//   return successResponse(res, 200, null, 'Courses assigned successfully');
// });

export {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  toggleSuspended,
  bulkCreateCourses,
}