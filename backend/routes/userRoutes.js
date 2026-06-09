import express from 'express';
const router = express.Router();
import {
  authUser,
  registerUser,
  verifyOTP,
  resendOTP,
  getUserProfile,
  getUsers,
  forgotPassword,
  resetPassword,
  exportUserData,
  deleteAccount,
  requestWithdrawal,
  getWithdrawals,
  processWithdrawal,
  requestAppeal,
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/').post(registerUser);
router.post('/login', authUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.route('/profile').get(protect, getUserProfile);
router.post('/withdraw', protect, requestWithdrawal);
router.route('/admin/all').get(protect, admin, getUsers);
router.route('/admin/withdrawals').get(protect, admin, getWithdrawals);
router.route('/admin/withdrawals/:id').put(protect, admin, processWithdrawal);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.post('/request-appeal', requestAppeal);

// GDPR Routes
router.route('/export').get(protect, exportUserData);
router.route('/delete-account').delete(protect, deleteAccount);

export default router;
