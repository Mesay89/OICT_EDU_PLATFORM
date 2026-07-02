import express from 'express';
const router = express.Router();
import { getMyNotifications, markAsRead, markAllAsRead, broadcastNotification, getAllNotifications, deleteNotification, updateNotification } from '../controllers/notificationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/').get(protect, getMyNotifications);
router.route('/read-all').put(protect, markAllAsRead);
router.route('/:id/read').put(protect, markAsRead);
router.route('/broadcast').post(protect, admin, broadcastNotification);
router.route('/all').get(protect, admin, getAllNotifications);
router.route('/:id').delete(protect, admin, deleteNotification).put(protect, admin, updateNotification);

export default router;
