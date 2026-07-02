import Payment from '../models/paymentModel.js';
import Enrollment from '../models/enrollmentModel.js';
import User from '../models/userModel.js';
import Withdrawal from '../models/withdrawalModel.js';
import Coupon from '../models/couponModel.js';
import Settings from '../models/settingsModel.js';
import Course from '../models/courseModel.js';
import Notification from '../models/notificationModel.js';

// @desc    Get cash manager dashboard overview data
// @route   GET /api/cash-manager/dashboard
// @access  Private/CashManager
export const getCashManagerDashboard = async (req, res) => {
  try {
    const totalPaymentsCount = await Payment.countDocuments({ status: 'completed' });
    const totalEnrollmentsCount = await Enrollment.countDocuments();
    const pendingRefundsCount = await Payment.countDocuments({ refundStatus: 'requested' });
    const pendingWithdrawalsCount = await Withdrawal.countDocuments({ status: 'pending' });

    // Aggregate today's revenue
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todaysRevenueResult = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOfToday, $lte: endOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todaysRevenue = todaysRevenueResult[0]?.total || 0;

    // Aggregate monthly revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenueResult = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;

    // Total lifetime revenue
    const totalRevenueResult = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Load settings for dynamic commission % and currency
    const settings = await Settings.findOne({});
    const platformCommissionPct = settings?.platformCommissionPercentage ?? 10;
    const instructorCommissionPct = 100 - platformCommissionPct;
    const currency = settings?.currency || 'ETB';
    const etbUsdRate = settings?.etbUsdRate || 150;

    const convertAmount = (amount) => currency === 'USD' ? parseFloat((amount / etbUsdRate).toFixed(2)) : amount;

    const convertedTotalRevenue = convertAmount(totalRevenue);
    const convertedTodaysRevenue = convertAmount(todaysRevenue);
    const convertedMonthlyRevenue = convertAmount(monthlyRevenue);

    const platformFee = parseFloat((convertedTotalRevenue * platformCommissionPct / 100).toFixed(2));
    const instructorFee = parseFloat((convertedTotalRevenue * instructorCommissionPct / 100).toFixed(2));

    // Get instructor revenue breakdown
    const instructorRevenueBreakdown = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      { $unwind: '$courseDetails' },
      {
        $group: {
          _id: '$courseDetails.instructor',
          totalRevenue: { $sum: '$amount' },
          paymentCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'instructorDetails'
        }
      },
      { $unwind: '$instructorDetails' },
      {
        $project: {
          instructorId: '$_id',
          instructorName: '$instructorDetails.name',
          instructorEmail: '$instructorDetails.email',
          totalRevenue: 1,
          paymentCount: 1
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({
      stats: {
        totalPayments: totalPaymentsCount,
        totalEnrollments: totalEnrollmentsCount,
        pendingRefunds: pendingRefundsCount,
        pendingWithdrawals: pendingWithdrawalsCount,
        todaysRevenue: convertedTodaysRevenue,
        monthlyRevenue: convertedMonthlyRevenue,
        totalRevenue: convertedTotalRevenue,
        platformFee,
        instructorFee,
        platformCommissionPct,
        instructorCommissionPct,
        instructorRevenueBreakdown: instructorRevenueBreakdown.map(i => ({
         ...i,
         totalRevenue: convertAmount(i.totalRevenue)
        }))
      },
      currency
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get all payments
// @route   GET /api/cash-manager/payments
// @access  Private/CashManager
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate('user', 'name email')
      .populate('course', 'title price')
      .populate('bundle', 'title price')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all withdrawals
// @route   GET /api/cash-manager/withdrawals
// @access  Private/CashManager
export const getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve/Reject withdrawal
// @route   PUT /api/cash-manager/withdrawals/:id/process
// @access  Private/CashManager
export const processWithdrawal = async (req, res) => {
  const { status, reason } = req.body;
  
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal is already processed' });
    }

    withdrawal.status = status;
    withdrawal.processedAt = new Date();
    // Assuming you want to track rejection reason (would need adding to model if it doesn't exist)
    if (reason) {
      // For now just logging it, you can add rejectionReason to the schema if needed
      console.log(`Withdrawal rejected. Reason: ${reason}`);
    }

    await withdrawal.save();
    
    // If rejected, you would typically refund the pending balance to the instructor's wallet here.
    if (status === 'rejected') {
      const user = await User.findById(withdrawal.user);
      if (user) {
        user.balance = (user.balance || 0) + withdrawal.amount;
        await user.save();
      }
    }

    res.json({ message: `Withdrawal ${status} successfully`, withdrawal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all refunds
// @route   GET /api/cash-manager/refunds
// @access  Private/CashManager
export const getAllRefunds = async (req, res) => {
  try {
    // Only get payments where refundStatus is not 'none'
    const refunds = await Payment.find({ refundStatus: { $ne: 'none' } })
      .populate('user', 'name email phone')
      .populate({
        path: 'course',
        select: 'title price instructor',
        populate: { path: 'instructor', select: 'name email' }
      })
      .sort({ updatedAt: -1 });

    res.json(refunds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Process refund request
// @route   PUT /api/cash-manager/refunds/:id/process
// @access  Private/CashManager
export const processRefund = async (req, res) => {
  const { refundStatus, rejectionReason } = req.body;
  
  if (!['approved', 'rejected'].includes(refundStatus)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  if (refundStatus === 'rejected' && !rejectionReason?.trim()) {
    return res.status(400).json({ message: 'Rejection reason is required when rejecting a refund.' });
  }

  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email _id')
      .populate({ path: 'course', select: 'title instructor', populate: { path: 'instructor', select: 'name' } });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.refundStatus !== 'requested') {
      return res.status(400).json({ message: 'Refund is not in requested state' });
    }

    payment.refundStatus = refundStatus;

    if (refundStatus === 'approved') {
      payment.status = 'cancelled';
      payment.refundRejectionReason = null;

      // Cancel enrollment
      await Enrollment.findOneAndDelete({ user: payment.user._id, course: payment.course._id });

      // Deduct from instructor balance if they already got paid for this
      const course = await Course.findById(payment.course._id);
      if (course) {
        const instructor = await User.findById(course.instructor);
        if (instructor) {
          const settings = (await Settings.findOne()) || { platformCommissionPercentage: 10 };
          const instructorCut = payment.amount * (1 - settings.platformCommissionPercentage / 100);
          instructor.balance = Math.max(0, (instructor.balance || 0) - instructorCut);
          await instructor.save();
        }
      }

      // Notify student: Refund Approved
      await Notification.create({
        recipient: payment.user._id,
        sender: req.user._id,
        type: 'refund_approved',
        title: '✅ Refund Approved',
        message: `Your refund request for the course "${payment.course?.title}" has been approved. The amount of ${payment.currency} ${payment.amount} will be returned to you shortly.`,
        relatedId: payment._id
      });

    } else {
      // Rejected
      payment.refundRejectionReason = rejectionReason;

      // Notify student: Refund Rejected with reason
      await Notification.create({
        recipient: payment.user._id,
        sender: req.user._id,
        type: 'refund_rejected',
        title: '❌ Refund Request Rejected',
        message: `Your refund request for "${payment.course?.title}" was rejected. Reason: ${rejectionReason}`,
        relatedId: payment._id
      });
    }

    await payment.save();
    res.json({ message: `Refund ${refundStatus} successfully`, payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all coupons
// @route   GET /api/cash-manager/coupons
// @access  Private/CashManager
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({})
      .populate('instructor', 'name email')
      .populate('course', 'title')
      .sort({ createdAt: -1 });

    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get financial reports
// @route   GET /api/cash-manager/reports
// @access  Private/CashManager
export const getFinancialReports = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    const platformCommissionRate = settings ? settings.platformCommissionPercentage : 10;
    
    // Total Revenue (Gross)
    const grossRevenueResult = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const grossRevenue = grossRevenueResult[0]?.total || 0;

    // Platform Net Revenue vs Instructor Earnings
    const platformRevenue = grossRevenue * (platformCommissionRate / 100);
    const totalInstructorEarnings = grossRevenue - platformRevenue;

    // Instructor Payouts (Approved Withdrawals)
    const payoutsResult = await Withdrawal.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalPayouts = payoutsResult[0]?.total || 0;

    // Instructor Pending Balances (Estimated by remaining unwithdrawn earnings)
    const pendingInstructorPayouts = totalInstructorEarnings - totalPayouts;

    // Course Earnings Breakdown
    const courseEarnings = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$course',
          totalRevenue: { $sum: '$amount' },
          purchases: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      { $unwind: '$courseDetails' },
      {
        $project: {
          _id: 1,
          totalRevenue: 1,
          purchases: 1,
          courseName: '$courseDetails.title',
          instructorId: '$courseDetails.instructor'
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Instructor Earnings Breakdown
    const instructorEarnings = await Course.aggregate([
      {
        $lookup: {
          from: 'payments',
          let: { courseId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$course', '$$courseId'] }, status: 'completed' } }
          ],
          as: 'payments'
        }
      },
      {
        $group: {
          _id: '$instructor',
          totalGross: { $sum: { $sum: '$payments.amount' } },
          coursesSold: { $sum: { $size: '$payments' } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'instructorDetails'
        }
      },
      { $unwind: '$instructorDetails' },
      {
        $project: {
          _id: 1,
          totalGross: 1,
          coursesSold: 1,
          instructorName: '$instructorDetails.name',
          instructorEmail: '$instructorDetails.email',
          netEarnings: { $multiply: ['$totalGross', (100 - platformCommissionRate) / 100] }
        }
      },
      { $sort: { totalGross: -1 } }
    ]);

    res.json({
      platformCommissionRate,
      grossRevenue,
      platformRevenue,
      totalInstructorEarnings,
      totalPayouts,
      pendingInstructorPayouts,
      courseEarnings,
      instructorEarnings
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
