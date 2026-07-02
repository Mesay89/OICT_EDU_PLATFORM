import mongoose from 'mongoose';

// ─── Peer Review Assignment ───────────────────────────────────────────────────
// An instructor can create a peer review task for a course assignment.
// Each student must review N peers' work before receiving their own grade.
const peerReviewSchema = new mongoose.Schema({
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:     { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  bundle:     { type: mongoose.Schema.Types.ObjectId, ref: 'Bundle' },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },

  title:       { type: String, required: true },
  instructions:{ type: String, default: '' },

  // How many peers must each student review before they unlock their own grade
  reviewsRequired: { type: Number, default: 2 },

  // Rubric: structured criteria the reviewer scores
  rubric: [{
    criterion:   { type: String },    // e.g. "Clarity of argument"
    maxPoints:   { type: Number, default: 10 },
    description: { type: String, default: '' },
  }],

  dueDate:     { type: Date },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

// ─── Peer Review Submission ───────────────────────────────────────────────────
// Tracks one student reviewing another student's submission.
const peerReviewSubmissionSchema = new mongoose.Schema({
  peerReview: { type: mongoose.Schema.Types.ObjectId, ref: 'PeerReview', required: true },
  reviewer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Scores per rubric criterion: [{ criterion, score, comment }]
  rubricScores: [{
    criterion: { type: String },
    score:     { type: Number, default: 0 },
    comment:   { type: String, default: '' },
  }],

  overallComment: { type: String, default: '' },
  totalScore:     { type: Number, default: 0 },  // sum of rubric scores
  isComplete:     { type: Boolean, default: false },
}, { timestamps: true });

const PeerReview           = mongoose.model('PeerReview',           peerReviewSchema);
const PeerReviewSubmission = mongoose.model('PeerReviewSubmission', peerReviewSubmissionSchema);

export { PeerReview, PeerReviewSubmission };
