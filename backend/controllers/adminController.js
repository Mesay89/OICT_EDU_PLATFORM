import User from '../models/userModel.js';
import Course from '../models/courseModel.js';
import Enrollment from '../models/enrollmentModel.js';
import AuditLog from '../models/auditLogModel.js';
import Notification from '../models/notificationModel.js';
import { createAuditLog } from '../utils/auditLogger.js';
import { clearCache } from '../middleware/cacheMiddleware.js';

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    const pendingInstructors = await User.countDocuments({ 
      role: 'instructor', 
      status: 'pending' 
    });
    const pendingCourses = await Course.countDocuments({ status: 'pending' });

    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentCourses = await Course.find()
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        pendingInstructors,
        pendingCourses
      },
      recentUsers,
      recentCourses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all pending instructor approvals
// @route   GET /api/admin/pending-instructors
// @access  Private/Admin
export const getPendingInstructors = async (req, res) => {
  try {
    const pendingInstructors = await User.find({
      role: 'instructor',
      status: 'pending'
    }).select('-password').sort({ createdAt: -1 });

    res.json(pendingInstructors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve instructor
// @route   PUT /api/admin/approve-instructor/:id
// @access  Private/Admin
export const approveInstructor = async (req, res) => {
  try {
    const instructor = await User.findById(req.params.id);

    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    if (instructor.role !== 'instructor') {
      return res.status(400).json({ message: 'User is not an instructor' });
    }

    const updatedInstructor = await User.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        isApproved: true,
        approvedBy: req.user._id,
        approvedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Instructor approved successfully',
      instructor: {
        id: updatedInstructor._id,
        name: updatedInstructor.name,
        email: updatedInstructor.email,
        status: updatedInstructor.status
      }
    });
  } catch (error) {
    console.error('Error in approveInstructor:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject instructor
// @route   PUT /api/admin/reject-instructor/:id
// @access  Private/Admin
export const rejectInstructor = async (req, res) => {
  try {
    const instructor = await User.findById(req.params.id);

    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    const updatedInstructor = await User.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        isApproved: false
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Instructor rejected',
      instructor: {
        id: updatedInstructor._id,
        name: updatedInstructor.name,
        email: updatedInstructor.email,
        status: updatedInstructor.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Revoke instructor permission
// @route   PUT /api/admin/revoke-instructor/:id
// @access  Private/Admin
export const revokeInstructor = async (req, res) => {
  try {
    const instructor = await User.findById(req.params.id);

    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    if (instructor.role !== 'instructor') {
      return res.status(400).json({ message: 'User is not an instructor' });
    }

    instructor.status = 'suspended';
    instructor.isApproved = false;

    await instructor.save();

    res.json({
      message: 'Instructor permission revoked',
      instructor: {
        id: instructor._id,
        name: instructor.name,
        email: instructor.email,
        status: instructor.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all courses with instructor details
// @route   GET /api/admin/courses
// @access  Private/Admin
export const getAllCoursesAdmin = async (req, res) => {
  try {
    const coursesWithStats = await Course.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'instructor',
          foreignField: '_id',
          as: 'instructor'
        }
      },
      { $unwind: '$instructor' },
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'course',
          as: 'enrollments'
        }
      },
      {
        $project: {
          title: 1,
          category: 1,
          price: 1,
          status: 1,
          isFeatured: 1,
          averageRating: 1,
          createdAt: 1,
          'instructor.name': 1,
          'instructor.email': 1,
          'instructor.status': 1,
          enrollmentCount: { $size: '$enrollments' }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.json(coursesWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Grant admin role to user
// @route   PUT /api/admin/grant-admin/:id
// @access  Private/Admin
export const grantAdminRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'User is already an admin' });
    }

    user.role = 'admin';
    user.status = 'approved';
    user.isApproved = true;
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();

    await user.save();

    res.json({
      message: 'Admin role granted successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Revoke admin role from user
// @route   PUT /api/admin/revoke-admin/:id
// @access  Private/Admin
export const revokeAdminRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(400).json({ message: 'User is not an admin' });
    }

    user.role = 'student';
    user.status = 'approved'; 
    await user.save();

    await createAuditLog(req.user._id, 'Revoke Admin Role', 'user', user._id, { name: user.name });

    res.json({
      message: 'Admin role revoked successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users with their roles and status
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete course (admin only)
// @route   DELETE /api/admin/courses/:id
// @access  Private/Admin
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await Enrollment.deleteMany({ course: course._id });
    await Course.findByIdAndDelete(req.params.id);

    await createAuditLog(req.user._id, 'Delete Course', 'course', req.params.id, { title: course.title });
    clearCache('/api/courses');

    res.json({ message: 'Course and related enrollments deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle featured status of course
// @route   PUT /api/admin/courses/:id/featured
// @access  Private/Admin
export const toggleFeaturedCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.isFeatured = !course.isFeatured;
    await course.save();

    await createAuditLog(req.user._id, course.isFeatured ? 'Feature Course' : 'Unfeature Course', 'course', req.params.id, { title: course.title });
    clearCache('/api/courses');

    res.json({ message: `Course ${course.isFeatured ? 'featured' : 'unfeatured'} successfully`, isFeatured: course.isFeatured });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Suspend general user
// @route   PUT /api/admin/users/:id/suspend
// @access  Private/Admin
export const suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.status = 'suspended';
    await user.save();
    
    try {
      await Notification.create({
        recipient: user._id,
        sender: req.user._id,
        type: 'account_suspended',
        title: 'Account Suspended',
        message: 'Your account has been suspended by an administrator. Please contact admin@oicttutor.com for private assistance.',
        relatedId: user._id
      });
    } catch (notificationError) {
      console.error('Failed to send account suspension notification:', notificationError);
    }
    
    await createAuditLog(req.user._id, 'Suspend User', 'user', user._id, { name: user.name });
    res.json({ message: 'User suspended', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Activate general user
// @route   PUT /api/admin/users/:id/activate
// @access  Private/Admin
export const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.status = 'approved';
    await user.save();
    
    await createAuditLog(req.user._id, 'Activate User', 'user', user._id, { name: user.name });
    res.json({ message: 'User activated', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve course content
// @route   PUT /api/admin/courses/:id/approve
// @access  Private/Admin
export const approveCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    course.status = 'published';
    await course.save();
    clearCache('/api/courses');

    await Notification.deleteMany({
      type: 'course_approval_requested',
      relatedId: course._id
    });

    try {
      await Notification.create({
        recipient: course.instructor,
        sender: req.user._id,
        type: 'course_approved',
        title: 'Course Approved!',
        message: `Your course "${course.title}" has been approved and is now live in the catalog.`,
        relatedId: course._id
      });
    } catch (notificationError) {
      console.error('Failed to send course approval notification to instructor:', notificationError);
    }
    
    await createAuditLog(req.user._id, 'Approve Course', 'course', course._id, { title: course.title });
    res.json({ message: 'Course approved and published', course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject course content
// @route   PUT /api/admin/courses/:id/reject
// @access  Private/Admin
export const rejectCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    course.status = 'rejected';
    await course.save();
    clearCache('/api/courses');

    await Notification.deleteMany({
      type: 'course_approval_requested',
      relatedId: course._id
    });

    try {
      await Notification.create({
        recipient: course.instructor,
        sender: req.user._id,
        type: 'course_rejected',
        title: 'Course Rejected',
        message: `Your course "${course.title}" has been rejected. Please review our guidelines and try again.`,
        relatedId: course._id
      });
    } catch (notificationError) {
      console.error('Failed to send course rejection notification to instructor:', notificationError);
    }
    
    await createAuditLog(req.user._id, 'Reject Course', 'course', course._id, { title: course.title });
    res.json({ message: 'Course rejected', course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all pending courses
// @route   GET /api/admin/courses/pending
// @access  Private/Admin
export const getPendingCoursesAdmin = async (req, res) => {
  try {
    const courses = await Course.find({ status: 'pending' })
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get course decision history (published/rejected)
// @route   GET /api/admin/courses/history
// @access  Private/Admin
export const getCourseHistoryAdmin = async (req, res) => {
  try {
    const courses = await Course.find({ status: { $in: ['published', 'rejected'] } })
      .populate('instructor', 'name email')
      .sort({ updatedAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get instructor decision history
// @route   GET /api/admin/instructors/history
// @access  Private/Admin
export const getInstructorHistoryAdmin = async (req, res) => {
  try {
    const instructors = await User.find({
      role: 'instructor',
      status: { $in: ['approved', 'rejected'] }
    }).select('-password').sort({ updatedAt: -1 });

    res.json(instructors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all audit logs
// @route   GET /api/admin/audit-logs
// @access  Private/Admin
export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('admin', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
