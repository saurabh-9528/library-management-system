const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Helper to sign JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

// Helper to send token response & cookie
const createSendToken = (user, statusCode, res, message) => {
  const token = signToken(user._id);

  // Cookie expires in N hours (from env, defaults to 24)
  const cookieExpiresInHours = parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '24', 10);
  const cookieOptions = {
    expires: new Date(Date.now() + cookieExpiresInHours * 60 * 60 * 1000),
    httpOnly: true, // Prevent client-side JS from reading cookie (secures against XSS)
    secure: process.env.NODE_ENV === 'production', // Send cookie only over HTTPS in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from JSON output
  user.password = undefined;

  return res.status(statusCode).json({
    success: true,
    message,
    token, // Return token for API clients using Authorization header
    data: {
      user,
    },
  });
};

// Register User
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Check email collision
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('A user with this email already exists.', 400));
  }

  const user = await User.create({
    name,
    email,
    password,
    role
  });

  return createSendToken(user, 211, res, 'User registered successfully');
});

// Login User
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Fetch user including password
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  // 2. Issue Token
  return createSendToken(user, 200, res, 'Login successful');
});

// Logout User
exports.logout = catchAsync(async (req, res, next) => {
  // Overwrite the jwt cookie with an expired date
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 5000), // expires in 5 seconds
    httpOnly: true,
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});
