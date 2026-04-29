import Cohort from '../models/cohortModel.js';
import Course from '../models/courseModel.js';

// @desc    Create a new cohort for a course
// @route   POST /api/cohorts
// @access  Private/Instructor
const createCohort = async (req, res) => {
  try {
    const { name, courseId, startDate, endDate } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to create a cohort for this course' });
    }

    const cohort = new Cohort({
      name,
      course: courseId,
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

// @desc    Get cohorts for a course
// @route   GET /api/cohorts/course/:courseId
// @access  Private
const getCohortsByCourse = async (req, res) => {
  try {
    const cohorts = await Cohort.find({ course: req.params.courseId })
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

// @desc    Get my cohort for a specific course
// @route   GET /api/cohorts/my/:courseId
// @access  Private
const getMyCohort = async (req, res) => {
  try {
    const cohort = await Cohort.findOne({
      course: req.params.courseId,
      students: { $in: [req.user._id] },
    }).populate('instructor', 'name image')
      .populate('students', 'name image');

    if (cohort) {
      res.json(cohort);
    } else {
      res.status(404).json({ message: 'Not in a cohort for this course' });
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
      .populate('students', 'name email');
    res.json(cohorts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createCohort, getCohortsByCourse, addStudentToCohort, getMyCohort, getInstructorCohorts };
