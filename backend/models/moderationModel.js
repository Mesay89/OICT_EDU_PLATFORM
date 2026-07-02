import mongoose from 'mongoose';

const moderationSchema = mongoose.Schema(
  {
    contentType: {
      type: String,
      enum: ['course', 'bundle', 'review', 'comment', 'user'],
      required: true,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
    },
    actionTaken: {
      type: String,
      enum: ['none', 'warning', 'suspended', 'deleted'],
      default: 'none',
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Moderation = mongoose.model('Moderation', moderationSchema);

export default Moderation;
