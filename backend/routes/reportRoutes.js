import express from 'express';
const router = express.Router();
import { protect, admin } from '../middleware/authMiddleware.js';
import { getRevenueReport, getPublicStats } from '../controllers/reportController.js';

router.get('/revenue', protect, admin, getRevenueReport);
router.get('/public-stats', getPublicStats);

export default router;
