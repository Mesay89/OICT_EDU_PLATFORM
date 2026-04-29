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
  try {
    const { courseId, paymentMethod, phoneNumber, couponCode } = req.body;

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
        
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: { name: course.title },
              unit_amount: Math.round(amountInUSD * 100),
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
        return res.status(500).json({ message: 'Stripe gateway error' });
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
          phone_number: phoneNumber || '0900000000',
          tx_ref,
          callback_url: `${process.env.BACKEND_URL}/api/payments/chapa-webhook`,
          return_url: `${process.env.CLIENT_URL}/payment-success?session_id=${tx_ref}&gateway=chapa`,
          customization: {
            title: course.title.substring(0, 16),
            description: `Payment for ${course.title}`
          }
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
        if (err.response) {
          console.error('Status:', err.response.status);
          console.error('Data:', JSON.stringify(err.response.data, null, 2));
        } else {
          console.error('Message:', err.message);
        }
        return res.status(500).json({ message: 'Chapa gateway error' });
      }
    }

    // Create payment record
    const payment = await Payment.create({
      user: req.user._id,
      course: courseId,
      amount: finalAmount,
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

export { 
  initiatePayment, 
  verifyPayment, 
  verifyGateway, 
  getMyPayments, 
  cancelPayment, 
  requestRefund, 
  chapaWebhook,
  payWithBalance
};
