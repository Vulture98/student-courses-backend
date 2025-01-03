import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import bcrypt from "bcryptjs";
import successResponse from "../utils/successResponse.js";

// Get user profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 3) {
    return res.status(400).json({
      success: false,
      error: "Password must be at least 3 characters long"
    });
  }

  // Find user
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  // Check if old password matches
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: "Current password is incorrect"
    });
  }

  user.password = newPassword;
  await user.save();

  return successResponse(res, 200, null, 'Password updated successfully');
});

export {
  getProfile,
  changePassword
}