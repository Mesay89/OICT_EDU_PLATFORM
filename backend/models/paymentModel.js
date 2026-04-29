import mongoose from 'mongoose';

const paymentSchema = mongoose.Schema(
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
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['chapa', 'cbe', 'telebirr', 'mpesa', 'awash', 'cbe-birr', 'free', 'stripe', 'paypal'],
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled', 'pending_approval'],
      default: 'pending',
    },
    verificationCode: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    gatewaySessionId: {
      type: String,
    },
    receiptUrl: {
      type: String,
    },
    refundStatus: {
      type: String,
      enum: ['none', 'requested', 'approved', 'rejected'],
      default: 'none',
    },
    refundReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ course: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ gatewaySessionId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
