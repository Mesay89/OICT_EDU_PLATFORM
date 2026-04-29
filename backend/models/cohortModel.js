import mongoose from 'mongoose';

const cohortSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // Example: "Frontend Fundamentals - Cohort B"
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Cohort-specific forum/discussion reference if needed
    cohortForum: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ForumThread',
    },
  },
  {
    timestamps: true,
  }
);

// Added unique index per course by name
cohortSchema.index({ course: 1, name: 1 }, { unique: true });

const Cohort = mongoose.model('Cohort', cohortSchema);

export default Cohort;
