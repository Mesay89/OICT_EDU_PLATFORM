import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  createReview,
  getCourseReviews,
  deleteReview,
  getUserReviewForCourse
} from '../controllers/reviewController.js';

const router = express.Router();

router.route('/').post(protect, createReview);
router.route('/course/:courseId').get(getCourseReviews);
router.route('/myreview/:courseId').get(protect, getUserReviewForCourse);
router.route('/:id').delete(protect, admin, deleteReview);

export default router;
