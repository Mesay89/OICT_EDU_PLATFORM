import express from 'express';
import { initiateSubscription, verifySubscription, getMySubscription } from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/initiate', protect, initiateSubscription);
router.post('/verify', protect, verifySubscription);
router.get('/my', protect, getMySubscription);

export default router;
