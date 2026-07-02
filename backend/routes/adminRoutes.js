import express from 'express';
const router = express.Router();
import { protect, admin, superAdmin } from '../middleware/authMiddleware.js';
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
  revokeAdminRole,
  grantCashManagerRole,
  revokeCashManagerRole
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
router.put('/revoke-instructor/:id', protect, superAdmin, revokeInstructor);

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
router.put('/grant-admin/:id', protect, superAdmin, grantAdminRole);
router.put('/revoke-admin/:id', protect, superAdmin, revokeAdminRole);
router.put('/grant-cash-manager/:id', protect, superAdmin, grantCashManagerRole);
router.put('/revoke-cash-manager/:id', protect, superAdmin, revokeCashManagerRole);
router.put('/users/:id/suspend', protect, admin, suspendUser);
router.put('/users/:id/activate', protect, admin, activateUser);

// Payment management (Super Admin only)
router.get('/payments/pending', protect, superAdmin, getPendingPayments);
router.get('/payments/all', protect, superAdmin, getAllPayments);
router.put('/payments/:id/approve', protect, superAdmin, approvePayment);
router.put('/payments/:id/reject', protect, superAdmin, rejectPayment);

// Refund management (Super Admin only)
router.get('/refunds', protect, superAdmin, getRefundRequests);
router.put('/refunds/:id', protect, superAdmin, processRefund);

// Audit logs (Super Admin only)
router.get('/audit-logs', protect, superAdmin, getAuditLogs);

export default router;