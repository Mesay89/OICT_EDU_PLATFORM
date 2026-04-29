import express from 'express';
import {
  createAssignment,
  submitAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  getCourseAssignments,
  getMySubmissions,
  getPendingAssignments,
  getAssignmentHistoryAdmin,
  updateAssignmentStatus
} from '../controllers/assignmentController.js';
import {
  createCoupon,
  validateCoupon,
  getMyCoupons
} from '../controllers/couponController.js';
import { protect, instructor, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin Assignment Approval Routes
router.route('/admin/pending-assignments')
  .get(protect, admin, getPendingAssignments);

router.route('/admin/assignments/history')
  .get(protect, admin, getAssignmentHistoryAdmin);

router.route('/assignments/:id/status')
  .put(protect, admin, updateAssignmentStatus);

// Assignment Routes
router.route('/assignments')
  .post(protect, instructor, createAssignment);

router.route('/assignments/:id/submissions')
  .get(protect, instructor, getAssignmentSubmissions);

router.route('/submissions')
  .post(protect, submitAssignment);

router.route('/submissions/:id/grade')
  .put(protect, instructor, gradeSubmission);

router.route('/courses/:courseId/assignments')
  .get(protect, getCourseAssignments);

router.route('/my-submissions/:courseId')
  .get(protect, getMySubmissions);

// Coupon Routes
router.route('/coupons')
  .post(protect, instructor, createCoupon)
  .get(protect, instructor, getMyCoupons);

router.route('/coupons/validate')
  .post(protect, validateCoupon);

export default router;
