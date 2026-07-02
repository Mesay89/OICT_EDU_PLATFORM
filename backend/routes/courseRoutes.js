import express from 'express';
const router = express.Router();
import {
  getCourses,
  getCourseById,
  createCourse,
  getMyCourses,
  addModule,
  updateCourse,
  deleteCourse,
  getFeaturedCourses,
  getRecommendations,
  getPendingCourseModules,
  updateCourseModuleStatus
} from '../controllers/courseController.js';
import { protect, optionalProtect, instructor, admin } from '../middleware/authMiddleware.js';
import { cacheRoute } from '../middleware/cacheMiddleware.js';

// Cache catalog queries (1 hour)
router.route('/').get(cacheRoute(3600), getCourses).post(protect, instructor, createCourse);
router.route('/instructor/mycourses').get(protect, instructor, getMyCourses);
router.route('/featured').get(getFeaturedCourses);
// Cache recommendations (1 hour)
router.route('/recommendations').get(protect, cacheRoute(3600), getRecommendations);

// Admin Routes for Module Approval (MUST be before /:id wildcard)
router.route('/admin/pending-modules').get(protect, admin, getPendingCourseModules);
router.route('/admin/modules/:courseId/:moduleId/status').put(protect, admin, updateCourseModuleStatus);

// Cache individual courses (1 hour)
router.route('/:id').get(optionalProtect, cacheRoute(3600), getCourseById).put(protect, instructor, updateCourse).delete(protect, instructor, deleteCourse);
router.route('/:id/modules').post(protect, instructor, addModule);

export default router;
