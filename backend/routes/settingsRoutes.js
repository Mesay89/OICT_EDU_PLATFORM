import express from 'express';
const router = express.Router();
import { protect, admin, anyRole } from '../middleware/authMiddleware.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

router.route('/')
  .get(getSettings)
  .put(protect, anyRole(['admin', 'superAdmin', 'cashManager']), updateSettings);

export default router;
