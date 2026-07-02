import User from '../models/userModel.js';
import Course from '../models/courseModel.js';
import Enrollment from '../models/enrollmentModel.js';

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

export { getAdminStats, getPublicStats };
