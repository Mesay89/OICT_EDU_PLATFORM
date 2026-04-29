import mongoose from 'mongoose';

const enrollmentSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Course',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    progress: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'dropped'],
      default: 'active',
    },
    // Video progress tracking
    moduleProgress: [{
      moduleId: { type: String, required: true },
      watchedDuration: { type: Number, default: 0 }, // in seconds
      totalDuration: { type: Number, default: 0 }, // in seconds
      completed: { type: Boolean, default: false },
      lastWatchedAt: { type: Date, default: Date.now }
    }],
    // Quiz and evaluation
    quizScore: {
      type: Number,
      default: null
    },
    quizAttempts: {
      type: Number,
      default: 0
    },
    quizCompletedAt: {
      type: Date,
      default: null
    },
    // Certificate
    certificateIssued: {
      type: Boolean,
      default: false
    },
    certificateId: {
      type: String,
      default: null
    },
    certificateIssuedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
  }
);

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ course: 1 });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;
