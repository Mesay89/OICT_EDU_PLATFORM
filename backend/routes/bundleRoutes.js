import express from 'express';
import { 
  createBundle, 
  getBundles, 
  getBundleById, 
  initiateBundlePurchase, 
  verifyBundlePurchase 
} from '../controllers/bundleController.js';
import { protect, instructor } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getBundles);
router.get('/:id', getBundleById);
router.post('/', protect, instructor, createBundle);
router.post('/:id/purchase', protect, initiateBundlePurchase);
router.post('/verify', protect, verifyBundlePurchase);

export default router;
