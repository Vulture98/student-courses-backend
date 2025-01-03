import User from '../models/User.js';
import Course from '../models/Course.js';
import asyncHandler from '../utils/asyncHandler.js';
import successResponse from '../utils/successResponse.js';
import { NotFoundError } from '../utils/error.js';

// Get all users (Admin only)
const getStudents = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'student' })
    .select('-password')
    .populate({
      path: 'enrolledCourses.course',
      select: 'title subject videoUrl thumbnail description level'
    });

  return successResponse(res, 200, users, 'Students retrieved successfully');
});

// Get user stats (Admin only)
const getUserStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments({ role: 'student' });
  const totalCourses = await Course.countDocuments();
  const suspendedUsers = await User.countDocuments({ 
    role: 'student',
    isSuspended: true 
  });
  const suspendedCourses = await Course.countDocuments({ isSuspended: true });

  // Get most viewed courses
  const mostViewedCourses = await Course.find()
    .sort({ 'stats.totalViews': -1 })
    .limit(5)
    .select('title stats');

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalCourses,
      suspendedUsers,
      suspendedCourses,
      mostViewedCourses,
    },
  });
});

const getStudentCourses = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await User.findById(id)
    .select('-password')
    .populate({
      path: 'enrolledCourses.course',
      select: 'title subject videoUrl thumbnail description level'
    });

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  return successResponse(res, 200, student, 'Student courses retrieved successfully');
});

// Get single student details
const getStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await User.findById(id)
    .select('-password')
    .populate({
      path: 'enrolledCourses.course',
      select: 'title subject videoUrl thumbnail description level'
    });

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  return successResponse(res, 200, student, 'Student details retrieved successfully');
});

// Suspend/Unsuspend user
const toggleUserSuspension = asyncHandler(async (req, res) => {  
  const user = await User.findById(req.params.id);  

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot suspend admin users' });

  user.isSuspended = !user.isSuspended;
  await user.save();  
  const formattedUser = {
    name: user.name,
    email: user.email,
    role: user.role,
    isSuspended: user.isSuspended
  };

  res.status(200).json({
    success: true,
    message: `User ${user.isSuspended ? 'suspended' : 'unsuspended'} successfully`,
    data: formattedUser,
  });
  // return successResponse(res, 200, formattedUser, `User ${user.isSuspended ? 'suspended' : 'unsuspended'} successfully`);
});

// Suspend/Unsuspend course
const toggleCourseSuspension = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  course.isSuspended = !course.isSuspended;
  await course.save();

  res.status(200).json({
    success: true,
    message: `Course ${course.isSuspended ? 'suspended' : 'unsuspended'} successfully`,
    data: course,
  });
});

// Assign courses to a student
const assignCourses = asyncHandler(async (req, res) => {
  const { studentIds, courseIds } = req.body;

  // Handle single student ID passed as string
  const studentIdArray = Array.isArray(studentIds) ? studentIds : [studentIds];

  // Validate courses exist
  const courses = await Course.find({ _id: { $in: courseIds } });
  if (courses.length !== courseIds.length) {
    throw new BadRequestError('One or more courses not found');
  }

  // Find all students
  const students = await User.find({ _id: { $in: studentIdArray } });
  if (students.length === 0) {
    throw new NotFoundError('No students found');
  }

  let assignedCount = 0;
  let alreadyAssignedCount = 0;
  const results = [];

  // Process each student
  for (const student of students) {
    // Get current enrolled course IDs for this student
    const currentCourseIds = student.enrolledCourses.map(enrollment => 
      enrollment.course.toString()
    );

    // Filter out courses that are already assigned to this student
    const newCourseIds = courseIds.filter(id => 
      !currentCourseIds.includes(id.toString())
    );

    // If this student has new courses to assign
    if (newCourseIds.length > 0) {
      // Create new enrollment objects
      const newEnrollments = newCourseIds.map(courseId => ({
        course: courseId,
        completed: false,
        progress: 0
      }));

      // Add new courses to student's enrolledCourses
      const updatedStudent = await User.findByIdAndUpdate(
        student._id,
        {
          $push: { enrolledCourses: { $each: newEnrollments } }
        },
        { new: true }
      ).populate({
        path: 'enrolledCourses.course',
        select: 'title subject videoUrl thumbnail description level'
      });

      assignedCount++;
      results.push({
        studentId: student._id,
        name: student.name,
        newlyAssigned: newCourseIds.length,
        alreadyAssigned: courseIds.length - newCourseIds.length
      });
    } else {
      alreadyAssignedCount++;
      results.push({
        studentId: student._id,
        name: student.name,
        newlyAssigned: 0,
        alreadyAssigned: courseIds.length
      });
    }
  }

  // Determine appropriate response
  if (alreadyAssignedCount === students.length) {
    // All students already had all courses
    return successResponse(res, 400, { results }, 'All selected courses are already assigned to all selected students');
  } else if (assignedCount > 0) {
    // Some students got new courses
    const message = students.length === 1
      ? `Successfully assigned ${courseIds.length - results[0].alreadyAssigned} new courses to student`
      : `Successfully assigned courses to ${assignedCount} out of ${students.length} students`;
    return successResponse(res, 200, { results }, message);
  }

  return successResponse(res, 400, { results }, 'No courses were assigned');
});

// Unassign courses from students
const unassignCourses = asyncHandler(async (req, res) => {
  const { studentIds, courseIds } = req.body;

  // Handle single student ID passed as string
  const studentIdArray = Array.isArray(studentIds) ? studentIds : [studentIds];

  // Validate courses exist
  const courses = await Course.find({ _id: { $in: courseIds } });
  if (courses.length !== courseIds.length) {
    throw new BadRequestError('One or more courses not found');
  }

  // Find all students
  const students = await User.find({ _id: { $in: studentIdArray } });
  if (students.length === 0) {
    throw new NotFoundError('No students found');
  }

  let unassignedCount = 0;
  let notEnrolledCount = 0;
  const results = [];

  // Process each student
  for (const student of students) {
    // Get current enrolled course IDs for this student
    const currentCourseIds = student.enrolledCourses.map(enrollment => 
      enrollment.course.toString()
    );

    // Filter courses that are actually enrolled
    const enrolledCourseIds = courseIds.filter(id => 
      currentCourseIds.includes(id.toString())
    );

    // If this student has courses to unassign
    if (enrolledCourseIds.length > 0) {
      // Remove specified courses from enrolledCourses
      const updatedStudent = await User.findByIdAndUpdate(
        student._id,
        {
          $pull: { 
            enrolledCourses: { 
              'course': { $in: enrolledCourseIds }
            }
          }
        },
        { 
          new: true,
          runValidators: true 
        }
      ).populate({
        path: 'enrolledCourses.course',
        select: 'title subject videoUrl thumbnail description level'
      });

      unassignedCount++;
      results.push({
        studentId: student._id,
        name: student.name,
        unassigned: enrolledCourseIds.length,
        notEnrolled: courseIds.length - enrolledCourseIds.length
      });
    } else {
      notEnrolledCount++;
      results.push({
        studentId: student._id,
        name: student.name,
        unassigned: 0,
        notEnrolled: courseIds.length
      });
    }
  }

  // Determine appropriate response
  if (notEnrolledCount === students.length) {
    // None of the students were enrolled in any of the courses
    return successResponse(res, 400, { results }, 'None of the selected students were enrolled in the selected courses');
  } else if (unassignedCount > 0) {
    // Some students had courses unassigned
    const message = students.length === 1
      ? `Successfully unassigned ${courseIds.length - results[0].notEnrolled} courses from student`
      : `Successfully unassigned courses from ${unassignedCount} out of ${students.length} students`;
    return successResponse(res, 200, { results }, message);
  }

  return successResponse(res, 400, { results }, 'No courses were unassigned');
});

// Delete a student
const deleteStudent = asyncHandler(async (req, res) => {
  const studentId = req.params.id;
  
  // Find student first to ensure they exist
  const student = await User.findOne({ _id: studentId, role: 'student' });
  
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
      error: 'Not found'
    });
  }

  // Delete the student
  await User.findByIdAndDelete(studentId);

  // Return success response with student info
  res.status(200).json({
    success: true,
    message: 'Student deleted successfully',
    data: {
      name: student.name,
      email: student.email,
      role: student.role
    }
  });
});

export {
  getStudents,
  getUserStats,
  getStudentCourses,
  getStudent,
  toggleUserSuspension,
  toggleCourseSuspension,
  assignCourses,
  unassignCourses,
  deleteStudent
};