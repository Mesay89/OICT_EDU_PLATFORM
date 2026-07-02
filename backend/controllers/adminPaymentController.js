import Payment from '../models/paymentModel.js';
import Enrollment from '../models/enrollmentModel.js';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';

// @desc    Get all pending payments
const getPendingPayments = async (req, res) => {
  try {
    // Include both 'pending' (initiated) and 'pending_approval' (code submitted)
    const payments = await Payment.find({ status: { $in: ['pending', 'pending_approval'] } })
      .populate('user', 'name email')
      .populate('course', 'title price currency')
      .populate('bundle', 'title price currency');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve a pending payment
const approvePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('course', 'title')
      .populate({
        path: 'bundle',
        populate: { path: 'courses' }
      });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (!['pending', 'pending_approval'].includes(payment.status)) {
      return res.status(400).json({ message: 'Payment is not in a pending state' });
    }

    payment.status = 'completed';
    payment.verifiedAt = new Date();
    await payment.save();

    let entityTitle = 'Unknown';

    if (payment.course) {
      entityTitle = payment.course.title;
      // Create single Enrollment
      await Enrollment.create({
        user: payment.user,
        course: payment.course._id,
        paymentId: payment._id,
        status: 'active'
      });
    } else if (payment.bundle) {
      entityTitle = payment.bundle.title;
      // Enroll in all courses in the bundle
      for (const course of payment.bundle.courses) {
        const existingEnrollment = await Enrollment.findOne({
          user: payment.user,
          course: course._id,
        });
        if (!existingEnrollment) {
          await Enrollment.create({
            user: payment.user,
            course: course._id,
            paymentId: payment._id,
            status: 'active'
          });
        }
      }
    }

    // Notify Student
    await Notification.create({
      recipient: payment.user,
      sender: req.user._id,
      type: 'payment_approved',
      title: '✅ Payment Approved',
      message: `Your payment for "${entityTitle}" has been approved! You are now enrolled.`,
      relatedId: payment._id
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

    res.json({ success: true, message: `Payment approved, student enrolled in ${payment.course ? 'course' : 'bundle courses'}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject a pending payment
const rejectPayment = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason?.trim()) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const payment = await Payment.findById(req.params.id)
      .populate('course', 'title')
      .populate('bundle', 'title');

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    payment.status = 'failed';
    payment.rejectionReason = reason;
    await payment.save();

    const entityTitle = payment.course?.title || payment.bundle?.title || 'Unknown Purchased Item';

    // Notify Student
    await Notification.create({
      recipient: payment.user,
      sender: req.user._id,
      type: 'payment_rejected',
      title: '❌ Payment Rejected',
      message: `Your payment for "${entityTitle}" was rejected. Reason: ${reason}`,
      relatedId: payment._id
    });

    res.json({ success: true, message: 'Payment rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all completed payments (History)
const getAllPayments = async (req, res) => {
  try {
    // Show both completed and rejected (failed) payments in history
    const payments = await Payment.find({ status: { $in: ['completed', 'failed'] } })
      .populate('user', 'name email')
      .populate('course', 'title price currency')
      .populate('bundle', 'title price currency')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getPendingPayments, approvePayment, rejectPayment, getAllPayments };
