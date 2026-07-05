import Withdrawal from '../models/withdrawalModel.js';
import User from '../models/userModel.js';
import Enrollment from '../models/enrollmentModel.js';
import Course from '../models/courseModel.js';

// @desc    Create withdrawal request
// @route   POST /api/withdrawals
// @access  Private/Instructor
const createWithdrawalRequest = async (req, res) => {
  try {
    const { amount, bankName, accountNumber } = req.body;
    const instructorId = req.user._id;

    // Validate input
    if (!amount || !bankName || !accountNumber) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Get instructor's current balance dynamically (same logic as instructor stats)
    const courses = await Course.find({ instructor: instructorId });
    const courseIds = courses.map(c => c._id);
    
    // Get total revenue from completed payments
    const Payment = (await import('../models/paymentModel.js')).default;
    const payments = await Payment.find({
      course: { $in: courseIds },
      status: 'completed'
    });
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Get platform fee percentage from settings
    const Settings = (await import('../models/settingsModel.js')).default;
    const settings = await Settings.findOne();
    const platformFeePercentage = (settings?.platformCommissionPercentage || 20) / 100;
    
    // Get withdrawal limits from settings
    const minimumWithdrawalAmount = settings?.minimumWithdrawalAmount || 500;
    const maximumWithdrawalAmount = settings?.maximumWithdrawalAmount || 10000;
    const dailyWithdrawalLimit = settings?.dailyWithdrawalLimit || 5000;
    
    // Validate withdrawal amount against limits
    if (amount < minimumWithdrawalAmount) {
      return res.status(400).json({ 
        message: `Minimum withdrawal amount is ${minimumWithdrawalAmount} ETB` 
      });
    }
    
    if (amount > maximumWithdrawalAmount) {
      return res.status(400).json({ 
        message: `Maximum withdrawal amount is ${maximumWithdrawalAmount} ETB` 
      });
    }
    
    // Check daily withdrawal limit (sum of today's withdrawals)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const todayWithdrawals = await Withdrawal.find({
      user: instructorId,
      status: { $in: ['pending', 'approved'] },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const todayTotalWithdrawn = todayWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    
    if (todayTotalWithdrawn + amount > dailyWithdrawalLimit) {
      return res.status(400).json({ 
        message: `Daily withdrawal limit is ${dailyWithdrawalLimit} ETB. You have already withdrawn ${todayTotalWithdrawn} ETB today.` 
      });
    }
    
    // Calculate instructor's earnings after platform commission
    const instructorEarnings = totalRevenue * (1 - platformFeePercentage);
    
    // Get approved withdrawals to subtract from earnings
    const approvedWithdrawals = await Withdrawal.find({
      user: instructorId,
      status: 'approved'
    });
    const totalWithdrawn = approvedWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    
    // Current available balance
    const currentBalance = Math.max(0, instructorEarnings - totalWithdrawn);

    if (amount > currentBalance) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Check for pending withdrawals
    const pendingWithdrawals = await Withdrawal.find({ 
      user: instructorId, 
      status: 'pending' 
    });

    if (pendingWithdrawals.length > 0) {
      return res.status(400).json({ message: 'You have a pending withdrawal request. Please wait for it to be processed.' });
    }

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      user: instructorId,
      amount,
      bankName,
      accountNumber,
      status: 'pending'
    });

    res.status(201).json({ message: 'Withdrawal request submitted successfully', withdrawal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's withdrawal history
// @route   GET /api/withdrawals/my
// @access  Private/Instructor
const getMyWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createWithdrawalRequest, getMyWithdrawals };
