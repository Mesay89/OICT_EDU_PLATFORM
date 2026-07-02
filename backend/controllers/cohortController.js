import Cohort from '../models/cohortModel.js';
import Course from '../models/courseModel.js';

// @desc    Create a new cohort for a course or bundle
// @route   POST /api/cohorts
// @access  Private/Instructor
const createCohort = async (req, res) => {
  try {
    const { name, courseId, bundleId, startDate, endDate } = req.body;

    if (!courseId && !bundleId) {
      return res.status(400).json({ message: 'Must provide either courseId or bundleId' });
    }

    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ message: 'Course not found' });
      if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(401).json({ message: 'Not authorized' });
      }
    }

    if (bundleId) {
      // Import bundle model directly here to avoid circular dependency issues if any
      const Bundle = (await import('../models/bundleModel.js')).default;
      const bundle = await Bundle.findById(bundleId);
      if (!bundle) return res.status(404).json({ message: 'Bundle not found' });
      if (bundle.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(401).json({ message: 'Not authorized' });
      }
    }

    const cohort = new Cohort({
      name,
      course: courseId || undefined,
      bundle: bundleId || undefined,
      instructor: req.user._id,
      startDate,
      endDate,
    });

    const createdCohort = await cohort.save();
    res.status(201).json(createdCohort);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get cohorts for a course or bundle
// @route   GET /api/cohorts/course/:courseId (or bundleId via query maybe, but let's keep it simple)
// We will modify this to take ?bundleId= query param as well, or just add a new route.
// Actually, since the route is /api/cohorts/course/:courseId, we can just use req.query.bundleId in a different route or here.
// Let's modify it to check query params if params.courseId is missing.
const getCohortsByCourse = async (req, res) => {
  try {
    const query = {};
    if (req.params.courseId && req.params.courseId !== 'undefined') {
      query.course = req.params.courseId;
    }
    if (req.query.bundleId) {
      query.bundle = req.query.bundleId;
      delete query.course;
    }

    const cohorts = await Cohort.find(query)
      .populate('instructor', 'name image')
      .populate('students', 'name image email');

    res.json(cohorts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a student to a cohort
// @route   POST /api/cohorts/:id/students
// @access  Private/Instructor
const addStudentToCohort = async (req, res) => {
  try {
    const { studentId } = req.body;
    const cohort = await Cohort.findById(req.params.id);

    if (cohort) {
      if (cohort.instructor.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to modify this cohort' });
      }

      if (cohort.students.includes(studentId)) {
        return res.status(400).json({ message: 'Student already in this cohort' });
      }

      cohort.students.push(studentId);
      await cohort.save();

      const updatedCohort = await Cohort.findById(req.params.id)
        .populate('instructor', 'name image')
        .populate('students', 'name image email');

      res.status(201).json(updatedCohort);
    } else {
      res.status(404).json({ message: 'Cohort not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my cohort for a specific course or bundle
// @route   GET /api/cohorts/my/:courseId
// @access  Private
const getMyCohort = async (req, res) => {
  try {
    const query = { students: { $in: [req.user._id] } };
    if (req.params.courseId && req.params.courseId !== 'undefined') {
      query.course = req.params.courseId;
    }
    if (req.query.bundleId) {
      query.bundle = req.query.bundleId;
      delete query.course;
    }

    const cohort = await Cohort.findOne(query)
      .populate('instructor', 'name image')
      .populate('students', 'name image');

    if (cohort) {
      res.json(cohort);
    } else {
      res.status(404).json({ message: 'Not in a cohort for this course/bundle' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all cohorts managed by instructor
// @route   GET /api/cohorts
// @access  Private/Instructor
const getInstructorCohorts = async (req, res) => {
  try {
    const cohorts = await Cohort.find({ instructor: req.user._id })
      .populate('course', 'title')
      .populate('bundle', 'title')
      .populate('students', 'name email');
    res.json(cohorts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createCohort, getCohortsByCourse, addStudentToCohort, getMyCohort, getInstructorCohorts };
