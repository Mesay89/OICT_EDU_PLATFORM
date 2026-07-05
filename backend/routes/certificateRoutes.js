import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getAllCertificates,
  revokeCertificate,
  activateCertificate,
  deleteCertificate,
  issueCertificate,
  getMyCertificates,
  verifyCertificate
} from '../controllers/certificateController.js';

const router = express.Router();

// Public routes
router.route('/verify/:certificateNumber').get(verifyCertificate);

// User routes
router.route('/my').get(protect, getMyCertificates);
router.route('/issue').post(protect, issueCertificate);

// Admin routes
router.route('/admin/all').get(protect, admin, getAllCertificates);
router.route('/admin/:id/revoke').put(protect, admin, revokeCertificate);
router.route('/admin/:id/activate').put(protect, admin, activateCertificate);
router.route('/admin/:id').delete(protect, admin, deleteCertificate);

export default router;
