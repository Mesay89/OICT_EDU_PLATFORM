import Payment from '../models/paymentModel.js';
import Course from '../models/courseModel.js';
import Enrollment from '../models/enrollmentModel.js';
import User from '../models/userModel.js';
import Settings from '../models/settingsModel.js';

// @desc    Get comprehensive revenue report
// @route   GET /api/reports/revenue
// @access  Private/Admin
export const getRevenueReport = async (req, res) => {
  try {
    // 1. Total Lifetime Revenue
    const lifetimeRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // 2. Monthly Revenue (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    // 3. Revenue by Payment Method
    const methodRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // 4. Top Selling Courses
    const topCourses = await Enrollment.aggregate([
      {
        $group: {
          _id: '$course',
          studentCount: { $sum: 1 }
        }
      },
      { $sort: { studentCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      { $unwind: '$courseDetails' }
    ]);

    // Load settings for commission % and currency
    const settings = await Settings.findOne({});
    const platformCommissionPct = settings?.platformCommissionPercentage ?? 10;
    const instructorCommissionPct = 100 - platformCommissionPct;
    const currency = settings?.currency || 'ETB';
    const etbUsdRate = settings?.etbUsdRate || 150;

    const lifetimeTotal = lifetimeRevenue[0]?.total || 0;
    const platformFee = parseFloat((lifetimeTotal * platformCommissionPct / 100).toFixed(2));
    const instructorFee = parseFloat((lifetimeTotal * instructorCommissionPct / 100).toFixed(2));

    // If display currency is USD, convert totals
    const convertAmount = (amount) => currency === 'USD' ? parseFloat((amount / etbUsdRate).toFixed(2)) : amount;

    res.json({
      lifetimeTotal: convertAmount(lifetimeTotal),
      platformFee: convertAmount(platformFee),
      instructorFee: convertAmount(instructorFee),
      platformCommissionPct,
      instructorCommissionPct,
      currency,
      monthlyRevenue: monthlyRevenue.map(m => ({ ...m, total: convertAmount(m.total) })),
      methodRevenue,
      topCourses: topCourses.map(c => ({
        id: c._id,
        title: c.courseDetails.title,
        students: c.studentCount,
        price: convertAmount(c.courseDetails.price)
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get public platform stats for homepage
// @route   GET /api/reports/public-stats
// @access  Public
export const getPublicStats = async (req, res) => {
  try {
    const [totalCourses, totalInstructors, totalStudents] = await Promise.all([
      Course.countDocuments({ status: 'published' }),
      User.countDocuments({ role: 'instructor', status: 'approved' }),
      User.countDocuments({ role: 'student' })
    ]);
    res.json({ totalCourses, totalInstructors, totalStudents });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
