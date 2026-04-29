import express from 'express';
const router = express.Router();
import { protect, admin } from '../middleware/authMiddleware.js';
import { getRevenueReport } from '../controllers/reportController.js';

router.get('/revenue', protect, admin, getRevenueReport);

export default router;
