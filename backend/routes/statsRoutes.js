import express from 'express';
const router = express.Router();
import { getAdminStats, getPublicStats, getInstructorStats } from '../controllers/statsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/').get(protect, admin, getAdminStats);
router.route('/public').get(getPublicStats);
router.route('/instructor').get(protect, getInstructorStats);

export default router;
