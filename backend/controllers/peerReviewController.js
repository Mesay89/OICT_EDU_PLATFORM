import asyncHandler from 'express-async-handler';
import { PeerReview, PeerReviewSubmission } from '../models/peerReviewModel.js';
import { Submission } from '../models/assignmentModel.js';
import Course from '../models/courseModel.js';
import { queueCourseForApproval } from '../utils/courseApprovalUtils.js';

// ─────────────────────────────────────────────────────────────────────────────
// INSTRUCTOR
// ─────────────────────────────────────────────────────────────────────────────

// @desc  Create a peer review task linked to an assignment
// @route POST /api/peer-review
// @access Instructor
export const createPeerReview = asyncHandler(async (req, res) => {
  const { courseId, bundleId, assignmentId, title, instructions, reviewsRequired, rubric, dueDate } = req.body;
  
  if (!courseId && !bundleId) {
    res.status(400); throw new Error('Must provide either courseId or bundleId');
  }

  let relatedEntity;

  if (courseId) {
    relatedEntity = await Course.findById(courseId);
    if (!relatedEntity || relatedEntity.instructor.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not authorized');
    }
  }

  if (bundleId) {
    const Bundle = (await import('../models/bundleModel.js')).default;
    relatedEntity = await Bundle.findById(bundleId);
    if (!relatedEntity || relatedEntity.instructor.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not authorized');
    }
  }

  const pr = await PeerReview.create({
    instructor:      req.user._id,
    course:          courseId || undefined,
    bundle:          bundleId || undefined,
    assignment:      assignmentId,
    title,
    instructions:    instructions    || '',
    reviewsRequired: reviewsRequired || 2,
    rubric:          rubric          || [],
    dueDate:         dueDate         || null,
    isPublished:     false,
  });

  if (courseId) {
    await queueCourseForApproval({
      course: relatedEntity,
      actor: req.user,
      changeSummary: 'added new peer-review content',
    });
  }

  res.status(201).json(pr);
});

// @desc  Publish / unpublish peer review task
// @route PUT /api/peer-review/:id/publish
// @access Instructor
export const togglePublishPeerReview = asyncHandler(async (req, res) => {
  const pr = await PeerReview.findById(req.params.id);
  if (!pr || pr.instructor.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized');
  }
  pr.isPublished = !pr.isPublished;
  await pr.save();

  const course = await Course.findById(pr.course);
  if (course) {
    await queueCourseForApproval({
      course,
      actor: req.user,
      changeSummary: 'updated peer-review availability',
    });
  }

  res.json({ isPublished: pr.isPublished });
});

// @desc  Get all peer reviews for a course (instructor sees all)
// @route GET /api/peer-review/course/:courseId
// @desc  Get peer reviews for course or bundle
// @route GET /api/peer-review/course/:courseId
// @route GET /api/peer-review/bundle/:bundleId
// @access Instructor
export const getCoursePeerReviews = asyncHandler(async (req, res) => {
  const query = { instructor: req.user._id };
  
  // Handle course ID from URL param
  if (req.params.courseId && req.params.courseId !== 'undefined') {
    query.course = req.params.courseId;
  }
  
  // Handle bundle ID from URL param
  if (req.params.bundleId && req.params.bundleId !== 'undefined') {
    query.bundle = req.params.bundleId;
    delete query.course; // Remove course if bundle is specified
  }
  
  // Handle bundle ID from query param (legacy support)
  if (req.query.bundleId) {
    query.bundle = req.query.bundleId;
    delete query.course;
  }

  const prs = await PeerReview.find(query).populate('assignment', 'title').sort({ createdAt: -1 });
  res.json(prs);
});

// @desc  Get all submissions made TO a peer review (instructor analytics)
// @route GET /api/peer-review/:id/submissions
// @access Instructor
export const getPeerReviewSubmissions = asyncHandler(async (req, res) => {
  const subs = await PeerReviewSubmission.find({ peerReview: req.params.id })
    .populate('reviewer', 'name email')
    .populate('reviewee', 'name email')
    .sort({ createdAt: -1 });
  res.json(subs);
});

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT
// ─────────────────────────────────────────────────────────────────────────────

// @desc  Get available peer reviews for a student in a course
// @route GET /api/peer-review/my-tasks/:courseId
// @desc  Get peer review tasks for student (for a course or bundle)
// @route GET /api/peer-review/my-tasks/:courseId
// @route GET /api/peer-review/my-tasks/bundle/:bundleId
// @access Student
export const getMyPeerReviewTasks = asyncHandler(async (req, res) => {
  const query = { isPublished: true };
  
  // Handle course ID from URL param
  if (req.params.courseId && req.params.courseId !== 'undefined') {
    query.course = req.params.courseId;
  }
  
  // Handle bundle ID from URL param
  if (req.params.bundleId && req.params.bundleId !== 'undefined') {
    query.bundle = req.params.bundleId;
    delete query.course; // Remove course if bundle is specified
  }
  
  // Handle bundle ID from query param (legacy support)
  if (req.query.bundleId) {
    query.bundle = req.query.bundleId;
    delete query.course;
  }

  const tasks = await PeerReview.find(query).populate('assignment', 'title').sort({ createdAt: -1 });
  res.json(tasks);
});

// @desc  Get the peers this student needs to review for a given peer review task.
//        Automatically selects N random peers from the assignment submission pool
//        excluding the student themselves and excluding already-reviewed ones.
// @route GET /api/peer-review/:id/peers-to-review
// @access Student
export const getPeersToReview = asyncHandler(async (req, res) => {
  const pr = await PeerReview.findById(req.params.id);
  if (!pr || !pr.isPublished) { res.status(404); throw new Error('Peer review not found'); }

  // Already reviewed by this student
  const alreadyReviewed = await PeerReviewSubmission.find({
    peerReview: pr._id,
    reviewer:   req.user._id,
  }).select('reviewee');
  const alreadyReviewedIds = alreadyReviewed.map(r => r.reviewee.toString());

  // All submissions for the linked assignment (excluding this student)
  const allSubmissions = await Submission.find({ assignment: pr.assignment })
    .populate('student', 'name email')
    .lean();

  const peers = allSubmissions.filter(
    s => s.student._id.toString() !== req.user._id.toString() &&
         !alreadyReviewedIds.includes(s.student._id.toString())
  );

  // Calculate how many more reviews are needed
  const remainingNeeded = pr.reviewsRequired - alreadyReviewedIds.length;

  if (remainingNeeded <= 0) {
    return res.json([]); // Completed all required reviews
  }

  // Shuffle and return only the remaining amount needed
  const shuffled = peers.sort(() => Math.random() - 0.5).slice(0, remainingNeeded);
  res.json(shuffled.map(s => ({
    revieweeId:   s.student._id,
    revieweeName: s.student.name,
    submissionId: s._id,
    fileUrl:      s.fileUrl,
    studentNotes: s.studentNotes,
  })));
});

// @desc  Submit a peer review
// @route POST /api/peer-review/:id/submit
// @access Student
export const submitPeerReview = asyncHandler(async (req, res) => {
  const { revieweeId, rubricScores, overallComment } = req.body;
  const pr = await PeerReview.findById(req.params.id);
  if (!pr || !pr.isPublished) { res.status(404); throw new Error('Peer review not found'); }

  // Prevent double-review
  const exists = await PeerReviewSubmission.findOne({
    peerReview: pr._id, reviewer: req.user._id, reviewee: revieweeId,
  });
  if (exists) { res.status(400); throw new Error('Already reviewed this student'); }

  // Prevent exceeding reviewsRequired limit
  const count = await PeerReviewSubmission.countDocuments({
    peerReview: pr._id, reviewer: req.user._id,
  });
  if (count >= pr.reviewsRequired) {
    res.status(400); throw new Error(`You have already completed the required ${pr.reviewsRequired} reviews.`);
  }

  const totalScore = (rubricScores || []).reduce((sum, r) => sum + (r.score || 0), 0);

  const sub = await PeerReviewSubmission.create({
    peerReview:     pr._id,
    reviewer:       req.user._id,
    reviewee:       revieweeId,
    rubricScores:   rubricScores   || [],
    overallComment: overallComment || '',
    totalScore,
    isComplete:     true,
  });
  res.status(201).json(sub);
});

// @desc  Get the peer reviews received by the current student
// @route GET /api/peer-review/:id/my-feedback
// @access Student
export const getMyPeerFeedback = asyncHandler(async (req, res) => {
  const subs = await PeerReviewSubmission.find({
    peerReview: req.params.id,
    reviewee:   req.user._id,
    isComplete: true,
  }).populate('reviewer', 'name'); // anonymize — name only, no email
  res.json(subs);
});
