import Bundle from '../models/bundleModel.js';
import Enrollment from '../models/enrollmentModel.js';
import Payment from '../models/paymentModel.js';
import User from '../models/userModel.js';
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

// @desc    Get all bundles
// @route   GET /api/bundles
// @access  Public
const getBundles = async (req, res) => {
  try {
    const bundles = await Bundle.find({ isActive: true }).populate('courses', 'title price image instructor').populate('instructor', 'name');
    res.json(bundles);
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

    // Check if user already enrolled in this bundle via this session
    // (In production, verify with payment gateway)

    // Create a Payment record for the bundle
    const payment = await Payment.create({
      user: req.user._id,
      amount: bundle.price,
      paymentMethod: 'bundle_purchase',
      transactionId: `BNDL-${Date.now()}`,
      status: 'completed',
      gatewaySessionId: sessionId,
      verifiedAt: new Date()
    });

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

export { createBundle, getBundles, getBundleById, initiateBundlePurchase, verifyBundlePurchase };
