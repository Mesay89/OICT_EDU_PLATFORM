import express from 'express';
const router = express.Router();
import { getAdminStats } from '../controllers/statsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/').get(protect, admin, getAdminStats);

export default router;
