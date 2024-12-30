import Course from "../models/Course.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import successResponse from "../utils/successResponse.js";


const getStats = asyncHandler(async (req, res) => {
  // console.log(`inside getStats()  ***********`);
  const [totalStudents, suspendedStudents, totalCourses, suspendedCourses] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isSuspended: true }),
    Course.countDocuments(),
    Course.countDocuments({ isSuspended: true })
  ]);


  return successResponse(res, 200, {
    totalStudents,
    suspendedStudents,
    totalCourses,
    suspendedCourses
  });
});

export {
  getStats
};
