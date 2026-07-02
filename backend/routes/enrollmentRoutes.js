import express from 'express';
const router = express.Router();
import {
  enrollCourse,
  getMyEnrollments,
  updateVideoProgress,
  getCourseProgress,
  completeCourse,
  getCertificate,
  deleteEnrollment,
  permanentDeleteEnrollment,
  enrollUserManual,
  unenrollUserManual,
  unenrollUserManualBundle,
  getCourseStudents,
  getBundleStudents,
  getInstructorStats,
  getAllEnrollments,
  adminDeleteEnrollment,
} from '../controllers/enrollmentController.js';
import { protect, student, instructor, admin } from '../middleware/authMiddleware.js';

// Admin routes (must come before parameterized routes)
router.route('/admin/all').get(protect, admin, getAllEnrollments);
router.route('/admin/:id').delete(protect, admin, adminDeleteEnrollment);

router.route('/').post(protect, student, enrollCourse);
router.route('/manual').post(protect, instructor, enrollUserManual);
router.route('/manual/:courseId/:userId').delete(protect, instructor, unenrollUserManual);
router.route('/manual/bundle/:bundleId/:userId').delete(protect, instructor, unenrollUserManualBundle);
router.route('/course/:courseId/students').get(protect, instructor, getCourseStudents);
router.route('/bundle/:bundleId/students').get(protect, instructor, getBundleStudents);
router.route('/instructor/stats').get(protect, instructor, getInstructorStats);
router.route('/myenrollments').get(protect, student, getMyEnrollments);
router.route('/:courseId/progress').put(protect, student, updateVideoProgress);
router.route('/:courseId/progress').get(protect, student, getCourseProgress);
router.route('/:courseId/complete').post(protect, student, completeCourse);
router.route('/:courseId/certificate').get(protect, student, getCertificate);
router.route('/:enrollmentId').delete(protect, student, deleteEnrollment);
router.route('/:enrollmentId/permanent').delete(protect, student, permanentDeleteEnrollment);

export default router;
