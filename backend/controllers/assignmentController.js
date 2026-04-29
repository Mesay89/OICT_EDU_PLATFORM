import { Assignment, Submission } from '../models/assignmentModel.js';
import Course from '../models/courseModel.js';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';
import { queueCourseForApproval } from '../utils/courseApprovalUtils.js';

// @desc    Create new assignment
// @route   POST /api/lms/assignments
// @access  Private/Instructor
const createAssignment = async (req, res) => {
  const { title, description, courseId, module, points, dueDate, instructionsFile } = req.body;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized as instructor' });
    }

    const assignment = await Assignment.create({
      title,
      description,
      course: courseId,
      instructor: req.user._id,
      module,
      points,
      dueDate,
      instructionsFile
    });

    // Notify Admins about new assignment
    const admins = await User.find({ role: 'admin' }).select('_id');
    if (admins.length > 0) {
      await Notification.insertMany(admins.map(admin => ({
        recipient: admin._id,
        sender: req.user._id,
        type: 'assignment_approval_requested',
        title: 'Assignment Approval Needed',
        message: `Instructor ${req.user.name} created a new assignment: "${title}". Approval is required.`,
        relatedId: assignment._id
      })));
    }

    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Submit assignment
// @route   POST /api/lms/submissions
// @access  Private
const submitAssignment = async (req, res) => {
  const { assignmentId, fileUrl, studentNotes } = req.body;

  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if student already submitted
    const existing = await Submission.findOne({ assignment: assignmentId, student: req.user._id });
    if (existing) {
      existing.fileUrl = fileUrl;
      existing.studentNotes = studentNotes;
      existing.status = 'pending';
      const updated = await existing.save();
      return res.json(updated);
    }

    const submission = await Submission.create({
      assignment: assignmentId,
      student: req.user._id,
      fileUrl,
      studentNotes
    });
    
    // Notify Instructor
    await Notification.create({
      recipient: assignment.instructor,
      sender: req.user._id,
      type: 'assignment_submitted',
      title: 'New Assignment Submission',
      message: `${req.user.name} has submitted work for "${assignment.title}"`,
      relatedId: submission._id
    });

    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get submissions for an assignment (Instructor only)
// @route   GET /api/lms/assignments/:id/submissions
// @access  Private/Instructor
const getAssignmentSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const submissions = await Submission.find({ assignment: req.params.id }).populate('student', 'name email image');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Grade a submission
// @route   PUT /api/lms/submissions/:id/grade
// @access  Private/Instructor
const gradeSubmission = async (req, res) => {
  const { score, feedback, status } = req.body;

  try {
    const submission = await Submission.findById(req.params.id).populate('assignment');
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.assignment.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    submission.score = score;
    submission.feedback = feedback;
    submission.status = status || 'graded';
    submission.gradedAt = Date.now();
    submission.gradedBy = req.user._id;

    const updated = await submission.save();

    // Notify Student
    await Notification.create({
      recipient: submission.student,
      sender: req.user._id,
      type: 'assignment_graded',
      title: 'Assignment Graded',
      message: `Your work for "${submission.assignment.title}" has been graded. Score: ${score}/${submission.assignment.points}`,
      relatedId: submission._id
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get course assignments
// @route   GET /api/lms/courses/:courseId/assignments
// @access  Private
const getCourseAssignments = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).select('status instructor');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isOwner = course.instructor.toString() === req.user._id.toString();
    if (course.status !== 'published' && !isOwner) {
      return res.status(403).json({ message: 'Course content is awaiting admin approval.' });
    }

    const query = { course: req.params.courseId };
    
    // Students only see approved assignments. Instructors/Admins see all.
    if (req.user.role === 'student') {
      query.status = 'approved';
    }

    const assignments = await Assignment.find(query);
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get my submissions for a course
// @route   GET /api/lms/my-submissions/:courseId
// @access  Private
const getMySubmissions = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).select('status instructor');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isOwner = course.instructor.toString() === req.user._id.toString();
    if (course.status !== 'published' && !isOwner) {
      return res.status(403).json({ message: 'Course content is awaiting admin approval.' });
    }

    // Find all assignments for this course
    const assignments = await Assignment.find({ course: req.params.courseId }).select('_id');
    const assignmentIds = assignments.map(a => a._id);

    // Find submissions for this student for these assignments
    const submissions = await Submission.find({
      student: req.user._id,
      assignment: { $in: assignmentIds }
    });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all pending assignments (Admin only)
// @route   GET /api/lms/admin/pending-assignments
// @access  Private/Admin
const getPendingAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ status: 'pending' })
      .populate('course', 'title')
      .populate('instructor', 'name email');
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Approve or Reject assignment (Admin only)
// @route   PUT /api/lms/assignments/:id/status
// @access  Private/Admin
const updateAssignmentStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    assignment.status = status;
    const updated = await assignment.save();

    // Notify Instructor
    await Notification.create({
      recipient: assignment.instructor,
      sender: req.user._id,
      type: 'assignment_status_updated',
      title: `Assignment ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your assignment "${assignment.title}" has been ${status} by Admin.`,
      relatedId: assignment._id
    });

    // Notify Students if approved
    if (status === 'approved') {
      try {
        const Enrollment = (await import('../models/enrollmentModel.js')).default;
        const enrolledStudents = await Enrollment.find({ course: assignment.course }).select('user');
        
        if (enrolledStudents.length > 0) {
          const notifications = enrolledStudents.map(enrollment => ({
            recipient: enrollment.user,
            sender: req.user._id,
            type: 'assignment_released',
            title: 'New Assignment Released!',
            message: `A new assignment "${assignment.title}" is now available for your course.`,
            relatedId: assignment._id
          }));
          await Notification.insertMany(notifications, { ordered: false });
        }
      } catch (err) {
        console.error('Failed to notify students of assignment release:', err);
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get assignment decision history (approved/rejected)
// @route   GET /api/lms/admin/assignments/history
// @access  Private/Admin
const getAssignmentHistoryAdmin = async (req, res) => {
  try {
    const assignments = await Assignment.find({ status: { $in: ['approved', 'rejected'] } })
      .populate('course', 'title')
      .populate('instructor', 'name email')
      .sort({ updatedAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export {
  createAssignment,
  submitAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  getCourseAssignments,
  getMySubmissions,
  getPendingAssignments,
  getAssignmentHistoryAdmin,
  updateAssignmentStatus
};
