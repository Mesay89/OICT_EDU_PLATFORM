import mongoose from 'mongoose';

const webhookSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    events: {
      type: [String],
      enum: ['enrollment.created', 'course.completed', 'payment.success'],
      default: ['enrollment.created'],
    },
    secret: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Webhook = mongoose.model('Webhook', webhookSchema);

export default Webhook;
