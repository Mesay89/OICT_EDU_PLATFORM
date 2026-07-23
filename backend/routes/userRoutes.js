import express from 'express';
import path from 'path';
import multer from 'multer';
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

// Multer storage for instructor registration documents
const docStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const docFileFilter = (req, file, cb) => {
  const allowed = /pdf|doc|docx|jpg|jpeg|png/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = /pdf|msword|officedocument|image/.test(file.mimetype);
  if (extOk && mimeOk) cb(null, true);
  else cb(new Error('Only PDF, Word documents, and images are allowed'), false);
};

const uploadDocs = multer({
  storage: docStorage,
  fileFilter: docFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB per file
});

// Registration – supports multipart/form-data for instructor document uploads
router.route('/').post(
  uploadDocs.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'certificates', maxCount: 5 },
  ]),
  registerUser
);
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
