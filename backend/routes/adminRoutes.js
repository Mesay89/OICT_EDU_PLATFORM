import express from 'express';
const router = express.Router();
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getAdminDashboard,
  getPendingInstructors,
  approveInstructor,
  rejectInstructor,
  getInstructorHistoryAdmin,
  revokeInstructor,
  getAllCoursesAdmin,
  grantAdminRole,
  getAllUsers,
  deleteCourse,
  suspendUser,
  activateUser,
  approveCourse,
  rejectCourse,
  getPendingCoursesAdmin,
  getCourseHistoryAdmin,
  getAuditLogs,
  toggleFeaturedCourse,
  revokeAdminRole
} from '../controllers/adminController.js';
import { getRefundRequests, processRefund } from '../controllers/refundController.js';
import { getPendingPayments, approvePayment, rejectPayment, getAllPayments } from '../controllers/adminPaymentController.js';

// Admin dashboard
router.get('/dashboard', protect, admin, getAdminDashboard);

// Instructor management
router.get('/pending-instructors', protect, admin, getPendingInstructors);
router.get('/instructors/history', protect, admin, getInstructorHistoryAdmin);
router.put('/approve-instructor/:id', protect, admin, approveInstructor);
router.put('/reject-instructor/:id', protect, admin, rejectInstructor);
router.put('/revoke-instructor/:id', protect, admin, revokeInstructor);

// Course management
router.get('/courses', protect, admin, getAllCoursesAdmin);
router.get('/courses/pending', protect, admin, getPendingCoursesAdmin);
router.get('/courses/history', protect, admin, getCourseHistoryAdmin);
router.delete('/courses/:id', protect, admin, deleteCourse);
router.put('/courses/:id/approve', protect, admin, approveCourse);
router.put('/courses/:id/reject', protect, admin, rejectCourse);
router.put('/courses/:id/featured', protect, admin, toggleFeaturedCourse);

// User management
router.get('/users', protect, admin, getAllUsers);
router.put('/grant-admin/:id', protect, admin, grantAdminRole);
router.put('/revoke-admin/:id', protect, admin, revokeAdminRole);
router.put('/users/:id/suspend', protect, admin, suspendUser);
router.put('/users/:id/activate', protect, admin, activateUser);

// Refund management
router.get('/refunds', protect, admin, getRefundRequests);
router.put('/refunds/:id', protect, admin, processRefund);

// Payment management
router.get('/payments/pending', protect, admin, getPendingPayments);
router.get('/payments/all', protect, admin, getAllPayments);
router.put('/payments/:id/approve', protect, admin, approvePayment);
router.put('/payments/:id/reject', protect, admin, rejectPayment);

// Audit logs
router.get('/audit-logs', protect, admin, getAuditLogs);

export default router;