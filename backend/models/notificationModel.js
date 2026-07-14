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
        'bundle_approved',
        'bundle_rejected',
        'assignment_approval_requested',
        'assignment_status_updated',
        'quiz_approval_requested',
        'quiz_approved',
        'quiz_rejected',
        'module_approval_requested',
        'module_approved',
        'module_rejected',
        'instructor_pending',
        'refund_requested',
        'refund_approved',
        'refund_rejected',
        'payment_approved',
        'payment_rejected',
        'broadcast',
        'announcement'
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
    broadcastId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
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
