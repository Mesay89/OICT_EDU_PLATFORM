import express from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  sendAnnouncement,
} from '../controllers/announcementController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getAnnouncements)
  .post(protect, admin, createAnnouncement);

router.route('/:id')
  .put(protect, admin, updateAnnouncement)
  .delete(protect, admin, deleteAnnouncement);

router.route('/:id/send')
  .post(protect, admin, sendAnnouncement);

export default router;
