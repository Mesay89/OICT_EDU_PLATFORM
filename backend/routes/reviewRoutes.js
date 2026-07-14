import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  createReview,
  getCourseReviews,
  deleteReview,
  getUserReviewForCourse,
  getAllReviews,
  adminDeleteReview,
  submitFeedback
} from '../controllers/reviewController.js';

const router = express.Router();

router.route('/').post(protect, createReview);
router.route('/feedback').post(protect, submitFeedback);
router.route('/course/:courseId').get(getCourseReviews);
router.route('/myreview/:courseId').get(protect, getUserReviewForCourse);
router.route('/:id').delete(protect, admin, deleteReview);

// Admin routes
router.route('/admin/all').get(protect, admin, getAllReviews);
router.route('/admin/:id').delete(protect, admin, adminDeleteReview);

export default router;
