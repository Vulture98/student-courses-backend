import asyncHandler from '../../utils/asyncHandler.js';
import Course from '../../models/Course.js';
import { ValidationError, NotFoundError } from '../../utils/error.js';

// @desc    Create a new course
// @route   POST /api/admin/courses
// @access  Admin
const createCourse = asyncHandler(async (req, res) => {
    const { title, description, subject, videoUrl, thumbnail } = req.body;

    if (!title || !description || !subject || !videoUrl || !thumbnail) {
        throw new ValidationError('All fields are required');
    }

    const course = await Course.create({
        title,
        description,
        subject,
        videoUrl,
        thumbnail
    });

    res.status(201).json(course);
});

// @desc    Update a course
// @route   PUT /api/admin/courses/:id
// @access  Admin
const updateCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
        throw new NotFoundError('Course not found');
    }

    const { title, description, subject, videoUrl, thumbnail } = req.body;
    
    if (title) course.title = title;
    if (description) course.description = description;
    if (subject) course.subject = subject;
    if (videoUrl) course.videoUrl = videoUrl;
    if (thumbnail) course.thumbnail = thumbnail;

    const updatedCourse = await course.save();
    res.json(updatedCourse);
});

// @desc    Delete a course
// @route   DELETE /api/admin/courses/:id
// @access  Admin
const deleteCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
        throw new NotFoundError('Course not found');
    }

    await course.remove();
    res.json({ message: 'Course removed' });
});

// @desc    Toggle course suspension
// @route   PUT /api/admin/courses/:id/suspension
// @access  Admin
const toggleCourseSuspension = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
        throw new NotFoundError('Course not found');
    }

    course.isActive = !course.isActive;
    const updatedCourse = await course.save();
    
    res.json(updatedCourse);
});

// export {
//     createCourse,
//     updateCourse,
//     deleteCourse,
//     toggleCourseSuspension
// };