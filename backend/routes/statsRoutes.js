import express from 'express';
const router = express.Router();
import { getAdminStats, getPublicStats } from '../controllers/statsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/').get(protect, admin, getAdminStats);
router.route('/public').get(getPublicStats);

export default router;
