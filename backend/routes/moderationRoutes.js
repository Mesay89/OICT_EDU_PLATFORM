import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getAllModerationReports,
  updateModerationReport,
  deleteModerationReport
} from '../controllers/moderationController.js';

const router = express.Router();

router.route('/admin/all').get(protect, admin, getAllModerationReports);
router.route('/admin/:id').put(protect, admin, updateModerationReport);
router.route('/admin/:id').delete(protect, admin, deleteModerationReport);

export default router;
