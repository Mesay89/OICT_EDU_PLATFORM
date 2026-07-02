import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getAllCertificates,
  revokeCertificate,
  activateCertificate,
  deleteCertificate
} from '../controllers/certificateController.js';

const router = express.Router();

// Admin routes (must come before parameterized routes)
router.route('/admin/all').get(protect, admin, getAllCertificates);
router.route('/admin/:id/revoke').put(protect, admin, revokeCertificate);
router.route('/admin/:id/activate').put(protect, admin, activateCertificate);
router.route('/admin/:id').delete(protect, admin, deleteCertificate);

export default router;
