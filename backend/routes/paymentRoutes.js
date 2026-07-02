import express from 'express';
import { 
  initiatePayment, 
  verifyPayment, 
  verifyGateway,
  getMyPayments, 
  cancelPayment,
  requestRefund,
  chapaWebhook,
  payWithBalance,
  initiateBundlePayment,
  verifyBundlePayment,
  payBundleWithBalance
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/initiate', protect, initiatePayment);
router.post('/pay-with-balance', protect, payWithBalance);
router.post('/verify', protect, verifyPayment);
router.post('/verify-gateway', protect, verifyGateway);
router.get('/my-payments', protect, getMyPayments);
router.put('/:id/cancel', protect, cancelPayment);
router.post('/:id/refund-request', protect, requestRefund);

// Bundle payment routes
router.post('/initiate-bundle', protect, initiateBundlePayment);
router.post('/verify-bundle', protect, verifyBundlePayment);
router.post('/pay-bundle-with-balance', protect, payBundleWithBalance);

// Public Webhook for Chapa
router.post('/chapa-webhook', chapaWebhook);

export default router;
