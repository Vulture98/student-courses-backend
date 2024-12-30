import asyncHandler from '../../utils/asyncHandler.js';
import User from '../../models/User.js';
import Course from '../../models/Course.js';
import { ValidationError, NotFoundError } from '../../utils/error.js';

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Admin
const getStudents = asyncHandler(async (req, res) => {
    const students = await User.find({ role: 'student' })
        .select('-password')
        .populate('enrolledCourses', 'title description videoUrl thumbnail');
    res.json(students);
});

// @desc    Get student by ID
// @route   GET /api/admin/students/:id
// @access  Admin
const getStudentById = asyncHandler(async (req, res) => {
    const student = await User.findOne({ _id: req.params.id, role: 'student' })
        .select('-password')
        .populate('enrolledCourses', 'title description videoUrl thumbnail');
    
    if (!student) {
        throw new NotFoundError('Student not found');
    }
    
    res.json(student);
});

// @desc    Update student
// @route   PUT /api/admin/students/:id
// @access  Admin
const updateStudent = asyncHandler(async (req, res) => {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    
    if (!student) {
        throw new NotFoundError('Student not found');
    }

    const { name, email, subject } = req.body;
    
    if (name) student.name = name;
    if (email) student.email = email;
    if (subject) student.subject = subject;

    const updatedStudent = await student.save();
    res.json(updatedStudent);
});

// @desc    Toggle student suspension
// @route   PUT /api/admin/students/:id/suspension
// @access  Admin
const toggleStudentSuspension = asyncHandler(async (req, res) => {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    
    if (!student) {
        throw new NotFoundError('Student not found');
    }

    student.isSuspended = !student.isSuspended;
    const updatedStudent = await student.save();
    
    res.json(updatedStudent);
});

// @desc    Assign courses to student
// @route   POST /api/admin/students/:id/courses
// @access  Admin
const assignCoursesToStudent = asyncHandler(async (req, res) => {
    const { courseIds } = req.body;
    const studentId = req.params.id;

    // Validate input
    if (!courseIds || !Array.isArray(courseIds)) {
        return res.status(400).json({
            status: 400,
            message: 'Please provide an array of course IDs',
            error: 'Invalid input'
        });
    }

    // Find the student
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
        return res.status(404).json({
            status: 404,
            message: 'Student not found',
            error: 'Not found'
        });
    }

    // Get current enrolled course IDs
    const currentCourseIds = student.enrolledCourses.map(course => course.toString());
    
    // Filter out courses that are already assigned
    const newCourseIds = courseIds.filter(id => !currentCourseIds.includes(id));

    if (newCourseIds.length === 0) {
        return res.status(400).json({
            status: 400,
            message: 'All selected courses are already assigned to this student',
            error: 'Duplicate courses'
        });
    }

    // Add only new courses
    student.enrolledCourses.push(...newCourseIds);
    await student.save();

    // Fetch updated student with populated courses
    const updatedStudent = await User.findById(studentId)
        .select('-password')
        .populate('enrolledCourses');

    res.json({
        status: 200,
        message: 'Courses assigned successfully',
        data: updatedStudent,
        error: null
    });
});

// @desc    Remove courses from student
// @route   DELETE /api/admin/students/:id/courses
// @access  Admin
const removeCoursesFromStudent = asyncHandler(async (req, res) => {
    const { courseIds } = req.body;
    const studentId = req.params.id;

    if (!courseIds || !Array.isArray(courseIds)) {
        throw new ValidationError('Course IDs must be provided as an array');
    }

    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
        throw new NotFoundError('Student not found');
    }

    // Remove courses from student's enrolled courses
    await User.findByIdAndUpdate(studentId, {
        $pullAll: { enrolledCourses: courseIds }
    });

    const updatedStudent = await User.findById(studentId)
        .populate('enrolledCourses', 'title description videoUrl thumbnail');
    
    res.json(updatedStudent);
});

// export {
//     getStudents,
//     getStudentById,
//     updateStudent,
//     toggleStudentSuspension,
//     assignCoursesToStudent,
//     removeCoursesFromStudent
// };