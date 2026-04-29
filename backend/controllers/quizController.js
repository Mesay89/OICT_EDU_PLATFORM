import asyncHandler from 'express-async-handler';
import { BankQuestion, Quiz, QuizAttempt } from '../models/quizBankModel.js';
import Course from '../models/courseModel.js';
import { queueCourseForApproval } from '../utils/courseApprovalUtils.js';

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION BANK
// ─────────────────────────────────────────────────────────────────────────────

// @desc  Add a question to the instructor's bank for a course
// @route POST /api/quiz/questions
// @access Instructor
export const createBankQuestion = asyncHandler(async (req, res) => {
  const { courseId, type, text, options, correct, tags, points, explanation } = req.body;
  const course = await Course.findById(courseId);

  if (!course || course.instructor.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized');
  }

  const q = await BankQuestion.create({
    instructor: req.user._id,
    course: courseId,
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
  const questions = await BankQuestion.find({
    course:     req.params.courseId,
    instructor: req.user._id,
  }).sort({ createdAt: -1 });
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
    courseId, title, description, questions, shuffleQuestions, shuffleOptions,
    timeLimitMinutes, timePerQuestion, maxAttempts, passingScore,
    showResultsAfter, allowedWindowBlurs
  } = req.body;

  const course = await Course.findById(courseId);
  if (!course || course.instructor.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized');
  }

  const quiz = await Quiz.create({
    instructor:         req.user._id,
    course:             courseId,
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
  });

  await queueCourseForApproval({
    course,
    actor: req.user,
    changeSummary: 'added new quiz content',
  });

  res.status(201).json(quiz);
});

// @desc  Get all quizzes for a course (instructor sees all; student sees only published)
// @route GET /api/quiz/course/:courseId
// @access Protect
export const getCourseQuizzes = asyncHandler(async (req, res) => {
  const filter = { course: req.params.courseId };
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
  await quiz.save();

  const course = await Course.findById(quiz.course);
  if (course) {
    await queueCourseForApproval({
      course,
      actor: req.user,
      changeSummary: 'updated quiz content',
    });
  }

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
    course:        quiz.course,
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

  const result = {
    score,
    passed: attempt.passed,
    flagged: attempt.flagged,
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
  await attempt.save();
  res.json({ windowBlurCount: attempt.windowBlurCount });
});

// @desc  Get all attempts for a quiz (instructor)
// @route GET /api/quiz/:id/attempts
// @access Instructor
export const getQuizAttempts = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz || quiz.instructor.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized');
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
