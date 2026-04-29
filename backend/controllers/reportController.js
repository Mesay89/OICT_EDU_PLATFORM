import Payment from '../models/paymentModel.js';
import Course from '../models/courseModel.js';
import Enrollment from '../models/enrollmentModel.js';

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

    res.json({
      lifetimeTotal: lifetimeRevenue[0]?.total || 0,
      monthlyRevenue,
      methodRevenue,
      topCourses: topCourses.map(c => ({
        id: c._id,
        title: c.courseDetails.title,
        students: c.studentCount,
        price: c.courseDetails.price
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
