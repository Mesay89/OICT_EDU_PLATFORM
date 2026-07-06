import express from 'express';
import {
  addStudentToCohort,
  getMyCohort,
  getInstructorCohorts,
  createCohort,
  getCohortsByCourse
} from '../controllers/cohortController.js';
import { protect, instructor } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, instructor, getInstructorCohorts)
  .post(protect, instructor, createCohort);

router.route('/course/:courseId')
  .get(protect, getCohortsByCourse);

router.route('/bundle/:bundleId')
  .get(protect, getCohortsByCourse);

router.route('/:id/students')
  .post(protect, instructor, addStudentToCohort);

router.route('/my/:courseId')
  .get(protect, getMyCohort);

export default router;
