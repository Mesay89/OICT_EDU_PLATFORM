import express from 'express';
const router = express.Router();
import { protect, admin } from '../middleware/authMiddleware.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

router.route('/')
  .get(getSettings)
  .put(protect, admin, updateSettings);

export default router;
