import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateHashPassword, comparePassword } from '../utils/hashedPwds.js';
import successResponse from '../utils/successResponse.js';
import { AuthError, ConflictError, ValidationError } from '../utils/error.js';
import generateToken from '../utils/createToken.js';
import bcrypt from 'bcryptjs';

// Register user
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ConflictError('User already exists');
  }
  // const hashedPassword = await generateHashPassword(password);
  const user = await User.create({
    name,
    email,
    password,
    role: 'student'  // Default role
  });

  return successResponse(res, 201, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
  }, 'User registered successfully');
});

const bulkRegister = asyncHandler(async (req, res) => {
  const users = req.body; // Expecting an array of user objects

  const createdUsers = [];
  const skippedUsers = [];

  for (const userData of users) {
    const { name, email, password, subject } = userData;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      skippedUsers.push({
        email,
        reason: 'User already exists'
      });
      continue; // Skip this user and continue with the next
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password, // You can hash the password here if needed
      subject,
      role: 'student'  // Default role
    });

    createdUsers.push({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subject: user.subject
    });
  }

  // Determine the appropriate response based on created and skipped users
  const responseData = {
    users: createdUsers,
    skippedUsers: skippedUsers
  };

  const responseMessage = skippedUsers.length > 0
    ? `${createdUsers.length} users registered successfully. ${skippedUsers.length} users skipped.`
    : 'Users registered successfully';

  return successResponse(res, 201, responseData, responseMessage);
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError('Please provide email and password');
  }

  const existingUser = await User.findOne({ email }).select('+password');
  if (!existingUser) {
    throw new AuthError('Invalid credentials');
  }

  if (existingUser.isSuspended) {
    throw new AuthError('Your account has been suspended');
  }

  if(existingUser.isGoogle) {
    throw new AuthError('Please login using Google');
  }

  // const isMatch = await comparePassword(password, user.password);  
  const isMatch = await bcrypt.compare(password, existingUser.password);  
  if (!isMatch) {
    throw new AuthError('Invalid credentials');
  }

  const token = generateToken(res, existingUser._id);

  return successResponse(res, 200, {
    token,
    user: {
      id: existingUser._id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role
    }
  }, 'Login successful');
});

const loginUser = asyncHandler(async (req, res) => {  
  const { email, password } = req.body;  
  const existingUser = await User.findOne({ email });  

  if (!(await bcrypt.compare(password, existingUser.password))) {    
    return res.status(401).json({ message: "Invalid email or password" });
  }
  const token = generateToken(res, existingUser._id);  
  res.status(201).json({ message: `welcome ${existingUser.username}` });
  return;
});

// Logout user
const logout = asyncHandler(async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict'
  });

  return successResponse(res, 200, null, 'User logged out successfully');
});

// Get current user
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return successResponse(res, 200, user, 'User details retrieved successfully');
});

export {
  register,
  bulkRegister,
  login,
  logout,
  getMe,
}