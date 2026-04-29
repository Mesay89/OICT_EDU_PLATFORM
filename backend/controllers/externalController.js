import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Course from '../models/courseModel.js';
import Enrollment from '../models/enrollmentModel.js';
import crypto from 'crypto';

// @desc    Generate a new API Key for the user
// @route   POST /api/external/keys
// @access  Private (Instructor/Admin)
const generateApiKey = asyncHandler(async (req, res) => {
  const apiKey = crypto.randomBytes(32).toString('hex');
  const user = await User.findById(req.user._id);
  
  user.apiKey = apiKey;
  await user.save();
  
  res.json({ apiKey });
});

// @desc    Public API: Get all published courses
// @route   GET /api/external/courses
// @access  Public (via API Key)
const getPublicCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ status: 'published' })
    .select('title description category price image level rating')
    .populate('instructor', 'name');
  res.json(courses);
});

// @desc    Public API: Check enrollment for a student
// @route   GET /api/external/enrollment-check
// @access  Public (via API Key)
const checkEnrollment = asyncHandler(async (req, res) => {
  const { email, courseId } = req.query;
  
  if (!email || !courseId) {
    res.status(400);
    throw new Error('Email and CourseId are required');
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ enrolled: false, message: 'User not found' });
  }

  const enrollment = await Enrollment.findOne({ user: user._id, course: courseId });
  res.json({ 
    enrolled: !!enrollment,
    progress: enrollment ? enrollment.progress : 0,
    completed: enrollment ? enrollment.isCompleted : false
  });
});

export {
  generateApiKey,
  getPublicCourses,
  checkEnrollment
};
