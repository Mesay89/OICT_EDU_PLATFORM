import mongoose from 'mongoose';

const questionItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['essay', 'choice', 'short_answer'],
    default: 'essay'
  },
  prompt: { type: String, required: true },
  options: [String],       // Only for 'choice' type
  correctOption: Number,   // Index of correct option for 'choice'
}, { _id: true });

const assignmentSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  },
  bundle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bundle',
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  module: {
    type: Number,
    default: 1,
  },
  questions: [questionItemSchema],
  points: {
    type: Number,
    default: 100
  },
  dueDate: {
    type: Date
  },
  instructionsFile: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});


const submissionSchema = mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileUrl: {
    type: String, // Made optional to support question-based assignments
  },
  studentNotes: {
    type: String
  },
  answers: [{
    questionId: String,
    answer: mongoose.Schema.Types.Mixed
  }],
  status: {
    type: String,
    enum: ['pending', 'graded', 'resubmit'],
    default: 'pending'
  },
  score: {
    type: Number
  },
  feedback: {
    type: String
  },
  gradedAt: {
    type: Date
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const Assignment = mongoose.model('Assignment', assignmentSchema);
const Submission = mongoose.model('Submission', submissionSchema);

export { Assignment, Submission };
