import express from 'express';
import {
  createLessonComment,
  getLessonComments,
  replyToLessonComment,
  createForumThread,
  getForumThreads,
  addPostToThread,
  askQuestion,
  getQuestions,
  answerQuestion,
  getUserInfo,
} from '../controllers/communicationController.js';
import { protect, instructor } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/user/:id', protect, getUserInfo);

// Lesson Comments
router.route('/comments')
  .post(protect, createLessonComment);

router.route('/comments/:courseId/:moduleId')
  .get(protect, getLessonComments);

router.route('/comments/:id/reply')
  .post(protect, replyToLessonComment);

// Forums
router.route('/forums')
  .post(protect, createForumThread);

router.route('/forums/:courseId')
  .get(protect, getForumThreads);

router.route('/forums/:id/posts')
  .post(protect, addPostToThread);

// Q&A
router.route('/qa')
  .post(protect, askQuestion);

router.route('/qa/:courseId')
  .get(protect, getQuestions);

router.route('/qa/:id/answer')
  .put(protect, instructor, answerQuestion);

export default router;
