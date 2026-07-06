import User from '../models/userModel.js';
import Course from '../models/courseModel.js';
import Enrollment from '../models/enrollmentModel.js';
import Payment from '../models/paymentModel.js';
import Withdrawal from '../models/withdrawalModel.js';

// @desc    Get admin statistics
// @route   GET /api/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalCourses = await Course.countDocuments({});
    const totalEnrollments = await Enrollment.countDocuments({});
    
    // Calculate total revenue (simulated)
    const enrollments = await Enrollment.find({}).populate('course');
    const totalRevenue = enrollments.reduce((acc, item) => acc + (item.course?.price || 0), 0);

    res.json({
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

const getPublicStats = async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments({ status: 'published' });
    const totalInstructors = await User.countDocuments({ role: 'instructor' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    
    res.json({
      courses: totalCourses,
      instructors: totalInstructors,
      students: totalStudents
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching public stats' });
  }
};

// @desc    Get instructor statistics
// @route   GET /api/stats/instructor
// @access  Private/Instructor
const getInstructorStats = async (req, res) => {
  try {
    const instructorId = req.user._id;

    // Get platform settings for commission rate
    const Settings = (await import('../models/settingsModel.js')).default;
    const settings = await Settings.findOne();
    const platformCommissionPercentage = (settings?.platformCommissionPercentage || 20) / 100;

    // Get all courses by this instructor
    const courses = await Course.find({ instructor: instructorId });
    const courseIds = courses.map(course => course._id);

    // Get all enrollments with full user and course details
    const enrollments = await Enrollment.find({ course: { $in: courseIds } })
      .populate('user', 'name email')
      .populate('course', 'title price')
      .populate('paymentId', 'status amount currency paymentMethod createdAt');

    // Build unique students map with all their enrollment details
    const studentsMap = new Map();
    let paidEnrollmentCount = 0;
    let freeEnrollmentCount = 0;
    
    // Get USD to ETB conversion rate
    const USD_TO_ETB_RATE = Number(process.env.ETB_USD_RATE) || 150;

    enrollments.forEach(enrollment => {
      if (!enrollment.user) return; // Skip if user was deleted
      
      const userId = enrollment.user._id.toString();
      const isPaid = enrollment.paymentId && enrollment.paymentId.status === 'completed';
      
      // Count enrollments (not students)
      if (isPaid) {
        paidEnrollmentCount++;
      } else {
        freeEnrollmentCount++;
      }

      // Create or update student entry
      if (!studentsMap.has(userId)) {
        studentsMap.set(userId, {
          _id: enrollment.user._id,
          name: enrollment.user.name,
          email: enrollment.user.email,
          courses: [],
          totalPaid: 0,
          hasPaidCourse: false,
          enrolledAt: enrollment.createdAt
        });
      }

      const student = studentsMap.get(userId);
      
      // Convert payment amount to ETB if needed
      let paymentAmountInETB = 0;
      if (isPaid) {
        paymentAmountInETB = enrollment.paymentId.amount;
        if (enrollment.paymentId.currency === 'USD') {
          paymentAmountInETB = enrollment.paymentId.amount * USD_TO_ETB_RATE;
        }
      }
      
      // Add course details
      student.courses.push({
        courseId: enrollment.course._id,
        courseTitle: enrollment.course.title,
        coursePrice: enrollment.course.price,
        progress: enrollment.progress || 0,
        status: enrollment.status,
        isPaid: isPaid,
        paymentAmount: paymentAmountInETB,
        paymentMethod: isPaid ? enrollment.paymentId.paymentMethod : 'free',
        enrolledAt: enrollment.createdAt
      });

      // Update student totals (in ETB)
      if (isPaid) {
        student.totalPaid += paymentAmountInETB;
        student.hasPaidCourse = true;
      }
      
      // Keep earliest enrollment date
      if (new Date(enrollment.createdAt) < new Date(student.enrolledAt)) {
        student.enrolledAt = enrollment.createdAt;
      }
    });

    // Convert map to array and separate students
    const allStudents = Array.from(studentsMap.values());
    const paidStudents = allStudents.filter(s => s.hasPaidCourse === true);
    const freeStudents = allStudents.filter(s => s.hasPaidCourse === false);

    // Total revenue from completed payments
    const payments = await Payment.find({
      course: { $in: courseIds },
      status: 'completed'
    });
    
    // Convert all payments to ETB using exchange rate (already defined above)
    const totalRevenue = payments.reduce((sum, payment) => {
      let amountInETB = payment.amount;
      
      // Convert USD to ETB
      if (payment.currency === 'USD') {
        amountInETB = payment.amount * USD_TO_ETB_RATE;
      }
      
      return sum + amountInETB;
    }, 0);

    // Calculate instructor's net earnings after platform commission
    const instructorEarnings = totalRevenue * (1 - platformCommissionPercentage);

    // Get approved withdrawals to subtract from earnings
    const approvedWithdrawals = await Withdrawal.find({
      user: instructorId,
      status: 'approved'
    });
    const totalWithdrawn = approvedWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

    // Current available balance
    const balance = Math.max(0, instructorEarnings - totalWithdrawn);

    // Pending withdrawals count
    const pendingWithdrawals = await Withdrawal.countDocuments({
      user: instructorId,
      status: 'pending'
    });

    // Get minimum withdrawal amount from settings
    const minimumWithdrawalAmount = settings?.minimumWithdrawalAmount || 500;

    res.json({
      // Student counts
      totalStudents: allStudents.length,
      paidStudentCount: paidStudents.length,
      freeStudentCount: freeStudents.length,
      
      // Enrollment counts (for display)
      paidEnrollments: paidEnrollmentCount,
      freeEnrollments: freeEnrollmentCount,
      
      // Financial data
      totalRevenue,
      balance,
      pendingWithdrawals,
      platformCommissionPercentage: platformCommissionPercentage * 100,
      instructorEarnings,
      totalWithdrawn,
      minimumWithdrawalAmount,
      
      // Student lists with full details
      allStudents: allStudents.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt)),
      paidStudents: paidStudents.sort((a, b) => b.totalPaid - a.totalPaid),
      freeStudents: freeStudents.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
    });
  } catch (error) {
    console.error('Error fetching instructor stats:', error);
    res.status(500).json({ message: 'Error fetching instructor statistics' });
  }
};

export { getAdminStats, getPublicStats, getInstructorStats };
