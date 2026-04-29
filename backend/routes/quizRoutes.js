import express from 'express';
import { protect, instructor } from '../middleware/authMiddleware.js';
import {
  createBankQuestion,
  getBankQuestions,
  updateBankQuestion,
  deleteBankQuestion,
  createQuiz,
  getCourseQuizzes,
  togglePublishQuiz,
  updateQuiz,
  deleteQuiz,
  startQuizAttempt,
  submitQuizAttempt,
  reportWindowBlur,
  getQuizAttempts,
  getMyQuizAttempts,
} from '../controllers/quizController.js';

const router = express.Router();

// ── Question Bank ─────────────────────────────────────────────────────────────
router.route('/questions')
  .post(protect, instructor, createBankQuestion);

router.route('/questions/:courseId')
  .get(protect, instructor, getBankQuestions);

router.route('/questions/:id')
  .put(protect, instructor, updateBankQuestion);

router.route('/questions/delete/:id')
  .delete(protect, instructor, deleteBankQuestion);

// ── Quiz Management ───────────────────────────────────────────────────────────
router.route('/')
  .post(protect, instructor, createQuiz);

router.route('/course/:courseId')
  .get(protect, getCourseQuizzes);

router.route('/:id')
  .put(protect, instructor, updateQuiz)
  .delete(protect, instructor, deleteQuiz);

router.route('/:id/publish')
  .put(protect, instructor, togglePublishQuiz);

// ── Student Attempt Flow ──────────────────────────────────────────────────────
router.route('/:id/start')
  .post(protect, startQuizAttempt);

router.route('/attempts/:attemptId/submit')
  .put(protect, submitQuizAttempt);

router.route('/attempts/:attemptId/blur')
  .put(protect, reportWindowBlur);

router.route('/:id/attempts')
  .get(protect, instructor, getQuizAttempts);

router.route('/:id/my-attempts')
  .get(protect, getMyQuizAttempts);

export default router;
