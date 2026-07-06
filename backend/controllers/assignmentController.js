import { Assignment, Submission } from '../models/assignmentModel.js';
import Course from '../models/courseModel.js';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';
import { queueCourseForApproval } from '../utils/courseApprovalUtils.js';

// @desc    Create new assignment
// @route   POST /api/lms/assignments
// @access  Private/Instructor
const createAssignment = async (req, res) => {
  const { title, description, courseId, bundleId, module, points, dueDate, instructionsFile } = req.body;

  try {
    if (!courseId && !bundleId) {
      return res.status(400).json({ message: 'Must provide either courseId or bundleId' });
    }

    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ message: 'Course not found' });
      if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized as instructor' });
      }
    }

    if (bundleId) {
      const Bundle = (await import('../models/bundleModel.js')).default;
      const bundle = await Bundle.findById(bundleId);
      if (!bundle) return res.status(404).json({ message: 'Bundle not found' });
      if (bundle.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized as instructor' });
      }
    }

    const assignment = await Assignment.create({
      title,
      description,
      course: courseId || undefined,
      bundle: bundleId || undefined,
      instructor: req.user._id,
      module: module || 1,
      questions: req.body.questions || [],
      points,
      dueDate,
      instructionsFile
    });

    // Notify Admins AND SuperAdmins about new assignment with full details
    const approvers = await User.find({ role: { $in: ['admin', 'superAdmin'] } }).select('_id');
    if (approvers.length > 0) {
      const entityLabel = bundleId ? 'bundle' : 'course';
      await Notification.insertMany(approvers.map(a => ({
        recipient: a._id,
        sender: req.user._id,
        type: 'assignment_approval_requested',
        title: 'Assignment Approval Needed',
        message: `Instructor ${req.user.name} created a new assignment for a ${entityLabel}:\n\nTitle: ${title}\nDescription: ${description}\nPoints: ${points || 100}\nModule: ${module}\nDue: ${dueDate || 'No due date'}\n\nPlease review and approve.`,
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
  const { assignmentId, fileUrl, studentNotes, textAnswer, answers } = req.body;

  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Use textAnswer as studentNotes if provided (for compatibility)
    const notes = textAnswer || studentNotes;

    // Check if already submitted
    let submission = await Submission.findOne({
      assignment: assignmentId,
      student: req.user._id
    });

    if (submission) {
      submission.fileUrl = fileUrl || submission.fileUrl;
      submission.studentNotes = notes;
      if (answers) submission.answers = answers;
      submission.status = 'pending'; // Reset status on resubmit
      const updated = await submission.save();
      return res.json(updated);
    }

    submission = await Submission.create({
      assignment: assignmentId,
      student: req.user._id,
      fileUrl,
      studentNotes: notes,
      answers
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
    const query = {};
    let isOwner = false;
    let isPublished = false;

    if (req.params.courseId && req.params.courseId !== 'undefined') {
      const course = await Course.findById(req.params.courseId).select('status instructor');
      if (!course) return res.status(404).json({ message: 'Course not found' });
      isOwner = course.instructor.toString() === req.user._id.toString();
      isPublished = course.status === 'published';
      query.course = req.params.courseId;
    } else if (req.query.bundleId) {
      const Bundle = (await import('../models/bundleModel.js')).default;
      const bundle = await Bundle.findById(req.query.bundleId).select('status instructor');
      if (!bundle) return res.status(404).json({ message: 'Bundle not found' });
      isOwner = bundle.instructor.toString() === req.user._id.toString();
      isPublished = bundle.status === 'approved' || bundle.status === 'published';
      query.bundle = req.query.bundleId;
    } else {
      return res.status(400).json({ message: 'Must provide courseId or bundleId' });
    }

    if (!isPublished && !isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Content is awaiting admin approval.' });
    }

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

// @desc    Get bundle assignments (dedicated - always shows all to owner)
// @route   GET /api/lms/bundles/:bundleId/assignments
// @access  Private
const getBundleAssignments = async (req, res) => {
  try {
    const bundleId = req.params.bundleId;
    const Bundle = (await import('../models/bundleModel.js')).default;
    const bundle = await Bundle.findById(bundleId).select('status instructor');
    if (!bundle) return res.status(404).json({ message: 'Bundle not found' });

    const isOwner = bundle.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superAdmin';

    const query = { bundle: bundleId };

    if (req.user.role === 'student') {
      // Students only see approved assignments AND only if bundle is approved
      const isPublished = bundle.status === 'approved' || bundle.status === 'published';
      if (!isPublished) {
        return res.status(403).json({ message: 'Bundle is not yet published.' });
      }
      query.status = 'approved';
    } else if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    // Owners and admins see ALL assignments (pending, approved, rejected)

    const assignments = await Assignment.find(query).sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// @desc    Get my submissions for a course or bundle
// @route   GET /api/lms/my-submissions/:courseId
// @access  Private
const getMySubmissions = async (req, res) => {
  try {
    const query = {};
    if (req.params.courseId && req.params.courseId !== 'undefined') {
      query.course = req.params.courseId;
    } else if (req.query.bundleId) {
      query.bundle = req.query.bundleId;
    }

    // Find all assignments for this course/bundle
    const assignments = await Assignment.find(query).select('_id');
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
  const { status, rejectionReason } = req.body;

  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    assignment.status = status;
    const updated = await assignment.save();

    // Notify Instructor with result and reason if rejected
    await Notification.create({
      recipient: assignment.instructor,
      sender: req.user._id,
      type: 'assignment_status_updated',
      title: status === 'approved' ? '✅ Assignment Approved' : '❌ Assignment Rejected',
      message: status === 'approved'
        ? `Your assignment "${assignment.title}" has been approved and is now live for students.`
        : `Your assignment "${assignment.title}" was rejected. Reason: ${rejectionReason || 'No reason provided'}`,
      relatedId: assignment._id
    });

    // Notify Students if approved
    if (status === 'approved') {
      try {
        const Enrollment = (await import('../models/enrollmentModel.js')).default;
        
        // Find students enrolled in the course or bundle
        let enrolledQuery = {};
        if (assignment.course) enrolledQuery.course = assignment.course;
        else if (assignment.bundle) enrolledQuery.bundle = assignment.bundle;
        
        const enrolledStudents = await Enrollment.find(enrolledQuery).select('user');
        
        if (enrolledStudents.length > 0) {
          const notifications = enrolledStudents.map(enrollment => ({
            recipient: enrollment.user,
            sender: req.user._id,
            type: 'assignment_released',
            title: 'New Assignment Released!',
            message: `A new assignment "${assignment.title}" is now available.`,
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

// @desc    Get instructor's assignment history
// @route   GET /api/lms/instructor/assignments/history
// @access  Private/Instructor
const getInstructorAssignmentHistory = async (req, res) => {
  try {
    const assignments = await Assignment.find({ instructor: req.user._id })
      .populate('course', 'title')
      .populate('bundle', 'title')
      .sort({ updatedAt: -1 });
    res.json(assignments);
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
      .populate('bundle', 'title')
      .populate('instructor', 'name email')
      .sort({ updatedAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Edit assignment (resets to pending, re-notifies admins)
// @route   PUT /api/lms/assignments/:id
// @access  Private/Instructor
const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    if (assignment.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const { title, description, module, points, dueDate, questions } = req.body;
    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (module) assignment.module = module;
    if (points) assignment.points = points;
    if (dueDate) assignment.dueDate = dueDate;
    if (questions) assignment.questions = questions;
    // Reset to pending for re-approval
    assignment.status = 'pending';
    const updated = await assignment.save();
    // Re-notify admins
    const approvers = await User.find({ role: { $in: ['admin', 'superAdmin'] } }).select('_id');
    if (approvers.length > 0) {
      await Notification.insertMany(approvers.map(a => ({
        recipient: a._id,
        sender: req.user._id,
        type: 'assignment_approval_requested',
        title: 'Assignment Re-Approval Needed',
        message: `Instructor ${req.user.name} edited assignment "${updated.title}". Please review and approve.`,
        relatedId: updated._id
      })));
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete assignment (instructor only, only if not approved)
// @route   DELETE /api/lms/assignments/:id
// @access  Private/Instructor
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    if (assignment.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await assignment.deleteOne();
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Resend assignment for approval (re-notify admins)
// @route   POST /api/lms/assignments/:id/resend
// @access  Private/Instructor
const resendAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    if (assignment.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    assignment.status = 'pending';
    await assignment.save();
    const approvers = await User.find({ role: { $in: ['admin', 'superAdmin'] } }).select('_id');
    if (approvers.length > 0) {
      await Notification.insertMany(approvers.map(a => ({
        recipient: a._id,
        sender: req.user._id,
        type: 'assignment_approval_requested',
        title: 'Assignment Approval Requested (Resent)',
        message: `Instructor ${req.user.name} is requesting re-approval for assignment "${assignment.title}".`,
        relatedId: assignment._id
      })));
    }
    res.json({ message: 'Assignment resent for approval', assignment });
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
  getBundleAssignments,
  getMySubmissions,
  getPendingAssignments,
  getInstructorAssignmentHistory,
  getAssignmentHistoryAdmin,
  updateAssignmentStatus,
  updateAssignment,
  deleteAssignment,
  resendAssignment
};
