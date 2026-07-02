import Payment from '../models/paymentModel.js';
import Enrollment from '../models/enrollmentModel.js';
import Course from '../models/courseModel.js';
import Coupon from '../models/couponModel.js';
import User from '../models/userModel.js';
import crypto from 'crypto';
import Stripe from 'stripe';
import axios from 'axios';
import { sendSMS } from '../utils/sendSMS.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// @desc    Initiate payment
// @route   POST /api/payments/initiate
// @access  Private
const initiatePayment = async (req, res) => {
  const restrictedRoles = ['instructor', 'cashManager', 'admin', 'superAdmin'];
  if (restrictedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: `${req.user.role}s cannot purchase courses.` });
  }
  try {
    const { courseId, paymentMethod, phoneNumber, couponCode } = req.body;

    // Check platform settings for payment gateway
    const Settings = (await import('../models/settingsModel.js')).default;
    const settings = await Settings.findOne();

    // Validate payment method against settings (now supports multiple gateways)
    const allowedGateways = settings?.paymentGateways || ['chapa'];
    if (!allowedGateways.includes(paymentMethod)) {
      return res.status(400).json({ 
        message: `Payment method "${paymentMethod}" is not currently supported. Available methods: ${allowedGateways.join(', ')}` 
      });
    }

    // Validate input
    if (!courseId || !paymentMethod || !phoneNumber) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'You are already enrolled in this course' });
    }

    let finalAmount = course.price;
    let validCoupon = null;

    if (couponCode) {
      validCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!validCoupon) {
        return res.status(400).json({ message: 'Invalid or inactive coupon code' });
      }
      if (validCoupon.course && validCoupon.course.toString() !== courseId) {
        return res.status(400).json({ message: 'Coupon not valid for this course' });
      }
      if (validCoupon.expiryDate && new Date(validCoupon.expiryDate) < new Date()) {
        return res.status(400).json({ message: 'Coupon has expired' });
      }
      if (validCoupon.usedCount >= validCoupon.usageLimit) {
        return res.status(400).json({ message: 'Coupon usage limit reached' });
      }

      // Calculate discount
      if (validCoupon.discountType === 'percentage') {
        finalAmount = course.price - (course.price * (validCoupon.discountAmount / 100));
      } else {
        finalAmount = Math.max(0, course.price - validCoupon.discountAmount);
      }
      
      // Increment coupon usage
      validCoupon.usedCount += 1;
      await validCoupon.save();
    }

    // SPECIAL CASE: 100% FREE (0 ETB) - SKIP PENDING FLOW
    if (finalAmount <= 0) {
      const transactionId = `FREE-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      const payment = await Payment.create({
        user: req.user._id,
        course: courseId,
        amount: 0,
        currency: course.currency || 'ETB',
        paymentMethod: 'free',
        transactionId,
        phoneNumber: 'N/A',
        status: 'completed',
        verifiedAt: new Date()
      });

      await Enrollment.create({
        user: req.user._id,
        course: courseId,
        paymentId: payment._id
      });

      return res.status(201).json({
        success: true,
        isFree: true,
        message: 'Course activated successfully! Directing to your dashboard...',
      });
    }

    // Check if there's a pending payment
    const pendingPayment = await Payment.findOne({
      user: req.user._id,
      course: courseId,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    if (pendingPayment && !['stripe', 'paypal'].includes(paymentMethod)) {
      return res.json({
        success: true,
        payment: pendingPayment,
        message: 'You already have a pending payment for this course',
      });
    }

    // Generate transaction ID and verification code
    const transactionId = `TXN${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    let gatewaySessionId = null;
    let redirectUrl = null;

    if (paymentMethod === 'stripe') {
      try {
        // Convert ETB to USD for Stripe
        const rate = Number(process.env.ETB_USD_RATE) || 150;
        const amountInUSD = finalAmount / rate;
        
        let stripeUnitAmount = Math.round(amountInUSD * 100);
        // Stripe strictly requires a minimum of 50 cents ($0.50 USD)
        if (stripeUnitAmount < 50) {
          stripeUnitAmount = 50;
        }
        
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: { name: course.title },
              unit_amount: stripeUnitAmount,
            },
            quantity: 1,
          }],
          mode: 'payment',
          success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
          metadata: { courseId: courseId.toString(), userId: req.user._id.toString() }
        });

        gatewaySessionId = session.id;
        redirectUrl = session.url;
      } catch (err) {
        console.error('❌ STRIPE ERROR:', err.message);
        if (err.raw) {
          console.error('Type:', err.raw.type);
          console.error('Code:', err.raw.code);
        }
        return res.status(500).json({ message: `Stripe error: ${err.message}` });
      }
    } else if (paymentMethod === 'paypal') {
      try {
        // Real PayPal REST API Implementation
        const rate = Number(process.env.ETB_USD_RATE) || 150;
        const amountInUSD = (finalAmount / rate).toFixed(2);

        // Get Access Token
        if (!process.env.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID.includes('placeholder')) {
          console.warn('⚠️ PayPal credentials missing or using placeholders in .env');
          return res.status(400).json({ message: 'PayPal credentials not configured on server' });
        }

        const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
        const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
          method: 'POST',
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'grant_type=client_credentials'
        });

        if (!tokenRes.ok) {
          const errorData = await tokenRes.json();
          console.error('❌ PAYPAL AUTH ERROR:', JSON.stringify(errorData, null, 2));
          throw new Error('PayPal authentication failed');
        }

        const { access_token } = await tokenRes.json();

        // Create Order
        const orderRes = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [{
              amount: { currency_code: 'USD', value: amountInUSD },
              description: course.title
            }],
            application_context: {
              return_url: `${process.env.CLIENT_URL}/payment-success`,
              cancel_url: `${process.env.CLIENT_URL}/payment-cancel`
            }
          })
        });
        const order = await orderRes.json();
        
        if (!orderRes.ok) {
          console.error('❌ PAYPAL ORDER ERROR:', JSON.stringify(order, null, 2));
          throw new Error('PayPal order creation failed');
        }
        
        gatewaySessionId = order.id;
        redirectUrl = order.links.find(l => l.rel === 'approve').href;
      } catch (err) {
        console.error('❌ PAYPAL GATEWAY ERROR:', err.message);
        return res.status(500).json({ message: 'PayPal gateway error' });
      }
    } else if (paymentMethod === 'chapa') {
      try {
        const tx_ref = `CHAPA-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        
        // Ensure we have a valid email - Chapa rejects some formats
        const userEmail = req.user.email && req.user.email.includes('@') && !req.user.email.endsWith('@example.com') 
          ? req.user.email 
          : `user${req.user._id}@eduplatform.com`;

        // Sanitize name for Chapa (strictly require First and Last)
        const nameParts = req.user.name ? req.user.name.trim().split(/\s+/) : ['Student'];
        const firstName = nameParts[0] || 'Student';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

        const chapaPayload = {
          amount: Number(finalAmount).toFixed(2), // Strict 2 decimal places
          currency: 'ETB',
          email: userEmail,
          first_name: firstName,
          last_name: lastName,
          tx_ref,
          callback_url: `${process.env.BACKEND_URL}/api/payments/chapa-webhook`,
          return_url: `${process.env.CLIENT_URL}/payment-success?session_id=${tx_ref}&gateway=chapa`
        };

        console.log('Sending to Chapa:', JSON.stringify(chapaPayload, null, 2));

        const response = await axios.post(
          'https://api.chapa.co/v1/transaction/initialize',
          chapaPayload,
          {
            headers: {
              Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.status === 'success') {
          gatewaySessionId = tx_ref; // Use tx_ref as our session ID for Chapa
          redirectUrl = response.data.data.checkout_url;
        } else {
          throw new Error('Chapa initialization failed');
        }
      } catch (err) {
        console.error('❌ Chapa Initialization Error:');
        const errorData = err.response?.data;
        const errorMessage = errorData?.message || err.message;
        const errorMsgStr = typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage;
        
        if (err.response) {
          console.error('Status:', err.response.status);
          console.error('Data:', JSON.stringify(err.response.data, null, 2));
        } else {
          console.error('Message:', err.message);
        }
        return res.status(500).json({ message: `Chapa error: ${errorMsgStr}` });
      }
    }

    // Create payment record
    const payment = await Payment.create({
      user: req.user._id,
      course: courseId,
      amount: finalAmount,
      currency: course.currency || 'ETB',
      paymentMethod,
      transactionId,
      phoneNumber,
      verificationCode,
      gatewaySessionId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    });
    
    // --- SEND VERIFICATION CODE BY SMS ---
    if (['cbe', 'telebirr'].includes(paymentMethod)) {
      const message = `Hello ${req.user.name}, your course payment verification code is: ${verificationCode}. Please enter this on the website to confirm your transfer.`;
      await sendSMS(phoneNumber, message);
    }

    res.status(201).json({
      success: true,
      payment: {
        _id: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        phoneNumber: payment.phoneNumber,
        status: payment.status,
        expiresAt: payment.expiresAt,
        redirectUrl: redirectUrl,
        verificationCode: payment.verificationCode,
      },
      message: redirectUrl 
        ? 'Redirecting to payment gateway...' 
        : `Payment initiated. Please complete the payment using ${getPaymentMethodName(paymentMethod)} and enter the verification code.`,
    });
  } catch (error) {
    console.error('❌ PAYMENT INITIATION FAILED:');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    if (error.stack) console.error('Stack Trace:', error.stack.substring(0, 500));
    
    // Check for Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: `Validation Error: ${messages.join(', ')}` });
    }

    res.status(500).json({ 
      message: 'Failed to initiate payment',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { paymentId, verificationCode } = req.body;

    if (!paymentId || !verificationCode) {
      return res.status(400).json({ message: 'Please provide payment ID and verification code' });
    }

    const payment = await Payment.findById(paymentId).populate('course', 'title');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if payment belongs to user
    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if payment is already completed
    if (payment.status === 'completed') {
      return res.status(400).json({ message: 'Payment already completed' });
    }

    // Check if payment has expired
    if (new Date() > payment.expiresAt) {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({ message: 'Payment has expired. Please initiate a new payment.' });
    }

    // Verify code
    if (payment.verificationCode.toString().trim() !== verificationCode.toString().trim()) {
      return res.status(400).json({ message: 'Invalid verification code. Please check the code on your screen.' });
    }

    // Update payment status
    const isManual = ['cbe', 'telebirr'].includes(payment.paymentMethod);
    
    if (isManual) {
      payment.status = 'pending_approval';
      payment.verifiedAt = new Date();
      await payment.save();

      return res.json({
        success: true,
        message: 'Payment verification code accepted! Please wait for Admin approval to continue learning. We will notify you once approved.',
        status: 'pending_approval'
      });
    }

    // Standard auto-enrollment for other methods
    payment.status = 'completed';
    payment.verifiedAt = new Date();
    await payment.save();

    // Affiliate Commission (10%)
    const buyer = await User.findById(req.user._id);
    if (buyer && buyer.referredBy) {
      const referrer = await User.findById(buyer.referredBy);
      if (referrer) {
        referrer.commissionBalance = (referrer.commissionBalance || 0) + (payment.amount * 0.10);
        await referrer.save();
      }
    }

    // Instructor Commission - Add instructor's share to their balance
    const course = await Course.findById(payment.course._id || payment.course);
    if (course && course.instructor) {
      const instructor = await User.findById(course.instructor);
      if (instructor) {
        // Get platform commission rate from settings (stored as percentage like 50 for 50%)
        const Settings = (await import('../models/settingsModel.js')).default;
        const settings = await Settings.findOne();
        const platformCommissionRate = (settings?.platformCommissionPercentage || 10) / 100; // Convert percentage to decimal (e.g., 50 -> 0.50)
        const instructorShare = payment.amount * (1 - platformCommissionRate);
        
        instructor.commissionBalance = (instructor.commissionBalance || 0) + instructorShare;
        await instructor.save();
      }
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      user: req.user._id,
      course: payment.course._id,
      paymentId: payment._id,
    });

    res.json({
      success: true,
      message: 'Payment verified successfully! You are now enrolled in the course.',
      enrollment,
      courseTitle: payment.course.title,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      message: 'Server error during verification', 
      error: error.message 
    });
  }
};

// @desc    Get user payments
// @route   GET /api/payments/my-payments
// @access  Private
const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('course', 'title image')
      .sort('-createdAt');

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
};

// @desc    Cancel payment
// @route   PUT /api/payments/:id/cancel
// @access  Private
const cancelPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending payments' });
    }

    payment.status = 'cancelled';
    await payment.save();

    res.json({ success: true, message: 'Payment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling payment:', error);
    res.status(500).json({ message: 'Failed to cancel payment' });
  }
};

// @desc    Verify Stripe/PayPal return loop
// @route   POST /api/payments/verify-gateway
// @access  Private
const verifyGateway = async (req, res) => {
  try {
    const { sessionId, gateway } = req.body;
    
    if (!sessionId) return res.status(400).json({ message: 'Session ID missing' });

    const payment = await Payment.findOne({ gatewaySessionId: sessionId }).populate('course', 'title');
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });
    
    // Check if payment belongs to user 
    if (payment.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
    
    if (payment.status === 'completed') {
      return res.status(200).json({ 
        success: true, 
        message: 'Payment already completed', 
        alreadyEnrolled: true,
        payment: {
          transactionId: payment.transactionId,
          amount: payment.amount,
          method: payment.paymentMethod,
          date: payment.verifiedAt,
          phone: payment.phoneNumber,
          courseTitle: payment.course?.title
        }
      });
    }

    // --- Chapa Verification Fallback ---
    if (gateway === 'chapa') {
      try {
        const response = await axios.get(
          `https://api.chapa.co/v1/transaction/verify/${sessionId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`
            }
          }
        );

        if (response.data.status !== 'success' || response.data.data.status !== 'success') {
          return res.status(400).json({ message: 'Payment not successful on Chapa yet' });
        }
        // If successful, proceed to mark as completed below
      } catch (err) {
        console.error('Chapa Verify API Error:', err.response?.data || err.message);
        return res.status(400).json({ message: 'Could not verify payment with Chapa' });
      }
    }
    // --- End Chapa Fallback ---
    
    payment.status = 'completed';
    payment.verifiedAt = new Date();
    await payment.save();

    // Affiliate Commission (10%)
    const buyer = await User.findById(req.user._id);
    if (buyer && buyer.referredBy) {
      const referrer = await User.findById(buyer.referredBy);
      if (referrer) {
        referrer.commissionBalance = (referrer.commissionBalance || 0) + (payment.amount * 0.10);
        await referrer.save();
      }
    }

    // Instructor Commission - Add instructor's share to their balance
    const course = await Course.findById(payment.course._id || payment.course);
    if (course && course.instructor) {
      const instructor = await User.findById(course.instructor);
      if (instructor) {
        // Get platform commission rate from settings (stored as percentage like 50 for 50%)
        const Settings = (await import('../models/settingsModel.js')).default;
        const settings = await Settings.findOne();
        const platformCommissionRate = (settings?.platformCommissionPercentage || 10) / 100; // Convert percentage to decimal (e.g., 50 -> 0.50)
        const instructorShare = payment.amount * (1 - platformCommissionRate);
        
        instructor.commissionBalance = (instructor.commissionBalance || 0) + instructorShare;
        await instructor.save();
      }
    }

    const enrollment = await Enrollment.create({
      user: req.user._id,
      course: payment.course._id,
      paymentId: payment._id,
    });

    res.json({
      success: true,
      message: 'Payment verified successfully! You are now enrolled.',
      enrollment,
      courseTitle: payment.course.title,
      payment: {
        transactionId: payment.transactionId,
        amount: payment.amount,
        method: payment.paymentMethod,
        date: payment.verifiedAt,
        phone: payment.phoneNumber,
        courseTitle: payment.course?.title
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server verify error' });
  }
};

// Helper function
const getPaymentMethodName = (method) => {
  const names = {
    'cbe': 'Commercial Bank of Ethiopia',
    'telebirr': 'TeleBirr',
    'mpesa': 'M-Pesa',
    'awash': 'Awash Bank',
    'cbe-birr': 'CBE Birr',
    'stripe': 'Credit Card (Stripe)',
    'paypal': 'PayPal',
  };
  return names[method] || method;
};

// @desc    Request a refund
// @route   POST /api/payments/:id/refund-request
// @access  Private
const requestRefund = async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    
    // Check ownership
    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed payments can be refunded' });
    }

    // Check 14-day limit
    const daysSincePurchase = (Date.now() - new Date(payment.verifiedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePurchase > 14) {
      return res.status(400).json({ message: 'Refund window (14 days) has expired' });
    }

    payment.refundStatus = 'requested';
    payment.refundReason = reason;
    await payment.save();

    res.json({ success: true, message: 'Refund request submitted for review' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Chapa Webhook handler
// @route   POST /api/payments/chapa-webhook
// @access  Public
const chapaWebhook = async (req, res) => {
  try {
    const hash = crypto
      .createHmac('sha256', process.env.CHAPA_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    // In many Chapa implementations, they send the signature in x-chapa-signature header
    // If testing manually, you may want to bypass this check temporarily
    // if (hash !== req.headers['x-chapa-signature']) {
    //   return res.status(400).send('Invalid signature');
    // }

    const { tx_ref, status } = req.body;

    if (status === 'success') {
      const payment = await Payment.findOne({ gatewaySessionId: tx_ref }).populate('course', 'title');
      
      if (payment && payment.status !== 'completed') {
        payment.status = 'completed';
        payment.verifiedAt = new Date();
        await payment.save();

        // Handle Enrollment
        const existingEnrollment = await Enrollment.findOne({ user: payment.user, course: payment.course._id });
        if (!existingEnrollment) {
          await Enrollment.create({
            user: payment.user,
            course: payment.course._id,
            paymentId: payment._id,
          });
        }

        // Affiliate Commission
        const buyer = await User.findById(payment.user);
        if (buyer && buyer.referredBy) {
          const referrer = await User.findById(buyer.referredBy);
          if (referrer) {
            referrer.commissionBalance = (referrer.commissionBalance || 0) + (payment.amount * 0.10);
            await referrer.save();
          }
        }

        // Instructor Commission - Add instructor's share to their balance
        if (payment.course && payment.course.instructor) {
          const instructor = await User.findById(payment.course.instructor);
          if (instructor) {
            // Get platform commission rate from settings (stored as percentage like 50 for 50%)
            const Settings = (await import('../models/settingsModel.js')).default;
            const settings = await Settings.findOne();
            const platformCommissionRate = (settings?.platformCommissionPercentage || 10) / 100; // Convert percentage to decimal (e.g., 50 -> 0.50)
            const instructorShare = payment.amount * (1 - platformCommissionRate);
            
            instructor.commissionBalance = (instructor.commissionBalance || 0) + instructorShare;
            await instructor.save();
          }
        }
      }
    }

    res.status(200).send('Webhook received');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Webhook handler failed');
  }
};

// @desc    Pay using affiliate commission balance
// @route   POST /api/payments/pay-with-balance
// @access  Private
const payWithBalance = async (req, res) => {
  const restrictedRoles = ['instructor', 'cashManager', 'admin', 'superAdmin'];
  if (restrictedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: `${req.user.role}s cannot purchase courses.` });
  }
  
  try {
    const { courseId } = req.body;
    const user = await User.findById(req.user._id);
    const course = await Course.findById(courseId);

    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ user: user._id, course: courseId });
    if (existingEnrollment) return res.status(400).json({ message: 'Already enrolled' });

    if (user.commissionBalance < course.price) {
      return res.status(400).json({ message: 'Insufficient earnings balance' });
    }

    // Deduct balance
    user.commissionBalance -= course.price;
    await user.save();

    // Create payment record
    const transactionId = `BAL-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const payment = await Payment.create({
      user: user._id,
      course: courseId,
      amount: course.price,
      currency: course.currency || 'ETB',
      paymentMethod: 'balance',
      transactionId,
      status: 'completed',
      verifiedAt: new Date()
    });

    // Create enrollment
    await Enrollment.create({
      user: user._id,
      course: courseId,
      paymentId: payment._id,
    });

    res.json({ success: true, message: 'Purchased successfully with your earnings balance!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Initiate bundle payment
// @route   POST /api/payments/initiate-bundle
// @access  Private
const initiateBundlePayment = async (req, res) => {
  const restrictedRoles = ['instructor', 'cashManager', 'admin', 'superAdmin'];
  if (restrictedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: `${req.user.role}s cannot purchase bundles.` });
  }
  try {
    const { bundleId, paymentMethod, phoneNumber, couponCode } = req.body;
    const Bundle = (await import('../models/bundleModel.js')).default;

    // Check platform settings for payment gateway
    const Settings = (await import('../models/settingsModel.js')).default;
    const settings = await Settings.findOne();

    // Validate payment method against settings (skip for free/coupon path)
    const allowedGateways = settings?.paymentGateways || ['chapa'];
    if (paymentMethod !== 'free' && !allowedGateways.includes(paymentMethod)) {
      return res.status(400).json({ 
        message: `Payment method "${paymentMethod}" is not currently supported. Available methods: ${allowedGateways.join(', ')}` 
      });
    }

    // Validate input
    if (!bundleId || !paymentMethod) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    if (paymentMethod !== 'free' && !phoneNumber) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if bundle exists
    const bundle = await Bundle.findById(bundleId).populate('courses');
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Check if already enrolled in any course in the bundle
    for (const courseId of bundle.courses) {
      const existingEnrollment = await Enrollment.findOne({
        user: req.user._id,
        course: courseId._id,
      });
      if (existingEnrollment) {
        return res.status(400).json({ message: 'You are already enrolled in one or more courses in this bundle' });
      }
    }

    // Generate payment session based on payment method
    let paymentData = {};
    let gatewaySessionId = null;
    let redirectUrl = null;
    const transactionId = `TXN${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    let finalAmount = bundle.price;
    let validCoupon = null;

    if (couponCode) {
      const Coupon = (await import('../models/couponModel.js')).default;
      validCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!validCoupon) {
        return res.status(400).json({ message: 'Invalid or inactive coupon code' });
      }
      if (validCoupon.bundle && validCoupon.bundle.toString() !== bundleId) {
        return res.status(400).json({ message: 'Coupon not valid for this bundle' });
      }
      if (validCoupon.expiryDate && new Date(validCoupon.expiryDate) < new Date()) {
        return res.status(400).json({ message: 'Coupon has expired' });
      }
      if (validCoupon.usedCount >= validCoupon.usageLimit) {
        return res.status(400).json({ message: 'Coupon usage limit reached' });
      }

      // Calculate discount
      if (validCoupon.discountType === 'percentage') {
        finalAmount = bundle.price - (bundle.price * (validCoupon.discountAmount / 100));
      } else {
        finalAmount = Math.max(0, bundle.price - validCoupon.discountAmount);
      }
      
      // Increment coupon usage
      validCoupon.usedCount += 1;
      await validCoupon.save();
    }

    // SPECIAL CASE: 100% FREE (0 ETB) - SKIP PENDING FLOW
    if (finalAmount <= 0) {
      const transactionId = `FREE-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      const payment = await Payment.create({
        user: req.user._id,
        bundle: bundleId,
        amount: 0,
        currency: 'ETB',
        paymentMethod: 'free',
        transactionId,
        phoneNumber: 'N/A',
        status: 'completed',
        verifiedAt: new Date()
      });

      // Enroll user in all courses in the bundle
      const enrollments = [];
      for (const course of bundle.courses) {
        const enrollment = await Enrollment.create({
          user: req.user._id,
          course: course._id,
          enrolledAt: new Date(),
        });
        enrollments.push(enrollment);
      }

      return res.status(200).json({ 
        message: `Successfully purchased "${bundle.title}" for free! Enrolled in ${enrollments.length} courses.`,
        isFree: true 
      });
    }

    if (paymentMethod === 'chapa') {
      try {
        const tx_ref = `CHAPA-BUNDLE-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        
        // Ensure we have a valid email - Chapa rejects some formats
        const userEmail = req.user.email && req.user.email.includes('@') && !req.user.email.endsWith('@example.com') 
          ? req.user.email 
          : `user${req.user._id}@eduplatform.com`;

        // Sanitize name for Chapa (strictly require First and Last)
        const nameParts = req.user.name ? req.user.name.trim().split(/\s+/) : ['Student'];
        const firstName = nameParts[0] || 'Student';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

        const chapaPayload = {
          amount: Number(finalAmount).toFixed(2),
          currency: 'ETB',
          email: userEmail,
          first_name: firstName,
          last_name: lastName,
          tx_ref,
          callback_url: `${process.env.BACKEND_URL}/api/payments/chapa-webhook`,
          return_url: `${process.env.CLIENT_URL}/bundle-success?session_id=${tx_ref}&gateway=chapa&bundleId=${bundleId}`
        };

        const response = await axios.post(
          'https://api.chapa.co/v1/transaction/initialize',
          chapaPayload,
          {
            headers: {
              Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.status === 'success') {
          gatewaySessionId = tx_ref;
          redirectUrl = response.data.data.checkout_url;
          paymentData = {
            sessionId: tx_ref,
            redirectUrl: redirectUrl,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          };
        } else {
          throw new Error('Chapa initialization failed');
        }
      } catch (err) {
        console.error('Chapa Initialization Error:', err.message);
        return res.status(500).json({ message: `Chapa error: ${err.message}` });
      }
    } else if (paymentMethod === 'cbe') {
      gatewaySessionId = `CBE-${Date.now()}`;
      paymentData = {
        sessionId: gatewaySessionId,
        accountNumber: '1000123456789',
        accountName: 'Edu Platform',
        reference: `BUNDLE-${Date.now()}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      };
    } else if (paymentMethod === 'telebirr') {
      gatewaySessionId = `TELEBIRR-${Date.now()}`;
      paymentData = {
        sessionId: gatewaySessionId,
        accountNumber: '251911234567',
        accountName: 'Edu Platform',
        reference: `BUNDLE-${Date.now()}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      };
    } else if (paymentMethod === 'stripe') {
      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'etb',
            product_data: {
              name: bundle.title,
            },
            unit_amount: Math.round(finalAmount * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL}/bundle-success?session_id={CHECKOUT_SESSION_ID}&bundleId=${bundleId}`,
        cancel_url: `${process.env.CLIENT_URL}/bundles/${bundleId}`,
      });
      paymentData = {
        sessionId: stripeSession.id,
        redirectUrl: stripeSession.url,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      };
    } else if (paymentMethod === 'paypal') {
      paymentData = {
        sessionId: `PAYPAL-${Date.now()}`,
        redirectUrl: `https://paypal.com/checkout/bundle/${bundleId}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      };
    }

    // Create pending payment record
    const payment = await Payment.create({
      user: req.user._id,
      bundle: bundleId,
      amount: finalAmount,
      currency: 'ETB',
      paymentMethod,
      transactionId,
      phoneNumber,
      verificationCode,
      gatewaySessionId: gatewaySessionId || paymentData.sessionId,
      expiresAt: paymentData.expiresAt,
      // Store metadata for retrieval
      metadata: {
        bundleId: bundleId,
        originalSessionId: paymentData.sessionId
      }
    });

    // Send verification code by SMS for CBE and Telebirr
    if (['cbe', 'telebirr'].includes(paymentMethod)) {
      const message = `Hello ${req.user.name}, your bundle payment verification code is: ${verificationCode}. Please enter this on the website to confirm your transfer.`;
      await sendSMS(phoneNumber, message);
    }

    res.json({ 
      success: true, 
      payment: {
        _id: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        phoneNumber: payment.phoneNumber,
        verificationCode: payment.verificationCode,
        status: payment.status,
        expiresAt: payment.expiresAt,
        redirectUrl: redirectUrl,
        ...paymentData,
      }
    });
  } catch (error) {
    console.error('Bundle payment initiation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify bundle payment
// @route   POST /api/payments/verify-bundle
// @access  Private
const verifyBundlePayment = async (req, res) => {
  try {
    const { bundleId, verificationCode, transactionId, sessionId } = req.body;
    const Bundle = (await import('../models/bundleModel.js')).default;

    // Find the payment record
    const payment = await Payment.findOne({
      gatewaySessionId: sessionId,
      status: 'pending',
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment session not found or already processed' });
    }

    // Verify with Chapa if applicable
    if (payment.paymentMethod === 'chapa') {
      try {
        const response = await axios.get(
          `https://api.chapa.co/v1/transaction/verify/${transactionId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.status !== 'success' || response.data.data.status !== 'success') {
          return res.status(400).json({ message: 'Payment verification failed with Chapa' });
        }
      } catch (err) {
        console.error('Chapa verification error:', err.message);
        return res.status(400).json({ message: 'Failed to verify payment with Chapa' });
      }
    } else {
      // For CBE and Telebirr, verify the code matches
      if (payment.verificationCode !== verificationCode) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }
    }

    // Get bundle details
    const bundle = await Bundle.findById(bundleId).populate('courses');
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Update payment status
    payment.status = 'completed';
    payment.verifiedAt = new Date();
    payment.transactionId = transactionId;
    await payment.save();

    // Enroll user in all courses in the bundle
    const enrollments = [];
    for (const course of bundle.courses) {
      const existingEnrollment = await Enrollment.findOne({
        user: req.user._id,
        course: course._id,
      });
      if (!existingEnrollment) {
        const enrollment = await Enrollment.create({
          user: req.user._id,
          course: course._id,
          paymentId: payment._id,
          status: 'active',
        });
        enrollments.push(enrollment);
      }
    }

    // Award commission to referrer
    const buyer = await User.findById(req.user._id);
    if (buyer && buyer.referredBy) {
      const referrer = await User.findById(buyer.referredBy);
      if (referrer) {
        referrer.commissionBalance = (referrer.commissionBalance || 0) + (bundle.price * 0.10);
        await referrer.save();
      }
    }

    res.json({ 
      success: true, 
      message: `Successfully purchased "${bundle.title}"! Enrolled in ${enrollments.length} courses.` 
    });
  } catch (error) {
    console.error('Bundle payment verification error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Pay for bundle with balance
// @route   POST /api/payments/pay-bundle-with-balance
// @access  Private
const payBundleWithBalance = async (req, res) => {
  const restrictedRoles = ['instructor', 'cashManager', 'admin', 'superAdmin'];
  if (restrictedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: `${req.user.role}s cannot purchase bundles.` });
  }
  try {
    const { bundleId, couponCode } = req.body;
    const Bundle = (await import('../models/bundleModel.js')).default;

    const user = await User.findById(req.user._id);
    const bundle = await Bundle.findById(bundleId).populate('courses');

    if (!bundle) return res.status(404).json({ message: 'Bundle not found' });

    // Check if already enrolled in any course
    for (const course of bundle.courses) {
      const existingEnrollment = await Enrollment.findOne({
        user: req.user._id,
        course: course._id,
      });
      if (existingEnrollment) return res.status(400).json({ message: 'Already enrolled in one or more courses' });
    }

    let finalAmount = bundle.price;
    let validCoupon = null;

    if (couponCode) {
      const Coupon = (await import('../models/couponModel.js')).default;
      validCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!validCoupon) return res.status(400).json({ message: 'Invalid or inactive coupon code' });
      if (validCoupon.bundle && validCoupon.bundle.toString() !== bundleId) return res.status(400).json({ message: 'Coupon not valid for this bundle' });
      if (validCoupon.expiryDate && new Date(validCoupon.expiryDate) < new Date()) return res.status(400).json({ message: 'Coupon has expired' });
      if (validCoupon.usedCount >= validCoupon.usageLimit) return res.status(400).json({ message: 'Coupon usage limit reached' });

      // Calculate discount
      if (validCoupon.discountType === 'percentage') {
        finalAmount = bundle.price - (bundle.price * (validCoupon.discountAmount / 100));
      } else {
        finalAmount = Math.max(0, bundle.price - validCoupon.discountAmount);
      }

      // Increment coupon usage
      validCoupon.usedCount += 1;
      await validCoupon.save();
    }

    if (user.commissionBalance < finalAmount) {
      return res.status(400).json({ message: 'Insufficient earnings balance' });
    }

    // Deduct balance
    user.commissionBalance -= finalAmount;
    await user.save();

    // Create payment record
    const transactionId = `BAL-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const payment = await Payment.create({
      user: user._id,
      bundle: bundleId,
      amount: finalAmount,
      currency: 'ETB',
      paymentMethod: 'balance',
      transactionId,
      status: 'completed',
      verifiedAt: new Date()
    });

    // Enroll in all courses
    const enrollments = [];
    for (const course of bundle.courses) {
      const enrollment = await Enrollment.create({
        user: user._id,
        course: course._id,
        paymentId: payment._id,
      });
      enrollments.push(enrollment);
    }

    // Award commission to referrer
    if (user.referredBy) {
      const referrer = await User.findById(user.referredBy);
      if (referrer) {
        referrer.commissionBalance = (referrer.commissionBalance || 0) + (finalAmount * 0.10);
        await referrer.save();
      }
    }

    res.json({ success: true, message: `Purchased successfully! Enrolled in ${enrollments.length} courses.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { 
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
};
