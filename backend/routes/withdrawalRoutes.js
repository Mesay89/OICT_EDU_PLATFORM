import express from 'express';
const router = express.Router();
import {
  createWithdrawalRequest,
  getMyWithdrawals
} from '../controllers/withdrawalController.js';
import { protect, instructor } from '../middleware/authMiddleware.js';

router.route('/').post(protect, instructor, createWithdrawalRequest);
router.route('/my').get(protect, instructor, getMyWithdrawals);

export default router;
