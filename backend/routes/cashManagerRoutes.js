import express from 'express';
const router = express.Router();
import { protect, cashManager } from '../middleware/authMiddleware.js';
import { 
  getCashManagerDashboard,
  getAllPayments,
  getAllWithdrawals,
  processWithdrawal,
  getAllRefunds,
  processRefund,
  getAllCoupons,
  getFinancialReports
} from '../controllers/cashManagerController.js';
import { approvePayment, rejectPayment } from '../controllers/adminPaymentController.js';

// Cash Manager dashboard overview
router.get('/dashboard', protect, cashManager, getCashManagerDashboard);

// Payments Management
router.get('/payments', protect, cashManager, getAllPayments);
router.put('/payments/:id/approve', protect, cashManager, approvePayment);
router.put('/payments/:id/reject', protect, cashManager, rejectPayment);

// Withdrawals Management
router.get('/withdrawals', protect, cashManager, getAllWithdrawals);
router.put('/withdrawals/:id/process', protect, cashManager, processWithdrawal);

// Refunds Management
router.get('/refunds', protect, cashManager, getAllRefunds);
router.put('/refunds/:id/process', protect, cashManager, processRefund);

// Coupons Management
router.get('/coupons', protect, cashManager, getAllCoupons);

// Financial Reports
router.get('/reports', protect, cashManager, getFinancialReports);

export default router;
