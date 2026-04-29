import mongoose from 'mongoose';

const withdrawalSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    amount: {
      type: Number,
      required: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

export default Withdrawal;
