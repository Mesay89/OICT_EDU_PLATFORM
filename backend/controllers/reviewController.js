import asyncHandler from 'express-async-handler';
import Review from '../models/reviewModel.js';
import Course from '../models/courseModel.js';
import Enrollment from '../models/enrollmentModel.js';

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment, courseId } = req.body;

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // Check if user is enrolled
  const enrolled = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (!enrolled) {
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

// @desc    Get user's review for a specific course
// @route   GET /api/reviews/myreview/:courseId
// @access  Private
const getUserReviewForCourse = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ user: req.user._id, course: req.params.courseId });
  res.json(review); // returns null if not found
});

export { createReview, getCourseReviews, deleteReview, getUserReviewForCourse };
