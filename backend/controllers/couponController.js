import Coupon from '../models/couponModel.js';
import Course from '../models/courseModel.js';

// @desc    Create new coupon
// @route   POST /api/lms/coupons
// @access  Private/Instructor
const createCoupon = async (req, res) => {
  const { code, discountType, discountAmount, courseId, expiryDate, usageLimit } = req.body;

  try {
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountAmount,
      course: courseId,
      instructor: req.user._id,
      expiryDate,
      usageLimit
    });

    res.status(201).json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Validate coupon
// @route   POST /api/lms/coupons/validate
// @access  Private
const validateCoupon = async (req, res) => {
  const { code, courseId } = req.body;

  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or inactive coupon' });
    }

    if (coupon.course && coupon.course.toString() !== courseId) {
      return res.status(400).json({ message: 'Coupon not valid for this course' });
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }

    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get instructor coupons
// @route   GET /api/lms/coupons/mycoupons
// @access  Private/Instructor
const getMyCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ instructor: req.user._id }).populate('course', 'title');
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export {
  createCoupon,
  validateCoupon,
  getMyCoupons
};
