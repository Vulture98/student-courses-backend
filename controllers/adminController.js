import User from '../models/User.js';
import Course from '../models/Course.js';
import asyncHandler from '../utils/asyncHandler.js';
import successResponse from '../utils/successResponse.js';
import { NotFoundError, BadRequestError } from '../utils/error.js';
import { notifyStudent } from '../config/socketManager.js';
import Notification from '../models/Notification.js';

const getStudents = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'student' })
    .select('-password')
    .populate({
      path: 'enrolledCourses.course',
      select: 'title subject videoUrl thumbnail description level'
    });

  return successResponse(res, 200, users, 'Students retrieved successfully');
});

const getUserStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments({ role: 'student' });
  const totalCourses = await Course.countDocuments();
  const suspendedUsers = await User.countDocuments({
    role: 'student',
    isSuspended: true
  });
  const suspendedCourses = await Course.countDocuments({ isSuspended: true });
  
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

  // console.log('Getting student courses:', id);  
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

const assignCoursesToStudent = asyncHandler(async (req, res) => {
  // console.log('Assigning courses');
  const { studentId, courseIds } = req.body;
  // console.log({ studentId, courseIds });

  if (!studentId || !courseIds || !Array.isArray(courseIds)) {
    throw new BadRequestError('Missing student or course IDs');
  }
  
  const student = await User.findOne({ _id: studentId, role: 'student' });
  if (!student) {
    throw new NotFoundError('Student not found');
  }
  
  const courses = await Course.find({ _id: { $in: courseIds } });
  
  const updatedStudent = await User.findByIdAndUpdate(
    studentId,
    {
      $push: {
        enrolledCourses: {
          $each: courseIds.map(courseId => ({
            course: courseId,
            progress: 0,
            completed: false
          }))
        }
      }
    },
    { new: true }
  ).populate({
    path: 'enrolledCourses.course',
    select: 'title subject videoUrl thumbnail description level'
  });
  
  // console.log('Notifying student:', student.name);
  for (const course of courses) {
    notifyStudent(studentId, {
      title: course.title,
      _id: course._id,
      description: course.description
    });
  }

  return successResponse(res, 200, updatedStudent, 'Courses assigned successfully');
});

const assignCourses = asyncHandler(async (req, res) => {
  // console.log('Bulk assigning courses');
  const { studentIds, courseIds } = req.body;
  // console.log({ students: studentIds?.length, courses: courseIds?.length });
  
  const studentIdArray = Array.isArray(studentIds) ? studentIds : [studentIds];
  
  if (!studentIdArray.length || !courseIds || !Array.isArray(courseIds)) {
    throw new BadRequestError('Invalid student or course IDs');
  }
  
  const courses = await Course.find({ _id: { $in: courseIds } });
  if (courses.length !== courseIds.length) {
    throw new BadRequestError('Some courses not found');
  }
  
  const students = await User.find({ _id: { $in: studentIdArray } });
  if (students.length === 0) {
    throw new NotFoundError('No matching students found');
  }
  // console.log('Students found:', students.map(s => s.name));

  let assignedCount = 0;
  let alreadyAssignedCount = 0;
  const results = [];
  
  for (const student of students) {    
    const currentCourseIds = student.enrolledCourses.map(enrollment =>
      enrollment.course.toString()
    );
    
    const newCourseIds = courseIds.filter(id =>
      !currentCourseIds.includes(id.toString())
    );
    
    if (newCourseIds.length > 0) {      
      const newEnrollments = newCourseIds.map(courseId => ({
        course: courseId,
        completed: false,
        progress: 0
      }));
      
      const updatedStudent = await User.findByIdAndUpdate(
        student._id,
        {
          $push: {
            enrolledCourses: {
              $each: newEnrollments
            }
          }
        },
        { new: true }
      ).populate({
        path: 'enrolledCourses.course',
        select: 'title subject videoUrl thumbnail description level'
      });
      
      // console.log('Notifying student:', student.name);
      const assignedCourses = newCourseIds.map(courseId => {
        const course = courses.find(c => c._id.toString() === courseId.toString());
        return {
          _id: course._id,
          title: course.title,
          description: course.description,
          subject: course.subject,
          level: course.level
        };
      });

      const notificationData = {
        message: `${assignedCourses.length} course${assignedCourses.length > 1 ? 's' : ''} assigned`,
        type: 'COURSE_ASSIGNED',
        data: {
          courses: assignedCourses.map(c => ({
            _id: c._id,
            title: c.title
          }))
        },
        timestamp: new Date().toISOString()
      };

      try {
        await Notification.create({
          userId: student._id,
          message: notificationData.message,
          type: notificationData.type,
          data: notificationData.data,
          createdAt: notificationData.timestamp
        });
      } catch (error) {
        // console.log('Notification failed:', error.message);
      }
      
      try {
        notifyStudent(student._id, notificationData);
      } catch (error) {
        // console.log('Notification failed:', error.message);
      }

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
  
  if (alreadyAssignedCount === students.length) {
    return successResponse(res, 400, { results }, 'Students already enrolled in these courses');
  } else if (assignedCount > 0) {
    const msg = students.length === 1
      ? `Added ${courseIds.length - results[0].alreadyAssigned} courses`
      : `Enrolled ${assignedCount} of ${students.length} students`;
    return successResponse(res, 200, { results }, msg);
  }

  return successResponse(res, 400, { results }, 'No courses assigned');
});

const unassignCourses = asyncHandler(async (req, res) => {
  // console.log('Bulk unassigning courses');
  const { studentIds, courseIds } = req.body;
  // console.log({ students: studentIds?.length, courses: courseIds?.length });

  if (!studentIds || !courseIds || !Array.isArray(studentIds) || !Array.isArray(courseIds)) {
    throw new BadRequestError('Invalid input - need student and course IDs');
  }
  
  const studentIdArray = studentIds.map(id => id.toString());
  const courseIdArray = courseIds.map(id => id.toString());
  
  const courses = await Course.find({ _id: { $in: courseIdArray } });
  if (courses.length !== courseIds.length) {
    throw new BadRequestError('Some courses not found');
  }
  
  const students = await User.find({ _id: { $in: studentIdArray } });
  if (students.length === 0) {
    throw new NotFoundError('No matching students found');
  }
  // console.log('Students found:', students.map(s => s.name));

  let unassignedCount = 0;
  let notEnrolledCount = 0;
  const results = [];
  
  for (const student of students) {    
    const currentEnrollments = student.enrolledCourses;
    const coursesToRemove = currentEnrollments.filter(enrollment =>
      courseIdArray.includes(enrollment.course.toString())
    );
    
    if (coursesToRemove.length > 0) {      
      const updatedStudent = await User.findByIdAndUpdate(
        student._id,
        {
          $pull: {
            enrolledCourses: {
              course: { $in: courseIdArray }
            }
          }
        },
        { new: true }
      ).populate({
        path: 'enrolledCourses.course',
        select: 'title subject videoUrl thumbnail description level'
      });
      
      // console.log('Notifying about course removal:', student.name);
      const unassignedCourses = coursesToRemove.map(enrollment => {
        const course = courses.find(c => c._id.toString() === enrollment.course.toString());
        return {
          _id: course._id,
          title: course.title,
          description: course.description,
          subject: course.subject,
          level: course.level
        };
      });

      const notificationData = {
        message: `${unassignedCourses.length} course${unassignedCourses.length > 1 ? 's' : ''} removed`,
        type: 'COURSE_UNASSIGNED',
        data: {
          courses: unassignedCourses.map(c => ({
            _id: c._id,
            title: c.title
          }))
        },
        timestamp: new Date().toISOString()
      };

      try {
        await Notification.create({
          userId: student._id,
          message: notificationData.message,
          type: notificationData.type,
          data: notificationData.data,
          createdAt: notificationData.timestamp
        });
      } catch (error) {
        // console.log('Notification failed:', error.message);
      }
      
      try {
        notifyStudent(student._id, notificationData);
      } catch (error) {
        // console.log('Notification failed:', error.message);
      }

      unassignedCount++;
      results.push({
        studentId: student._id,
        studentName: student.name,
        unassignedCourses: unassignedCourses.length,
        notEnrolled: courseIds.length - unassignedCourses.length
      });
    } else {
      notEnrolledCount++;
      results.push({
        studentId: student._id,
        studentName: student.name,
        unassignedCourses: 0,
        notEnrolled: courseIds.length
      });
    }
  }

  if (unassignedCount === 0) {
    const message = students.length === 1
      ? 'Student was not enrolled in any of the specified courses'
      : 'No students were enrolled in the specified courses';
    return successResponse(res, 200, { results }, message);
  } else if (unassignedCount > 0) {
    const message = students.length === 1
      ? `Successfully unassigned ${results[0].unassignedCourses} courses from student`
      : `Successfully unassigned courses from ${unassignedCount} out of ${students.length} students`;
    return successResponse(res, 200, { results }, message);
  }
});

const deleteStudent = asyncHandler(async (req, res) => {
  const studentId = req.params.id;
  
  const student = await User.findOne({ _id: studentId, role: 'student' });
  if (!student) {
    return res.status(404).json({
      success: false,
      error: 'Student not found'
    });
  }
  
  await User.findByIdAndDelete(studentId);
  
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
  assignCoursesToStudent,
  assignCourses,
  unassignCourses,
  deleteStudent
};