import Payment from '../models/paymentModel.js';
import Enrollment from '../models/enrollmentModel.js';
import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';

// @desc    Request a refund
// @route   POST /api/payments/:id/refund-request
// @access  Private
const requestRefund = async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    
    // Check ownership
    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed payments can be refunded' });
    }

    // Check 14-day limit
    const daysSincePurchase = (Date.now() - new Date(payment.verifiedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePurchase > 14) {
      return res.status(400).json({ message: 'Refund window (14 days) has expired' });
    }

    payment.refundStatus = 'requested';
    payment.refundReason = reason;
    await payment.save();

    // Notify Admins
    try {
      const admins = await User.find({ role: 'admin' }).select('_id');
      if (admins.length > 0) {
        await Notification.insertMany(admins.map(admin => ({
          recipient: admin._id,
          sender: req.user._id,
          type: 'refund_requested',
          title: 'New Refund Request',
          message: `Student "${req.user.name}" requested a refund for their purchase.`,
          relatedId: payment._id
        })));
      }
    } catch (err) {
      console.error('Failed to notify admins of refund request:', err);
    }

    res.json({ success: true, message: 'Refund request submitted for review' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all refund requests
// @route   GET /api/admin/refunds
// @access  Private/Admin
const getRefundRequests = async (req, res) => {
  try {
    const requests = await Payment.find({ refundStatus: 'requested' })
      .populate('user', 'name email')
      .populate('course', 'title');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Process refund (Approve/Reject)
// @route   PUT /api/admin/refunds/:id
// @access  Private/Admin
const processRefund = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const payment = await Payment.findById(req.params.id);

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (status === 'approved') {
        payment.refundStatus = 'approved';
        // Unenroll student
        await Enrollment.findOneAndDelete({ user: payment.user, course: payment.course });
    } else {
        payment.refundStatus = 'rejected';
    }

    await payment.save();
    res.json({ success: true, message: `Refund ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { requestRefund, getRefundRequests, processRefund };
