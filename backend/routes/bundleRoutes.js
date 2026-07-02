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
  getMyEnrolledBundles,
  getPendingBundles,
  getBundleHistory,
  updateBundleStatus,
  addBundleModule,
  getPendingBundleModules,
  updateBundleModuleStatus
} from '../controllers/bundleController.js';
import { protect, instructor, admin, adminOrInstructor } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getBundles);
// NOTE: specific named routes must come BEFORE the /:id wildcard
router.get('/instructor/mybundles', protect, instructor, getMyBundles);
router.get('/my-enrolled', protect, getMyEnrolledBundles);
router.get('/admin/pending', protect, admin, getPendingBundles);
router.get('/admin/history', protect, admin, getBundleHistory);
router.get('/admin/pending-modules', protect, admin, getPendingBundleModules);
router.post('/verify', protect, verifyBundlePurchase);

router.get('/:id', getBundleById);
router.post('/', protect, instructor, createBundle);
router.put('/:id', protect, instructor, updateBundle);
router.delete('/:id', protect, instructor, deleteBundle);
router.post('/:id/purchase', protect, initiateBundlePurchase);
router.put('/:id/status', protect, admin, updateBundleStatus);

// Bundle modules
router.post('/:id/modules', protect, adminOrInstructor, addBundleModule);
router.put('/:id/modules/:moduleId/status', protect, admin, updateBundleModuleStatus);

export default router;
