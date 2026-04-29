import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      required: true,
      enum: [
        'assignment_submitted', 
        'assignment_graded', 
        'assignment_released',
        'enrollment_success', 
        'coupon_used', 
        'course_approval_requested', 
        'course_approved', 
        'course_rejected',
        'assignment_approval_requested',
        'assignment_status_updated',
        'instructor_pending',
        'refund_requested'
      ],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId, // Could be assignmentId, submissionId, etc.
    },
    isRead: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
