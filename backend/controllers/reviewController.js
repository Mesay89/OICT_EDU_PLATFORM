import asyncHandler from 'express-async-handler';
import Review from '../models/reviewModel.js';
import Course from '../models/courseModel.js';
import Enrollment from '../models/enrollmentModel.js';

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment, courseId, bundleId } = req.body;

  if (bundleId) {
    // Bundle review flow
    const Bundle = (await import('../models/bundleModel.js')).default;
    const bundle = await Bundle.findById(bundleId);
    if (!bundle) { res.status(404); throw new Error('Bundle not found'); }

    // Check if enrolled in any of the bundle's courses
    const enrolled = await Enrollment.findOne({ user: req.user._id, course: { $in: bundle.courses } });
    if (!enrolled) { res.status(403); throw new Error('Must be enrolled in bundle courses to review'); }

    const alreadyReviewed = await Review.findOne({ user: req.user._id, bundle: bundleId });
    if (alreadyReviewed) { res.status(400); throw new Error('Already reviewed'); }

    const review = await Review.create({
      user: req.user._id,
      bundle: bundleId,
      rating: Number(rating),
      comment,
    });

    const reviews = await Review.find({ bundle: bundleId });
    bundle.numReviews = reviews.length;
    bundle.averageRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
    await bundle.save();

    return res.status(201).json(review);
  }

  // Course review flow
  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // Check if user is enrolled - for free courses, auto-create enrollment
  let enrolled = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (!enrolled && course.price === 0) {
    // Auto-create enrollment for free courses
    enrolled = await Enrollment.create({
      user: req.user._id,
      course: courseId,
    });
  } else if (!enrolled) {
    res.status(403);
    throw new Error('You must be enrolled to review this course');
  }

  // Check if already reviewed
  const alreadyReviewed = await Review.findOne({ user: req.user._id, course: courseId });
  if (alreadyReviewed) {
    res.status(400);
    throw new Error('Course already reviewed');
  }

  const review = await Review.create({
    user: req.user._id,
    course: courseId,
    rating: Number(rating),
    comment,
  });

  // Update Course stats
  const reviews = await Review.find({ course: courseId });
  course.numReviews = reviews.length;
  course.averageRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
  await course.save();

  res.status(201).json(review);
});

// @desc    Get reviews for a course
// @route   GET /api/reviews/course/:courseId
// @access  Public
const getCourseReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ course: req.params.courseId })
    .populate('user', 'name image')
    .sort('-createdAt');
  res.json(reviews);
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (review) {
    const courseId = review.course;
    await review.deleteOne();

    // Recalculate
    const reviews = await Review.find({ course: courseId });
    const course = await Course.findById(courseId);
    if (course) {
      course.numReviews = reviews.length;
      course.averageRating = reviews.length > 0 
        ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length 
        : 0;
      await course.save();
    }

    res.json({ message: 'Review removed' });
  } else {
    res.status(404);
    throw new Error('Review not found');
  }
});

// @desc    Get user's review for a specific course or bundle
// @route   GET /api/reviews/myreview/:id
// @access  Private
const getUserReviewForCourse = asyncHandler(async (req, res) => {
  const id = req.params.id; // route param is :id
  // Try to find review by either course or bundle id
  let review = await Review.findOne({ user: req.user._id, course: id });
  if (!review) {
    review = await Review.findOne({ user: req.user._id, bundle: id });
  }
  res.json(review); // returns null if not found
});

// @desc    Get all reviews (Admin)
// @route   GET /api/admin/reviews
// @access  Private/Admin
const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('user', 'name email image')
    .populate('course', 'title')
    .populate('bundle', 'title')
    .sort('-createdAt');
  res.json(reviews);
});

// @desc    Delete review (Admin)
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
const adminDeleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (review) {
    const courseId = review.course;
    const bundleId = review.bundle;
    await review.deleteOne();

    // Recalculate course rating if applicable
    if (courseId) {
      const reviews = await Review.find({ course: courseId });
      const course = await Course.findById(courseId);
      if (course) {
        course.numReviews = reviews.length;
        course.averageRating = reviews.length > 0 
          ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length 
          : 0;
        await course.save();
      }
    }

    // Recalculate bundle rating if applicable
    if (bundleId) {
      const Bundle = (await import('../models/bundleModel.js')).default;
      const reviews = await Review.find({ bundle: bundleId });
      const bundle = await Bundle.findById(bundleId);
      if (bundle) {
        bundle.numReviews = reviews.length;
        bundle.averageRating = reviews.length > 0 
          ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length 
          : 0;
        await bundle.save();
      }
    }

    res.json({ message: 'Review removed' });
  } else {
    res.status(404);
    throw new Error('Review not found');
  }
});

// @desc    Submit feedback at 80% progress (different from final review)
// @route   POST /api/reviews/feedback
// @access  Private
const submitFeedback = asyncHandler(async (req, res) => {
  const { rating, comment, courseId, progress } = req.body;

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // Check if user is enrolled - for free courses, auto-create enrollment
  let enrolled = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (!enrolled && course.price === 0) {
    // Auto-create enrollment for free courses
    enrolled = await Enrollment.create({
      user: req.user._id,
      course: courseId,
    });
  } else if (!enrolled) {
    res.status(403);
    throw new Error('You must be enrolled to provide feedback');
  }

  // Store feedback as a review with type indicator (we'll use comment prefix)
  // This allows instructor to see mid-course feedback vs final reviews
  const feedbackComment = `[FEEDBACK at ${progress}%] ${comment}`;
  
  // Check if feedback already exists at this stage
  const existingFeedback = await Review.findOne({ 
    user: req.user._id, 
    course: courseId,
    comment: { $regex: /^\[FEEDBACK at/ }
  });

  if (existingFeedback) {
    // Update existing feedback
    existingFeedback.rating = Number(rating);
    existingFeedback.comment = feedbackComment;
    await existingFeedback.save();
    return res.status(200).json(existingFeedback);
  }

  // Create new feedback entry
  const feedback = await Review.create({
    user: req.user._id,
    course: courseId,
    rating: Number(rating),
    comment: feedbackComment,
  });

  // Update Course stats (feedback counts as review)
  const reviews = await Review.find({ course: courseId });
  course.numReviews = reviews.length;
  course.averageRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
  await course.save();

  res.status(201).json(feedback);
});

export { createReview, getCourseReviews, deleteReview, getUserReviewForCourse, getAllReviews, adminDeleteReview, submitFeedback };
