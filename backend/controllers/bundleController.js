import Bundle from '../models/bundleModel.js';
import Enrollment from '../models/enrollmentModel.js';
import Payment from '../models/paymentModel.js';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';
import crypto from 'crypto';

// @desc    Create a course bundle
// @route   POST /api/bundles
// @access  Private/Instructor/Admin
const createBundle = async (req, res) => {
  try {
    const { title, description, courses, price, image } = req.body;
    
    if (!courses || courses.length < 2) {
      return res.status(400).json({ message: 'A bundle must contain at least 2 courses' });
    }

    const bundle = await Bundle.create({
      title,
      description,
      courses,
      price,
      image,
      instructor: req.user._id,
    });

    res.status(201).json(bundle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all active and approved bundles
// @route   GET /api/bundles
// @access  Public
const getBundles = async (req, res) => {
  try {
    const bundles = await Bundle.find({ isActive: true, status: 'approved' }).populate('courses', 'title price image instructor category level').populate('instructor', 'name');
    res.json(bundles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get bundles for the logged in instructor
// @route   GET /api/bundles/instructor/mybundles
// @access  Private/Instructor
const getMyBundles = async (req, res) => {
  try {
    const bundles = await Bundle.find({ instructor: req.user._id }).populate('courses', 'title price image instructor');
    res.json(bundles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get enrolled bundles for the logged-in student
// @route   GET /api/bundles/my-enrolled
// @access  Private
const getMyEnrolledBundles = async (req, res) => {
  try {
    // Get all enrollments for this user
    const userEnrollments = await Enrollment.find({ user: req.user._id, status: { $ne: 'dropped' } }).select('course');
    const enrolledCourseIds = userEnrollments.map(e => e.course.toString());

    if (enrolledCourseIds.length === 0) {
      return res.json([]);
    }

    // Get all active + approved bundles
    const allBundles = await Bundle.find({ isActive: true, status: 'approved' })
      .populate('courses', 'title price image')
      .populate('instructor', 'name');

    // Filter bundles where the user is enrolled in ALL courses
    const enrolledBundles = allBundles.filter(bundle => {
      if (!bundle.courses || bundle.courses.length === 0) return false;
      return bundle.courses.every(course => enrolledCourseIds.includes(course._id.toString()));
    });

    res.json(enrolledBundles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending bundles for admin approval
// @route   GET /api/bundles/admin/pending
// @access  Private/Admin
const getPendingBundles = async (req, res) => {
  try {
    const bundles = await Bundle.find({ status: 'pending' })
      .populate('courses', 'title price image introVideoUrl videoSource modules')
      .populate('instructor', 'name email');
    res.json(bundles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get bundle history (approved/rejected) for admin
// @route   GET /api/bundles/admin/history
// @access  Private/Admin
const getBundleHistory = async (req, res) => {
  try {
    const bundles = await Bundle.find({ status: { $in: ['approved', 'rejected'] } }).populate('courses', 'title price').populate('instructor', 'name email').sort({ updatedAt: -1 });
    res.json(bundles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update bundle status (approve/reject)
// @route   PUT /api/bundles/:id/status
// @access  Private/Admin
const updateBundleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const bundle = await Bundle.findById(req.params.id);
    if (!bundle) return res.status(404).json({ message: 'Bundle not found' });

    bundle.status = status;
    const updatedBundle = await bundle.save();

    res.json(updatedBundle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single bundle
// @route   GET /api/bundles/:id
// @access  Public
const getBundleById = async (req, res) => {
  try {
    const bundle = await Bundle.findById(req.params.id).populate('courses').populate('instructor', 'name');
    if (!bundle) return res.status(404).json({ message: 'Bundle not found' });
    res.json(bundle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Initiate Bundle Purchase
// @route   POST /api/bundles/:id/purchase
// @access  Private
const initiateBundlePurchase = async (req, res) => {
  const restrictedRoles = ['instructor', 'cashManager', 'admin', 'superAdmin'];
  if (restrictedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: `${req.user.role}s cannot purchase bundles.` });
  }
  try {
    const bundle = await Bundle.findById(req.params.id);
    if (!bundle) return res.status(404).json({ message: 'Bundle not found' });
    
    const { paymentMethod } = req.body;
    
    // Logic similar to paymentController but for multiple course enrollments
    // For now, let's use a similar redirect pattern
    
    let redirectUrl = null;
    let gatewaySessionId = `bundle_${Date.now()}`;

    // Here we would normally hit Stripe/PayPal
    // Simulate redirect for active gateways
    if (paymentMethod === 'stripe' || paymentMethod === 'paypal') {
        redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/bundle-success?session_id=${gatewaySessionId}&bundleId=${bundle._id}`;
    }

    res.json({ success: true, redirectUrl, gatewaySessionId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Verify Bundle Purchase & Enroll in all courses
// @route   POST /api/bundles/verify
// @access  Private
const verifyBundlePurchase = async (req, res) => {
  try {
    const { sessionId, bundleId } = req.body;
    
    const bundle = await Bundle.findById(bundleId);
    if (!bundle) return res.status(404).json({ message: 'Bundle not found' });

    // Check if user is already enrolled in all courses of this bundle
    const existingEnrollments = await Enrollment.find({
      user: req.user._id,
      course: { $in: bundle.courses }
    });

    if (existingEnrollments.length === bundle.courses.length) {
      return res.json({ message: 'Already enrolled in this bundle' });
    }

    // Find existing payment record from payment initiation
    let payment = await Payment.findOne({
      gatewaySessionId: sessionId,
      user: req.user._id,
      bundle: bundleId
    });

    // If not found by sessionId, try to find any pending payment for this bundle
    if (!payment) {
      payment = await Payment.findOne({
        user: req.user._id,
        bundle: bundleId,
        status: 'pending'
      });
    }

    // If still not found, try to find any payment for this bundle
    if (!payment) {
      payment = await Payment.findOne({
        user: req.user._id,
        bundle: bundleId
      });
    }

    if (!payment) {
      // Create a Payment record for the bundle if not exists
      payment = await Payment.create({
        user: req.user._id,
        bundle: bundleId,
        amount: bundle.price,
        paymentMethod: 'chapa',
        transactionId: sessionId || `BNDL-${Date.now()}`,
        phoneNumber: 'N/A',
        status: 'completed',
        gatewaySessionId: sessionId,
        verifiedAt: new Date()
      });
    } else if (payment.status === 'completed') {
      // Payment already completed, just enroll in missing courses
    } else {
      // Update existing payment to completed
      payment.status = 'completed';
      payment.verifiedAt = new Date();
      if (sessionId && !payment.gatewaySessionId) {
        payment.gatewaySessionId = sessionId;
      }
      await payment.save();
    }

    // Enroll user in EACH course in the bundle
    const enrollments = [];
    for (const courseId of bundle.courses) {
      // Check if already enrolled in this specific course
      const existing = await Enrollment.findOne({ user: req.user._id, course: courseId });
      if (!existing) {
        const enroll = await Enrollment.create({
          user: req.user._id,
          course: courseId,
          paymentId: payment._id,
          status: 'active'
        });
        enrollments.push(enroll);
      }
    }

    // Award commission to bundle instructor's referrer? 
    // Or just simple commission logic
    const buyerArr = await User.findById(req.user._id);
    if (buyerArr && buyerArr.referredBy) {
        const referrer = await User.findById(buyerArr.referredBy);
        if (referrer) {
            referrer.commissionBalance = (referrer.commissionBalance || 0) + (bundle.price * 0.10);
            await referrer.save();
        }
    }

    res.json({
      success: true,
      message: `Successfully purchased "${bundle.title}"! Enrolled in ${enrollments.length} new courses.`,
      bundleTitle: bundle.title
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update a bundle
// @route   PUT /api/bundles/:id
// @access  Private/Instructor
const updateBundle = async (req, res) => {
  try {
    const bundle = await Bundle.findById(req.params.id);

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Check if user is the bundle owner
    if (bundle.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this bundle' });
    }

    const { title, description, courses, price, image, isActive } = req.body;

    // Validate courses if provided
    if (courses && courses.length < 2) {
      return res.status(400).json({ message: 'A bundle must contain at least 2 courses' });
    }

    // Update fields
    if (title !== undefined) bundle.title = title;
    if (description !== undefined) bundle.description = description;
    if (courses !== undefined) bundle.courses = courses;
    if (price !== undefined) bundle.price = price;
    if (image !== undefined) bundle.image = image;
    if (isActive !== undefined) bundle.isActive = isActive;

    // Require approval when bundle is edited (unless admin is editing)
    if (req.user.role !== 'admin') {
      bundle.status = 'pending';
    }

    const updatedBundle = await bundle.save();
    
    // Populate for response
    await updatedBundle.populate('courses', 'title price image instructor');
    await updatedBundle.populate('instructor', 'name');

    res.json(updatedBundle);
  } catch (error) {
    console.error('Error updating bundle:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a bundle
// @route   DELETE /api/bundles/:id
// @access  Private/Instructor
const deleteBundle = async (req, res) => {
  try {
    const bundle = await Bundle.findById(req.params.id);

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Check if user is the bundle owner
    if (bundle.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this bundle' });
    }

    await bundle.deleteOne();
    
    res.json({ message: 'Bundle removed successfully' });
  } catch (error) {
    console.error('Error deleting bundle:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a module to a bundle
// @route   POST /api/bundles/:id/modules
// @access  Private/Instructor
const addBundleModule = async (req, res) => {
  try {
    const { title, videoUrl, thumbnail, content, dripDelayDays, isReleased } = req.body;
    const bundle = await Bundle.findById(req.params.id);

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    if (bundle.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this bundle' });
    }

    const moduleType = (videoUrl && videoUrl.trim()) ? 'video' : 'document';

    const newModule = { 
      title, 
      videoUrl: videoUrl || '',
      thumbnail: thumbnail || '',
      content,
      dripDelayDays: Number(dripDelayDays) || 0,
      isReleased: false,  // hidden until admin approves
      status: 'pending',
      videoSource: 'youtube',
      type: moduleType,
    };
    
    if (!bundle.modules) bundle.modules = [];
    bundle.modules.push(newModule);
    await bundle.save();

    // Notify admins and superAdmins for module approval
    const savedModule = bundle.modules[bundle.modules.length - 1];
    const approvers = await User.find({ role: { $in: ['admin', 'superAdmin'] } }).select('_id');
    if (approvers.length > 0) {
      await Notification.insertMany(approvers.map(a => ({
        recipient: a._id,
        sender: req.user._id,
        type: 'module_approval_requested',
        title: 'Bundle Module Approval Needed',
        message: `Instructor ${req.user.name} added a new module "${title}" to bundle "${bundle.title}". Video: ${videoUrl || 'N/A'}. Content: ${content || 'N/A'}. Please review.`,
        relatedId: bundle._id
      })));
    }
    
    res.status(201).json(bundle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bundles with pending modules (for admin review)
// @route   GET /api/bundles/admin/pending-modules
// @access  Private/Admin
const getPendingBundleModules = async (req, res) => {
  try {
    const bundles = await Bundle.find({ 'modules.status': 'pending' })
      .populate('instructor', 'name email')
      .select('title instructor modules');
    
    let pendingModules = [];
    bundles.forEach(b => {
      b.modules.filter(m => m.status === 'pending').forEach(mod => {
        pendingModules.push({
          _id: mod._id,
          bundleId: b._id,
          bundleTitle: b.title,
          instructor: b.instructor?.name,
          title: mod.title,
          type: mod.type,
          videoUrl: mod.videoUrl,
          videoSource: mod.videoSource,
          content: mod.content
        });
      });
    });
    
    res.json(pendingModules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve or reject a bundle module
// @route   PUT /api/bundles/:id/modules/:moduleId/status
// @access  Private/Admin/SuperAdmin
const updateBundleModuleStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const bundle = await Bundle.findById(req.params.id);
    if (!bundle) return res.status(404).json({ message: 'Bundle not found' });

    const mod = bundle.modules.id(req.params.moduleId);
    if (!mod) return res.status(404).json({ message: 'Module not found' });

    mod.status = status;
    mod.isReleased = status === 'approved';
    mod.rejectionReason = status === 'rejected' ? (rejectionReason || 'No reason provided') : '';
    await bundle.save();

    // Notify the instructor
    await Notification.create({
      recipient: bundle.instructor,
      sender: req.user._id,
      type: status === 'approved' ? 'module_approved' : 'module_rejected',
      title: status === 'approved' ? '✅ Module Approved' : '❌ Module Rejected',
      message: status === 'approved'
        ? `Your module "${mod.title}" in bundle "${bundle.title}" has been approved and is now live.`
        : `Your module "${mod.title}" in bundle "${bundle.title}" was rejected. Reason: ${mod.rejectionReason}`,
      relatedId: bundle._id
    });

    res.json(bundle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { 
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
};
