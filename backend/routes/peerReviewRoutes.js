import express from 'express';
import { protect, instructor } from '../middleware/authMiddleware.js';
import {
  createPeerReview,
  togglePublishPeerReview,
  getCoursePeerReviews,
  getPeerReviewSubmissions,
  getMyPeerReviewTasks,
  getPeersToReview,
  submitPeerReview,
  getMyPeerFeedback,
} from '../controllers/peerReviewController.js';

const router = express.Router();

// ── Instructor ────────────────────────────────────────────────────────────────
router.route('/')
  .post(protect, instructor, createPeerReview);

router.route('/course/:courseId')
  .get(protect, instructor, getCoursePeerReviews);

router.route('/:id/publish')
  .put(protect, instructor, togglePublishPeerReview);

router.route('/:id/submissions')
  .get(protect, instructor, getPeerReviewSubmissions);

// ── Student ───────────────────────────────────────────────────────────────────
router.route('/my-tasks/:courseId')
  .get(protect, getMyPeerReviewTasks);

router.route('/:id/peers-to-review')
  .get(protect, getPeersToReview);

router.route('/:id/submit')
  .post(protect, submitPeerReview);

router.route('/:id/my-feedback')
  .get(protect, getMyPeerFeedback);

export default router;
