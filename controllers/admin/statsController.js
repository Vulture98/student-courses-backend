import asyncHandler from '../../utils/asyncHandler.js';
import User from '../../models/User.js';
import Course from '../../models/Course.js';

// @desc    Get user statistics
// @route   GET /api/admin/stats
// @access  Admin
const getUserStats = asyncHandler(async (req, res) => {
    const stats = {
        totalStudents: await User.countDocuments({ role: 'student' }),
        activeStudents: await User.countDocuments({ role: 'student', isSuspended: false }),
        suspendedStudents: await User.countDocuments({ role: 'student', isSuspended: true }),
        totalCourses: await Course.countDocuments(),
        activeCourses: await Course.countDocuments({ isActive: true }),
        inactiveCourses: await Course.countDocuments({ isActive: false })
    };
    
    res.json(stats);
});

// export { getUserStats };