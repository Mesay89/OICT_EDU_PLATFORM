import mongoose from 'mongoose';

// ─── Question Bank ──────────────────────────────────────────────────────────
// Each question belongs to an instructor and can be tagged to a course.
// It can be reused across multiple quizzes (question bank reuse).
const bankQuestionSchema = new mongoose.Schema({
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:     { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  bundle:     { type: mongoose.Schema.Types.ObjectId, ref: 'Bundle' },

  // "mcq" = multiple choice, "essay" = written response, "truefalse"
  type: { type: String, enum: ['mcq', 'essay', 'truefalse'], default: 'mcq' },

  text:    { type: String, required: true },    // The question text
  options: [{ type: String }],                  // MCQ choices (4 expected)
  correct: { type: Number, default: 0 },        // Index of correct option (MCQ/truefalse)

  // Metadata for filtering / reuse
  tags:        [{ type: String }],
  points:      { type: Number, default: 1 },
  explanation: { type: String, default: '' },  // Shown to student after submission
}, { timestamps: true });

// ─── Quiz ────────────────────────────────────────────────────────────────────
// A quiz published on a course. Draws questions from the bank.
const quizSchema = new mongoose.Schema({
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:     { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  bundle:     { type: mongoose.Schema.Types.ObjectId, ref: 'Bundle' },

  title:       { type: String, required: true },
  description: { type: String, default: '' },

  // Selected question IDs from the bank
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BankQuestion' }],

  // Anti-cheat & pacing settings
  shuffleQuestions:   { type: Boolean, default: true },   // Randomize order
  shuffleOptions:     { type: Boolean, default: true },   // Randomize MCQ options
  timeLimitMinutes:   { type: Number,  default: 0 },      // 0 = no limit
  timePerQuestion:    { type: Number,  default: 0 },      // seconds, 0 = no limit
  maxAttempts:        { type: Number,  default: 1 },
  passingScore:       { type: Number,  default: 70 },     // percent
  showResultsAfter:   { type: Boolean, default: true },   // Show answers after submit
  allowedWindowBlurs: { type: Number,  default: 3 },      // Anti-cheat: max tab-switches

  isPublished: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String, default: '' },
}, { timestamps: true });

// ─── Quiz Attempt ─────────────────────────────────────────────────────────────
// One record per student per quiz attempt
const quizAttemptSchema = new mongoose.Schema({
  quiz:    { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz',    required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  course:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  bundle:  { type: mongoose.Schema.Types.ObjectId, ref: 'Bundle' },

  // The question order the student received (after shuffle)
  questionOrder: [{ type: mongoose.Schema.Types.ObjectId }],

  // Student answers: { questionId, selectedOption, essayText }
  answers: [{
    question:       { type: mongoose.Schema.Types.ObjectId, ref: 'BankQuestion' },
    selectedOption: { type: Number, default: null },  // for MCQ / truefalse
    essayText:      { type: String,  default: '' },   // for essay
    isCorrect:      { type: Boolean, default: false },
  }],

  score:       { type: Number, default: 0 },    // percent
  passed:      { type: Boolean, default: false },
  startedAt:   { type: Date, default: Date.now },
  submittedAt: { type: Date },

  // Anti-cheat data
  windowBlurCount: { type: Number, default: 0 },
  flagged:         { type: Boolean, default: false },
  flagReason:      { type: String,  default: '' },

  // Bundle certificate (only set when quiz is a bundle final quiz and student passes)
  bundleCertificateId:       { type: String },
  bundleCertificateIssuedAt: { type: Date },
}, { timestamps: true });

const BankQuestion = mongoose.model('BankQuestion', bankQuestionSchema);
const Quiz         = mongoose.model('Quiz',         quizSchema);
const QuizAttempt  = mongoose.model('QuizAttempt',  quizAttemptSchema);

export { BankQuestion, Quiz, QuizAttempt };
