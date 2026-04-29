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
  enrollUserManual,
  unenrollUserManual,
  getCourseStudents,
} from '../controllers/enrollmentController.js';
import { protect, student, instructor } from '../middleware/authMiddleware.js';

router.route('/').post(protect, student, enrollCourse);
router.route('/manual').post(protect, instructor, enrollUserManual);
router.route('/manual/:courseId/:userId').delete(protect, instructor, unenrollUserManual);
router.route('/course/:courseId/students').get(protect, instructor, getCourseStudents);
router.route('/myenrollments').get(protect, student, getMyEnrollments);
router.route('/:courseId/progress').put(protect, student, updateVideoProgress);
router.route('/:courseId/progress').get(protect, student, getCourseProgress);
router.route('/:courseId/complete').post(protect, student, completeCourse);
router.route('/:courseId/certificate').get(protect, student, getCertificate);
router.route('/:enrollmentId').delete(protect, student, deleteEnrollment);

export default router;
