import express from 'express';
import { protect, admin, instructor } from '../middleware/authMiddleware.js';
import { generateApiKey, getPublicCourses, checkEnrollment } from '../controllers/externalController.js';
import User from '../models/userModel.js';

const router = express.Router();

// Middleware to protect routes with API Key
const apiKeyMiddleware = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ message: 'API Key is missing' });
  }

  const user = await User.findOne({ apiKey });
  if (!user) {
    return res.status(401).json({ message: 'Invalid API Key' });
  }

  req.externalUser = user;
  next();
};

// Key Management
router.post('/keys', protect, generateApiKey);

// External Endpoints
router.get('/courses', apiKeyMiddleware, getPublicCourses);
router.get('/enrollment-check', apiKeyMiddleware, checkEnrollment);

export default router;
