import express from 'express';
import { 
  createBundle, 
  getBundles, 
  getBundleById, 
  initiateBundlePurchase, 
  verifyBundlePurchase,
  updateBundle,
  deleteBundle,
  getMyBundles,
  getPendingBundles,
  getBundleHistory,
  updateBundleStatus
} from '../controllers/bundleController.js';
import { protect, instructor, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getBundles);
router.get('/instructor/mybundles', protect, instructor, getMyBundles);
router.get('/admin/pending', protect, admin, getPendingBundles);
router.get('/admin/history', protect, admin, getBundleHistory);
router.put('/:id/status', protect, admin, updateBundleStatus);

router.get('/:id', getBundleById);
router.post('/', protect, instructor, createBundle);
router.put('/:id', protect, instructor, updateBundle);
router.delete('/:id', protect, instructor, deleteBundle);
router.post('/:id/purchase', protect, initiateBundlePurchase);
router.post('/verify', protect, verifyBundlePurchase);

export default router;
