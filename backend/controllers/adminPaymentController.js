import Payment from '../models/paymentModel.js';
import Enrollment from '../models/enrollmentModel.js';
import User from '../models/userModel.js';

// @desc    Get all pending payments
// @route   GET /api/admin/payments/pending
// @access  Private/Admin
const getPendingPayments = async (req, res) => {
  try {
    // Include both 'pending' (initiated) and 'pending_approval' (code submitted)
    const payments = await Payment.find({ status: { $in: ['pending', 'pending_approval'] } })
      .populate('user', 'name email')
      .populate('course', 'title price currency');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve a pending payment
// @route   PUT /api/admin/payments/:id/approve
// @access  Private/Admin
const approvePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (!['pending', 'pending_approval'].includes(payment.status)) {
      return res.status(400).json({ message: 'Payment is not in a pending state' });
    }

    payment.status = 'completed';
    payment.verifiedAt = new Date();
    await payment.save();

    // Create Enrollment
    await Enrollment.create({
      user: payment.user,
      course: payment.course,
      paymentId: payment._id
    });

    // Handle Affiliate Commission
    const buyer = await User.findById(payment.user);
    if (buyer && buyer.referredBy) {
      const referrer = await User.findById(buyer.referredBy);
      if (referrer) {
        const commission = payment.amount * 0.10;
        referrer.commissionBalance = (referrer.commissionBalance || 0) + commission;
        await referrer.save();
      }
    }

    res.json({ success: true, message: 'Payment approved, student enrolled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject a pending payment
// @route   PUT /api/admin/payments/:id/reject
// @access  Private/Admin
const rejectPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    payment.status = 'failed';
    await payment.save();

    res.json({ success: true, message: 'Payment rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all completed payments (History)
// @route   GET /api/admin/payments/all
// @access  Private/Admin
const getAllPayments = async (req, res) => {
  try {
    // Show both completed and rejected (failed) payments in history
    const payments = await Payment.find({ status: { $in: ['completed', 'failed'] } })
      .populate('user', 'name email')
      .populate('course', 'title price currency')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getPendingPayments, approvePayment, rejectPayment, getAllPayments };
