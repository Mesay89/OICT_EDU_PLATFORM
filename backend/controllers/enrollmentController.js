import Enrollment from '../models/enrollmentModel.js';
import Course from '../models/courseModel.js';
import User from '../models/userModel.js';
import crypto from 'crypto';
import fireWebhook from '../utils/webhookDispatcher.js';

// @desc    Enroll in a course
// @route   POST /api/enrollments
// @access  Private
const enrollCourse = async (req, res) => {
  if (req.user.role === 'instructor') {
    return res.status(403).json({ message: 'Instructors cannot enroll in courses to continue learning.' });
  }

  const { courseId } = req.body;

  const course = await Course.findById(courseId);

  if (!course) {
    res.status(404).json({ message: 'Course not found' });
    return;
  }

  if (course.status !== 'published') {
    res.status(403).json({ message: 'This course is awaiting admin approval and is not available for enrollment.' });
    return;
  }

  const alreadyEnrolled = await Enrollment.findOne({
    user: req.user._id,
    course: courseId,
  });

  if (alreadyEnrolled) {
    res.status(400).json({ message: 'Already enrolled in this course' });
    return;
  }

  // PRICING INTEGRITY CHECK: Only allow free courses to be enrolled directly
  if (course.price > 0) {
    res.status(400).json({ message: 'Payment required for this course. Please complete checkout.' });
    return;
  }

  const enrollment = new Enrollment({
    user: req.user._id,
    course: courseId,
  });

  const createdEnrollment = await enrollment.save();
  
  // Fire Webhook
  fireWebhook('enrollment.created', {
    enrollmentId: createdEnrollment._id,
    userId: req.user._id,
    courseId: courseId,
    email: req.user.email
  }, course.instructor);

  res.status(201).json(createdEnrollment);
};

// @desc    Manual enroll a student (Instructor/Admin only)
// @route   POST /api/enrollments/manual
// @access  Private/Instructor/Admin
const enrollUserManual = async (req, res) => {
  const { email, courseId } = req.body;

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Auth check
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const student = await User.findOne({ email });
    if (!student) return res.status(404).json({ message: 'Student not found with this email' });

    const alreadyEnrolled = await Enrollment.findOne({ user: student._id, course: courseId });
    if (alreadyEnrolled) {
      if (alreadyEnrolled.status === 'dropped') {
        alreadyEnrolled.status = 'active';
        await alreadyEnrolled.save();
        return res.json({ message: 'Enrollment reactivated', enrollment: alreadyEnrolled });
      }
      return res.status(400).json({ message: 'Student already enrolled' });
    }

    const enrollment = await Enrollment.create({ user: student._id, course: courseId, status: 'active' });
    res.status(201).json(enrollment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Unenroll a student manually (Instructor/Admin only)
// @route   DELETE /api/enrollments/manual/:courseId/:userId
// @access  Private/Instructor/Admin
const unenrollUserManual = async (req, res) => {
  try {
    const { courseId, userId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Auth check
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    enrollment.status = 'dropped';
    await enrollment.save();
    res.json({ message: 'Student unenrolled successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get course student roster
// @route   GET /api/enrollments/course/:courseId/students
// @access  Private/Instructor/Admin
const getCourseStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Auth check
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const enrollments = await Enrollment.find({ course: courseId, status: 'active' }).populate('user', 'name email image');
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get user enrollments
// @route   GET /api/enrollments/myenrollments
// @access  Private
const getMyEnrollments = async (req, res) => {
  try {
    // Check if user has active subscription
    const Subscription = (await import('../models/subscriptionModel.js')).default;
    const activeSub = await Subscription.findOne({
      user: req.user._id,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (activeSub) {
      // Return ALL courses as virtual enrollments
      const courses = await Course.find({ status: 'published' }).select('title image instructor price');
      const virtualEnrollments = courses.map(course => ({
        _id: `virtual-${course._id}`,
        course,
        user: req.user._id,
        status: 'active',
        progress: 0,
        moduleProgress: [],
        createdAt: new Date()
      }));
      return res.json(virtualEnrollments);
    }

    const enrollments = await Enrollment.find({ user: req.user._id }).populate(
      'course',
      'title image instructor price'
    );
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching enrollments' });
  }
};

// @desc    Update video progress
// @route   PUT /api/enrollments/:courseId/progress
// @access  Private
const updateVideoProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { moduleId, watchedDuration, totalDuration } = req.body;

    let enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
    });

    // If no enrollment exists (free course), create one
    if (!enrollment) {
      enrollment = new Enrollment({
        user: req.user._id,
        course: courseId,
      });
    }

    // Find or create module progress
    const moduleIndex = enrollment.moduleProgress.findIndex(
      (m) => m.moduleId === moduleId
    );

    const completed = watchedDuration >= totalDuration * 0.9; // 90% watched = completed

    if (moduleIndex >= 0) {
      // Update existing module progress - only increase, never decrease
      const existingProgress = enrollment.moduleProgress[moduleIndex];
      const newWatchedDuration = Math.max(existingProgress.watchedDuration, watchedDuration);
      
      enrollment.moduleProgress[moduleIndex].watchedDuration = newWatchedDuration;
      enrollment.moduleProgress[moduleIndex].totalDuration = totalDuration;
      enrollment.moduleProgress[moduleIndex].completed = completed || existingProgress.completed;
      enrollment.moduleProgress[moduleIndex].lastWatchedAt = new Date();
    } else {
      // Add new module progress
      enrollment.moduleProgress.push({
        moduleId,
        watchedDuration,
        totalDuration,
        completed,
        lastWatchedAt: new Date(),
      });
    }

    // Calculate overall progress
    const course = await Course.findById(courseId);
    const totalModules = course.modules.length;
    
    // We count the intro video + all modules as segments
    const allSegments = ['intro-video'];
    course.modules.forEach((mod, i) => {
      allSegments.push(mod._id ? mod._id.toString() : `module-${i}`);
    });

    let totalProgressSum = 0;
    allSegments.forEach((segId) => {
      const segProg = enrollment.moduleProgress.find(m => m.moduleId === segId);
      if (segProg && segProg.totalDuration > 0) {
        totalProgressSum += Math.min((segProg.watchedDuration / segProg.totalDuration) * 100, 100);
      }
    });

    const newProgress = Math.round(totalProgressSum / allSegments.length);
    enrollment.progress = Math.max(enrollment.progress || 0, newProgress);

    await enrollment.save();

    res.json({
      progress: enrollment.progress,
      moduleProgress: enrollment.moduleProgress,
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: 'Failed to update progress' });
  }
};

// @desc    Get course progress
// @route   GET /api/enrollments/:courseId/progress
// @access  Private
const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    let enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
    }).populate('course');

    // If no enrollment exists (free course), return default progress
    if (!enrollment) {
      return res.json({
        progress: 0,
        moduleProgress: [],
        quizScore: null,
        certificateIssued: false,
      });
    }

    res.json({
      progress: enrollment.progress,
      moduleProgress: enrollment.moduleProgress,
      quizScore: enrollment.quizScore,
      quizAttempts: enrollment.quizAttempts,
      certificateIssued: enrollment.certificateIssued,
      certificateId: enrollment.certificateId,
      status: enrollment.status,
    });
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({ message: 'Failed to get progress' });
  }
};

// @desc    Submit quiz and generate certificate
// @route   POST /api/enrollments/:courseId/complete
// @access  Private
const completeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { quizScore } = req.body;

    let enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
    }).populate('course').populate('user', 'name email');

    // If no enrollment exists (free course), create one
    if (!enrollment) {
      enrollment = new Enrollment({
        user: req.user._id,
        course: courseId,
      });
      await enrollment.populate('course');
      await enrollment.populate('user', 'name email');
    }

    // Check if progress is at least 80%
    if (enrollment.progress < 80) {
      return res.status(400).json({
        message: 'You must complete at least 80% of the course videos before taking the quiz',
        currentProgress: enrollment.progress,
      });
    }

    // Update quiz score
    enrollment.quizScore = quizScore;
    enrollment.quizAttempts += 1;
    enrollment.quizCompletedAt = new Date();

    // Generate certificate if score >= 70% and not already issued
    if (quizScore >= 70 && !enrollment.certificateIssued) {
      const certificateId = crypto.randomBytes(16).toString('hex');
      enrollment.certificateIssued = true;
      enrollment.certificateId = certificateId;
      enrollment.certificateIssuedAt = new Date();
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
      enrollment.progress = 100;
    }

    await enrollment.save();

    // Fire Webhook
    fireWebhook('course.completed', {
      enrollmentId: enrollment._id,
      userId: req.user._id,
      courseId: courseId,
      certificateId: enrollment.certificateId,
      score: quizScore
    }, enrollment.course.instructor);

    res.json({
      success: true,
      quizScore: enrollment.quizScore,
      certificateIssued: enrollment.certificateIssued,
      certificateId: enrollment.certificateId,
      message: enrollment.certificateIssued
        ? 'Congratulations! Your certificate has been generated.'
        : quizScore < 70
        ? 'You need at least 70% to earn a certificate. Please try again.'
        : 'Quiz submitted successfully.',
    });
  } catch (error) {
    console.error('Error completing course:', error);
    res.status(500).json({ message: 'Failed to complete course' });
  }
};

// @desc    Get certificate
// @route   GET /api/enrollments/:courseId/certificate
// @access  Private
const getCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
    }).populate('course', 'title category').populate('user', 'name email');

    if (!enrollment || !enrollment.certificateIssued) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    res.json({
      certificateId: enrollment.certificateId,
      studentName: enrollment.user.name,
      courseName: enrollment.course.title,
      category: enrollment.course.category,
      completedAt: enrollment.completedAt,
      quizScore: enrollment.quizScore,
      issuedAt: enrollment.certificateIssuedAt,
    });
  } catch (error) {
    console.error('Error getting certificate:', error);
    res.status(500).json({ message: 'Failed to get certificate' });
  }
};

// @desc    Delete enrollment (remove course from student dashboard)
// @route   DELETE /api/enrollments/:enrollmentId
// @access  Private
const deleteEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.enrollmentId);
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Check if the enrollment belongs to the current user
    if (enrollment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this enrollment' });
    }

    // Soft delete by setting status to dropped
    enrollment.status = 'dropped';
    await enrollment.save();
    res.json({ message: 'Enrollment removed from your dashboard' });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    res.status(500).json({ message: 'Failed to remove enrollment' });
  }
};

export { 
  enrollCourse,
  enrollUserManual,
  unenrollUserManual,
  getCourseStudents,
  getMyEnrollments, 
  updateVideoProgress, 
  getCourseProgress,
  completeCourse,
  getCertificate,
  deleteEnrollment
};
