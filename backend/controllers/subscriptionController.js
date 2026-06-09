import Subscription from '../models/subscriptionModel.js';
import User from '../models/userModel.js';
import crypto from 'crypto';

const PRICES = {
  monthly: 500, // ETB
  yearly: 5000, // ETB
};

// @desc    Initiate Subscription Payment
// @route   POST /api/subscriptions/initiate
// @access  Private
const initiateSubscription = async (req, res) => {
  try {
    const { planType, paymentMethod } = req.body;
    
    if (!['monthly', 'yearly'].includes(planType)) {
      return res.status(400).json({ message: 'Invalid plan type' });
    }

    const amount = PRICES[planType];
    let gatewaySessionId = null;
    let redirectUrl = null;

    if (paymentMethod === 'stripe') {
      try {
        const stripeParams = new URLSearchParams();
        stripeParams.append('success_url', `${process.env.CLIENT_URL || 'http://localhost:5173'}/subscription-success?session_id={CHECKOUT_SESSION_ID}&plan=${planType}`);
        stripeParams.append('cancel_url', `${process.env.CLIENT_URL || 'http://localhost:5173'}/courses`);
        stripeParams.append('payment_method_types[0]', 'card');
        stripeParams.append('line_items[0][price_data][currency]', 'usd');
        stripeParams.append('line_items[0][price_data][product_data][name]', `Platform Subscription (${planType})`);
        stripeParams.append('line_items[0][price_data][unit_amount]', Math.round(amount * 100)); // Cents
        stripeParams.append('line_items[0][quantity]', 1);
        stripeParams.append('mode', 'payment');

        const authString = Buffer.from(`${process.env.STRIPE_SECRET_KEY || 'sk_test_dummy'}:`).toString('base64');
        const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: stripeParams
        });
        
        if (stripeRes.ok) {
          const session = await stripeRes.json();
          gatewaySessionId = session.id;
          redirectUrl = session.url;
        } else {
          gatewaySessionId = `sub_test_${Date.now()}`;
          redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/subscription-success?session_id=${gatewaySessionId}&plan=${planType}`;
        }
      } catch (err) {
        gatewaySessionId = `sub_test_${Date.now()}`;
        redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/subscription-success?session_id=${gatewaySessionId}&plan=${planType}`;
      }
    } else {
      // Mock for PayPal or local
      gatewaySessionId = `sub_test_${Date.now()}`;
      redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/subscription-success?session_id=${gatewaySessionId}&plan=${planType}`;
    }

    res.status(200).json({
      success: true,
      redirectUrl
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify Subscription
// @route   POST /api/subscriptions/verify
// @access  Private
const verifySubscription = async (req, res) => {
  try {
    const { sessionId, planType } = req.body;
    
    if (!sessionId || !planType) return res.status(400).json({ message: 'Missing parameters' });

    // Check if subscription already exists for this session
    const existing = await Subscription.findOne({ paymentId: sessionId });
    if (existing) {
      return res.status(400).json({ message: 'Subscription already activated for this session.' });
    }

    const durationDays = planType === 'yearly' ? 365 : 30;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    const sub = await Subscription.create({
      user: req.user._id,
      planType,
      endDate,
      paymentId: sessionId,
      status: 'active'
    });

    // Award commission to referrer if applicable
    const buyer = await User.findById(req.user._id);
    if (buyer && buyer.referredBy) {
      const referrer = await User.findById(buyer.referredBy);
      if (referrer) {
        referrer.commissionBalance = (referrer.commissionBalance || 0) + (PRICES[planType] * 0.10);
        await referrer.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Subscription activated!',
      subscription: sub
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error verifying subscription' });
  }
};

// @desc    Get Current Subscription
// @route   GET /api/subscriptions/my
// @access  Private
const getMySubscription = async (req, res) => {
  try {
    const activeSub = await Subscription.findOne({
      user: req.user._id,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    res.status(200).json(activeSub);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export { initiateSubscription, verifySubscription, getMySubscription };
