import asyncHandler from 'express-async-handler';
import { BankQuestion, Quiz, QuizAttempt } from '../models/quizBankModel.js';
import Course from '../models/courseModel.js';
import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';
import { queueCourseForApproval } from '../utils/courseApprovalUtils.js';
import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION BANK
// ─────────────────────────────────────────────────────────────────────────────

// @desc  Add a question to the instructor's bank for a course
// @route POST /api/quiz/questions
// @access Instructor
export const createBankQuestion = asyncHandler(async (req, res) => {
  const { courseId, bundleId, type, text, options, correct, tags, points, explanation } = req.body;

  if (!courseId && !bundleId) {
    res.status(400); throw new Error('Must provide either courseId or bundleId');
  }

  if (courseId) {
    const course = await Course.findById(courseId);
    if (!course || course.instructor.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not authorized');
    }
  }

  if (bundleId) {
    const Bundle = (await import('../models/bundleModel.js')).default;
    const bundle = await Bundle.findById(bundleId);
    if (!bundle || bundle.instructor.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not authorized');
    }
  }

  const q = await BankQuestion.create({
    instructor: req.user._id,
    course: courseId || undefined,
    bundle: bundleId || undefined,
    type:  type  || 'mcq',
    text,
    options: options || [],
    correct: correct ?? 0,
    tags:    tags    || [],
    points:  points  || 1,
    explanation: explanation || '',
  });
  res.status(201).json(q);
});

// @desc  Get all bank questions for a course
// @route GET /api/quiz/questions/:courseId
// @access Instructor
export const getBankQuestions = asyncHandler(async (req, res) => {
  const query = { instructor: req.user._id };
  if (req.params.courseId && req.params.courseId !== 'undefined') {
    query.course = req.params.courseId;
  }
  if (req.query.bundleId) {
    query.bundle = req.query.bundleId;
  }
  
  const questions = await BankQuestion.find(query).sort({ createdAt: -1 });
  res.json(questions);
});

// @desc  Delete a bank question
// @route DELETE /api/quiz/questions/:id
// @access Instructor
export const deleteBankQuestion = asyncHandler(async (req, res) => {
  const q = await BankQuestion.findById(req.params.id);
  if (!q || q.instructor.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized');
  }
  await q.deleteOne();
  res.json({ message: 'Question deleted' });
});

// @desc  Update a bank question
// @route PUT /api/quiz/questions/:id
// @access Instructor
export const updateBankQuestion = asyncHandler(async (req, res) => {
  const q = await BankQuestion.findById(req.params.id);
  if (!q || q.instructor.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized');
  }
  const { type, text, options, correct, tags, points, explanation } = req.body;
  if (type !== undefined) q.type = type;
  if (text !== undefined) q.text = text;
  if (options !== undefined) q.options = options;
  if (correct !== undefined) q.correct = correct;
  if (tags !== undefined) q.tags = tags;
  if (points !== undefined) q.points = points;
  if (explanation !== undefined) q.explanation = explanation;
  
  await q.save();
  res.json(q);
});

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ MANAGEMENT (Instructor)
// ─────────────────────────────────────────────────────────────────────────────

// @desc  Create a quiz
// @route POST /api/quiz
// @access Instructor
export const createQuiz = asyncHandler(async (req, res) => {
  const {
    courseId, bundleId, title, description, questions, shuffleQuestions, shuffleOptions,
    timeLimitMinutes, timePerQuestion, maxAttempts, passingScore,
    showResultsAfter, allowedWindowBlurs
  } = req.body;

  let relatedEntity;

  if (!courseId && !bundleId) {
    res.status(400); throw new Error('Must provide either courseId or bundleId');
  }

  if (courseId) {
    relatedEntity = await Course.findById(courseId);
    if (!relatedEntity || relatedEntity.instructor.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not authorized');
    }
  }

  if (bundleId) {
    const Bundle = (await import('../models/bundleModel.js')).default;
    relatedEntity = await Bundle.findById(bundleId);
    if (!relatedEntity || relatedEntity.instructor.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not authorized');
    }
  }

  const quiz = await Quiz.create({
    instructor:         req.user._id,
    course:             courseId || undefined,
    bundle:             bundleId || undefined,
    title,
    description:        description || '',
    questions:          questions   || [],
    shuffleQuestions:   shuffleQuestions   ?? true,
    shuffleOptions:     shuffleOptions     ?? true,
    timeLimitMinutes:   timeLimitMinutes   || 0,
    timePerQuestion:    timePerQuestion    || 0,
    maxAttempts:        maxAttempts        || 1,
    passingScore:       passingScore       || 70,
    showResultsAfter:   showResultsAfter   ?? true,
    allowedWindowBlurs: allowedWindowBlurs ?? 3,
    isPublished: false,
    status: 'pending',
  });

  // Notify admins AND superAdmins about new quiz needing approval
  const approvers = await User.find({ role: { $in: ['admin', 'superAdmin'] } }).select('_id');
  if (approvers.length > 0) {
    const entityLabel = bundleId ? `bundle quiz` : `course quiz`;
    await Notification.insertMany(approvers.map(a => ({
      recipient: a._id,
      sender: req.user._id,
      type: 'quiz_approval_requested',
      title: 'Quiz Approval Needed',
      message: `Instructor ${req.user.name} created a new ${entityLabel}: "${title}". Please review and approve it.`,
      relatedId: quiz._id
    })));
  }

  if (courseId) {
    await queueCourseForApproval({
      course: relatedEntity,
      actor: req.user,
      changeSummary: 'added new quiz content',
    });
  }

  res.status(201).json(quiz);
});

// @desc  Get all quizzes for a course (instructor sees all; student sees only published)
// @route GET /api/quiz/course/:courseId
// @access Protect
export const getCourseQuizzes = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.params.courseId && req.params.courseId !== 'undefined') {
    filter.course = req.params.courseId;
  }
  if (req.query.bundleId) {
    filter.bundle = req.query.bundleId;
  }
  
  if (req.user.role !== 'instructor') filter.isPublished = true;
  const quizzes = await Quiz.find(filter).populate('questions').sort({ createdAt: -1 });
  res.json(quizzes);
});

// @desc  Publish / unpublish a quiz
// @route PUT /api/quiz/:id/publish
// @access Instructor
export const togglePublishQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz || quiz.instructor.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized');
  }
  quiz.isPublished = !quiz.isPublished;
  await quiz.save();

  const course = await Course.findById(quiz.course);
  if (course) {
    await queueCourseForApproval({
      course,
      actor: req.user,
      changeSummary: 'updated quiz availability',
    });
  }

  res.json({ isPublished: quiz.isPublished });
});

// @desc  Update quiz settings
// @route PUT /api/quiz/:id
// @access Instructor
export const updateQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz || quiz.instructor.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized');
  }
  const fields = [
    'title','description','questions','shuffleQuestions','shuffleOptions',
    'timeLimitMinutes','timePerQuestion','maxAttempts','passingScore',
    'showResultsAfter','allowedWindowBlurs'
  ];
  fields.forEach(f => { if (req.body[f] !== undefined) quiz[f] = req.body[f]; });
  // Reset approval on edit
  quiz.status = 'pending';
  quiz.isPublished = false;
  await quiz.save();

  const course = await Course.findById(quiz.course);
  if (course) {
    await queueCourseForApproval({
      course,
      actor: req.user,
      changeSummary: 'updated quiz content',
    });
  }

  // Re-notify approvers
  const approvers = await User.find({ role: { $in: ['admin', 'superAdmin'] } }).select('_id');
  if (approvers.length > 0) {
    await Notification.insertMany(approvers.map(a => ({
      recipient: a._id,
      sender: req.user._id,
      type: 'quiz_approval_requested',
      title: 'Quiz Re-Approval Needed',
      message: `Instructor ${req.user.name} edited quiz "${quiz.title}". Please review again.`,
      relatedId: quiz._id
    })));
  }

  res.json(quiz);
});

// @desc  Get all pending quizzes (for admin/superAdmin review)
// @route GET /api/quiz/admin/pending
// @access Admin/SuperAdmin
export const getPendingQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find({ status: 'pending' })
    .populate('instructor', 'name email')
    .populate('course', 'title')
    .populate('bundle', 'title')
    .populate({ path: 'questions', model: 'BankQuestion' })
    .sort({ createdAt: -1 });
  res.json(quizzes);
});

// @desc  Approve or reject a quiz (admin/superAdmin)
// @route PUT /api/quiz/:id/admin-status
// @access Admin/SuperAdmin
export const updateQuizStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    res.status(400); throw new Error('Invalid status');
  }

  const quiz = await Quiz.findById(req.params.id).populate('instructor', 'name email');
  if (!quiz) { res.status(404); throw new Error('Quiz not found'); }

  quiz.status = status;
  if (status === 'approved') {
    quiz.isPublished = true;
    quiz.rejectionReason = '';
  } else {
    quiz.isPublished = false;
    quiz.rejectionReason = rejectionReason || 'No reason provided';
  }
  await quiz.save();

  // Notify instructor
  await Notification.create({
    recipient: quiz.instructor._id,
    sender: req.user._id,
    type: status === 'approved' ? 'quiz_approved' : 'quiz_rejected',
    title: status === 'approved' ? '✅ Quiz Approved' : '❌ Quiz Rejected',
    message: status === 'approved'
      ? `Your quiz "${quiz.title}" has been approved and is now live for students.`
      : `Your quiz "${quiz.title}" was rejected. Reason: ${quiz.rejectionReason}`,
    relatedId: quiz._id
  });

  res.json(quiz);
});

// @desc  Delete a quiz
// @route DELETE /api/quiz/:id
// @access Instructor
export const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz || quiz.instructor.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized');
  }
  await quiz.deleteOne();
  res.json({ message: 'Quiz deleted' });
});

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ ATTEMPTS (Student)
// ─────────────────────────────────────────────────────────────────────────────

// Helper: Fisher-Yates shuffle
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// @desc  Start a quiz attempt — receives shuffled questions
// @route POST /api/quiz/:id/start
// @access Student
export const startQuizAttempt = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).populate('questions');
  if (!quiz || !quiz.isPublished) { res.status(404); throw new Error('Quiz not found'); }

  // Check attempt count
  const attempts = await QuizAttempt.countDocuments({ quiz: quiz._id, student: req.user._id });
  if (attempts >= quiz.maxAttempts) {
    res.status(400); throw new Error(`Max attempts (${quiz.maxAttempts}) reached`);
  }

  // Shuffle questions
  let qs = quiz.questions;
  const questionOrder = quiz.shuffleQuestions ? shuffle(qs.map(q => q._id)) : qs.map(q => q._id);

  // Shuffle options for each MCQ (return a sanitized view — no correct answer revealed)
  const questionsForStudent = questionOrder.map(qId => {
    const q = qs.find(x => x._id.toString() === qId.toString());
    let opts = q.options;
    let shuffleMap = opts.map((_, i) => i); // original→shuffled index map
    if (quiz.shuffleOptions && q.type === 'mcq') {
      shuffleMap = shuffle(shuffleMap);
      opts = shuffleMap.map(i => q.options[i]);
    }
    return {
      _id:         q._id,
      type:        q.type,
      text:        q.text,
      options:     opts,           // shuffled, no correct field
      points:      q.points,
      shuffleMap,  // stored server-side via attempt; NOT sent to client
      timePerQuestion: quiz.timePerQuestion,
    };
  });

  const attempt = await QuizAttempt.create({
    quiz:          quiz._id,
    student:       req.user._id,
    course:        quiz.course || undefined,
    bundle:        quiz.bundle || undefined,
    questionOrder,
    startedAt:     new Date(),
  });

  res.json({
    attemptId:        attempt._id,
    questions:        questionsForStudent.map(q => ({
      _id: q._id, type: q.type, text: q.text, options: q.options,
      points: q.points, timePerQuestion: q.timePerQuestion
    })),
    timeLimitMinutes: quiz.timeLimitMinutes,
    allowedWindowBlurs: quiz.allowedWindowBlurs,
  });
});

// @desc  Submit a quiz attempt
// @route PUT /api/quiz/attempts/:attemptId/submit
// @access Student
export const submitQuizAttempt = asyncHandler(async (req, res) => {
  const { answers, windowBlurCount } = req.body;
  // answers: [{ questionId, selectedOption, essayText }]

  const attempt = await QuizAttempt.findById(req.params.attemptId);
  if (!attempt || attempt.student.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized');
  }
  if (attempt.submittedAt) { res.status(400); throw new Error('Already submitted'); }

  const quiz = await Quiz.findById(attempt.quiz).populate('questions');

  let totalPoints = 0;
  let earnedPoints = 0;
  const gradedAnswers = [];

  for (const ans of answers) {
    const q = quiz.questions.find(x => x._id.toString() === ans.questionId);
    if (!q) continue;
    totalPoints += q.points;
    let isCorrect = false;
    if (q.type === 'mcq' || q.type === 'truefalse') {
      isCorrect = Number(ans.selectedOption) === q.correct;
      if (isCorrect) earnedPoints += q.points;
    }
    // Essay: isCorrect stays false (manually graded later)
    gradedAnswers.push({
      question:       q._id,
      selectedOption: ans.selectedOption ?? null,
      essayText:      ans.essayText || '',
      isCorrect,
    });
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  attempt.answers          = gradedAnswers;
  attempt.score            = score;
  attempt.passed           = score >= quiz.passingScore;
  attempt.submittedAt      = new Date();
  attempt.windowBlurCount  = windowBlurCount || 0;
  attempt.flagged          = (windowBlurCount || 0) > quiz.allowedWindowBlurs;
  attempt.flagReason       = attempt.flagged ? `Tab switched ${windowBlurCount} times (limit ${quiz.allowedWindowBlurs})` : '';
  await attempt.save();

  // ── Bundle Certificate Generation ─────────────────────────────────────────
  let bundleCertificate = null;
  if (quiz.bundle && attempt.passed) {
    try {
      const Enrollment = (await import('../models/enrollmentModel.js')).default;
      const Bundle = (await import('../models/bundleModel.js')).default;
      const bundle = await Bundle.findById(quiz.bundle);
      
      if (bundle && bundle.courses && bundle.courses.length > 0) {
        // Check if student has >= 80% progress across all courses in bundle
        const progressResults = await Promise.all(
          bundle.courses.map(cid =>
            Enrollment.findOne({ user: req.user._id, course: cid })
          )
        );
        
        const allProgresses = progressResults.filter(Boolean).map(e => e.progress || 0);
        const avgProgress = allProgresses.length > 0 
          ? allProgresses.reduce((s, p) => s + p, 0) / allProgresses.length 
          : 0;
        
        if (avgProgress >= 80) {
          const certId = crypto.randomBytes(16).toString('hex');
          // Store certificate info in the quiz attempt
          attempt.bundleCertificateId = certId;
          attempt.bundleCertificateIssuedAt = new Date();
          await attempt.save();
          
          bundleCertificate = {
            certificateId: certId,
            bundleTitle: bundle.title,
            issuedAt: attempt.bundleCertificateIssuedAt,
          };
        }
      }
    } catch (certErr) {
      console.error('Bundle certificate generation failed:', certErr);
      // Non-fatal: don't block the quiz result
    }
  }

  const result = {
    score,
    passed: attempt.passed,
    flagged: attempt.flagged,
    bundleCertificate,
  };

  if (quiz.showResultsAfter) {
    result.answers = gradedAnswers.map(a => ({
      question:       a.question,
      isCorrect:      a.isCorrect,
      selectedOption: a.selectedOption,
      essayText:      a.essayText,
    }));
    // Attach explanations
    result.explanations = quiz.questions.reduce((acc, q) => {
      acc[q._id] = q.explanation;
      return acc;
    }, {});
  }
  res.json(result);
});

// @desc  Report a tab blur (anti-cheat) during an active attempt
// @route PUT /api/quiz/attempts/:attemptId/blur
// @access Student
export const reportWindowBlur = asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findById(req.params.attemptId);
  if (!attempt || attempt.student.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized');
  }
  attempt.windowBlurCount = (attempt.windowBlurCount || 0) + 1;
  console.log('Tab blur reported for attempt:', attempt._id, 'Count:', attempt.windowBlurCount);
  await attempt.save();
  res.json({ windowBlurCount: attempt.windowBlurCount });
});

// @desc  Get all attempts for a quiz (instructor)
// @route GET /api/quiz/:id/attempts
// @access Instructor
export const getQuizAttempts = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    res.status(404); throw new Error('Quiz not found');
  }
  
  // Allow instructor who created the quiz or admin/superAdmin to view attempts
  const isInstructor = quiz.instructor.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin' || req.user.role === 'superAdmin';
  
  if (!isInstructor && !isAdmin) {
    res.status(403); throw new Error('Not authorized to view these attempts');
  }
  
  const attempts = await QuizAttempt.find({ quiz: quiz._id })
    .populate('student', 'name email')
    .sort({ createdAt: -1 });
  res.json(attempts);
});

// @desc  Get my own attempts for a quiz (student)
// @route GET /api/quiz/:id/my-attempts
// @access Student
export const getMyQuizAttempts = asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.find({
    quiz:    req.params.id,
    student: req.user._id
  }).sort({ createdAt: -1 });
  res.json(attempts);
});

// @desc  Get quiz metadata by ID
// @route GET /api/quiz/:id
// @access Protect
export const getQuizById = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    res.status(404); throw new Error('Quiz not found');
  }
  
  if (!quiz.isPublished && req.user.role !== 'instructor') {
    res.status(403); throw new Error('Quiz not published');
  }
  
  res.json({
    _id: quiz._id,
    title: quiz.title,
    description: quiz.description,
    timeLimitMinutes: quiz.timeLimitMinutes,
    timePerQuestion: quiz.timePerQuestion,
    maxAttempts: quiz.maxAttempts,
    passingScore: quiz.passingScore,
    allowedWindowBlurs: quiz.allowedWindowBlurs,
    isPublished: quiz.isPublished
  });
});

// @desc  Get bundle certificate by ID
// @route GET /api/quiz/bundle-certificate/:certificateId
// @access Protect
export const getBundleCertificate = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;
  
  const attempt = await QuizAttempt.findOne({ bundleCertificateId: certificateId })
    .populate('student', 'name email')
    .populate('bundle', 'title');
  
  if (!attempt) {
    res.status(404); throw new Error('Certificate not found');
  }
  
  // Only the student who earned it (or admin) can view it
  if (attempt.student._id.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
    res.status(403); throw new Error('Not authorized');
  }
  
  res.json({
    certificateId,
    studentName: attempt.student.name,
    bundleTitle: attempt.bundle?.title || 'Bundle Course',
    score: attempt.score,
    issuedAt: attempt.bundleCertificateIssuedAt,
  });
});

