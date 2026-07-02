import User from '../models/userModel.js';

import Withdrawal from '../models/withdrawalModel.js';

import Notification from '../models/notificationModel.js';

import jwt from 'jsonwebtoken';

import crypto from 'crypto';

import sendEmail from '../utils/sendEmail.js';



const generateToken = (id) => {

  return jwt.sign({ id }, process.env.JWT_SECRET, {

    expiresIn: '30d',

  });

};



const normalizeEmail = (email = '') => email.trim().toLowerCase();

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findUserByEmail = (email) => {

  const normalized = normalizeEmail(email);

  return User.findOne({

    email: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, 'i') },

  });

};



// @desc    Get all withdrawals (Admin)

// @route   GET /api/users/admin/withdrawals

// @access  Private/Admin

const getWithdrawals = async (req, res) => {

  const withdrawals = await Withdrawal.find({}).populate('user', 'name email').sort('-createdAt');

  res.json(withdrawals);

};



// @desc    Process a withdrawal (Admin)

// @route   PUT /api/users/admin/withdrawals/:id

// @access  Private/Admin

const processWithdrawal = async (req, res) => {

  const { status } = req.body;

  const withdrawal = await Withdrawal.findById(req.params.id);



  if (withdrawal) {

    withdrawal.status = status;

    withdrawal.processedAt = Date.now();

    await withdrawal.save();

    res.json({ message: `Withdrawal ${status}` });

  } else {

    res.status(404).json({ message: 'Withdrawal not found' });

  }

};



// @desc    Auth user & get token

// @route   POST /api/users/login



// @desc    Auth user & get token

// @route   POST /api/users/login

// @access  Public

const authUser = async (req, res) => {

  const { email, password } = req.body;



  try {

    const normalizedEmail = normalizeEmail(email);

    const user = await findUserByEmail(normalizedEmail);



    if (!user) {

      return res.status(401).json({ message: 'Invalid email or password' });

    }



    // Password Check

    if (await user.matchPassword(password)) {

      // Legacy bypass: users created before OTP feature are considered verified

      const OTP_FEATURE_DATE = new Date('2026-05-27T00:00:00Z');

      const isLegacyUser = user.createdAt && user.createdAt < OTP_FEATURE_DATE;

      

      if (!user.isEmailVerified && !isLegacyUser) {

        return res.status(403).json({ 

          message: 'Please verify your email address before logging in.',

          requiresOTP: true 

        });

      }



      // Auto-verify legacy users upon successful login

      if (isLegacyUser && !user.isEmailVerified) {

        user.isEmailVerified = true;

        await user.save();

      }



      if (user.status === 'suspended') {

        return res.status(403).json({ 

          message: 'Your account has been suspended by an administrator.',

          isSuspended: true

        });

      }



      res.json({

        _id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        status: user.status,

        isApproved: user.isApproved,

        referralCode: user.referralCode,

        commissionBalance: user.commissionBalance,

        token: generateToken(user._id),

      });

    } else {

      res.status(401).json({ message: 'Invalid email or password' });

    }

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};





// @desc    Register a new user

// @route   POST /api/users

// @access  Public

const registerUser = async (req, res) => {

  const { name, email, password, role, referralCode } = req.body;



  try {

    const normalizedEmail = normalizeEmail(email);

    // Check platform settings for registration permissions
    const Settings = (await import('../models/settingsModel.js')).default;
    const settings = await Settings.findOne();

    // Only allow student and instructor roles during registration
    const allowedRoles = ['student', 'instructor'];
    const userRole = role && allowedRoles.includes(role) ? role : 'student';

    // Check if registration is allowed for this role
    if (userRole === 'student' && settings && !settings.allowStudentRegistration) {
      return res.status(403).json({ 
        message: 'Student registration is currently disabled. Please contact the administrator.' 
      });
    }

    if (userRole === 'instructor' && settings && !settings.allowInstructorRegistration) {
      return res.status(403).json({ 
        message: 'Instructor registration is currently disabled. Please contact the administrator.' 
      });
    }

    // Input validation

    if (!name || !email || !password) {

      return res.status(400).json({ message: 'Please provide name, email, and password' });

    }



    if (name.trim().length < 2) {

      return res.status(400).json({ message: 'Name must be at least 2 characters long' });

    }

    // Validate password against settings
    const passwordMinLength = settings?.passwordMinLength || 8;
    if (password.length < passwordMinLength) {
      return res.status(400).json({ 
        message: `Password must be at least ${passwordMinLength} characters long` 
      });
    }

    if (settings?.requireUppercase && !/[A-Z]/.test(password)) {
      return res.status(400).json({ 
        message: 'Password must contain at least one uppercase letter' 
      });
    }

    if (settings?.requireLowercase && !/[a-z]/.test(password)) {
      return res.status(400).json({ 
        message: 'Password must contain at least one lowercase letter' 
      });
    }

    if (settings?.requireNumbers && !/\d/.test(password)) {
      return res.status(400).json({ 
        message: 'Password must contain at least one number' 
      });
    }

    if (settings?.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({ 
        message: 'Password must contain at least one special character' 
      });
    }



    // Email validation

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {

      return res.status(400).json({ message: 'Please provide a valid email address' });

    }



    // Check if user already exists

    let userExists = await findUserByEmail(normalizedEmail);

    if (userExists && userExists.isEmailVerified) {

      return res.status(400).json({ message: 'User with this email already exists' });

    }



    // Admin role can only be granted from database/admin panel

    if (role === 'admin') {

      return res.status(400).json({ 

        message: 'Admin role cannot be selected during registration. Contact system administrator.' 

      });

    }



    // Check referral code

    let referredBy = null;

    if (referralCode) {

      const referrer = await User.findOne({ referralCode });

      if (referrer) referredBy = referrer._id;

    }



    // Generate OTP

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes



    let user;

    if (userExists) {

      userExists.name = name.trim();

      userExists.password = password; // Will be hashed by pre-save hook

      userExists.role = userRole;

      userExists.otp = otp;

      userExists.otpExpire = otpExpire;

      if (referredBy) userExists.referredBy = referredBy;

      await userExists.save();

      user = userExists;

    } else {

      const myReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();



      user = await User.create({

        name: name.trim(),

        email: normalizedEmail,

        password,

        role: userRole,

        referralCode: myReferralCode,

        referredBy,

        otp,

        otpExpire,

        isEmailVerified: false

      });

    }



    if (user) {

      // Send OTP Email

      const message = `Your registration OTP is: ${otp}\n\nIt is valid for 10 minutes. Please enter this code on the registration page to verify your email.`;

      

      try {

        await sendEmail({

          email: user.email,

          subject: 'Your Registration OTP',

          message,

        });

      } catch (err) {

        console.error('Failed to send OTP email:', err);

      }



      res.status(201).json({

        message: 'OTP sent to your email. Please verify to complete registration.',

        email: user.email,

        requiresOTP: true

      });

    } else {

      res.status(400).json({ message: 'Failed to create user account' });

    }

  } catch (error) {

    console.error('Registration error:', error);

    

    // Handle specific MongoDB errors

    if (error.code === 11000) {

      return res.status(400).json({ message: 'User with this email already exists' });

    }

    

    if (error.name === 'ValidationError') {

      const messages = Object.values(error.errors).map(err => err.message);

      return res.status(400).json({ message: messages.join(', ') });

    }



    res.status(500).json({ message: 'Server error during registration. Please try again.' });

  }

};



// @desc    Verify OTP

// @route   POST /api/users/verify-otp

// @access  Public

const verifyOTP = async (req, res) => {

  const { email, otp } = req.body;



  try {

    if (!email || !otp) {

      return res.status(400).json({ message: 'Please provide email and OTP' });

    }



    const normalizedEmail = normalizeEmail(email);

    const user = await findUserByEmail(normalizedEmail);



    if (!user) {

      return res.status(404).json({ message: 'User not found' });

    }



    if (user.isEmailVerified) {

      return res.status(400).json({ message: 'Email is already verified' });

    }



    if (user.otp !== otp || user.otpExpire < new Date()) {

      return res.status(400).json({ message: 'Invalid or expired OTP' });

    }



    user.isEmailVerified = true;

    user.otp = undefined;

    user.otpExpire = undefined;

    await user.save();



    let message = 'Registration successful!';

    if (user.role === 'instructor') {

      message = 'Registration successful! Your instructor account is pending admin approval. You will be notified once approved.';

      // Notify Admins

      try {

        const admins = await User.find({ role: 'admin' }).select('_id');

        if (admins.length > 0) {

          await Notification.insertMany(admins.map(admin => ({

            recipient: admin._id,

            sender: user._id,

            type: 'instructor_pending',

            title: 'New Instructor Registration',

            message: `New instructor "${user.name}" is waiting for approval.`,

            relatedId: user._id

          })));

        }

      } catch (err) {

        console.error('Failed to notify admins of instructor registration:', err);

      }

    }



    res.status(200).json({

      _id: user._id,

      name: user.name,

      email: user.email,

      role: user.role,

      status: user.status,

      isApproved: user.isApproved,

      message,

      token: generateToken(user._id),

    });



  } catch (error) {

    console.error('OTP verification error:', error);

    res.status(500).json({ message: 'Server error during OTP verification' });

  }

};



// @desc    Resend OTP

// @route   POST /api/users/resend-otp

// @access  Public

const resendOTP = async (req, res) => {

  const { email } = req.body;



  try {

    if (!email) {

      return res.status(400).json({ message: 'Please provide an email' });

    }



    const normalizedEmail = normalizeEmail(email);

    const user = await findUserByEmail(normalizedEmail);



    if (!user) {

      return res.status(404).json({ message: 'User not found' });

    }



    if (user.isEmailVerified) {

      return res.status(400).json({ message: 'Email is already verified' });

    }



    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpExpire = new Date(Date.now() + 10 * 60 * 1000);



    user.otp = otp;

    user.otpExpire = otpExpire;

    await user.save();



    const message = `Your new registration OTP is: ${otp}\n\nIt is valid for 10 minutes. Please enter this code on the registration page to verify your email.`;

      

    try {

      await sendEmail({

        email: user.email,

        subject: 'Your Registration OTP',

        message,

      });

    } catch (err) {

      console.error('Failed to send OTP email:', err);

    }



    res.status(200).json({ message: 'A new OTP has been sent to your email' });

  } catch (error) {

    console.error('OTP resend error:', error);

    res.status(500).json({ message: 'Server error during OTP resend' });

  }

};



// @desc    Get user profile

// @route   GET /api/users/profile

// @access  Private

const getUserProfile = async (req, res) => {

  const user = await User.findById(req.user._id);



  if (user) {

    res.json({

      _id: user._id,

      name: user.name,

      email: user.email,

      role: user.role,

      status: user.status,

      isApproved: user.isApproved,

      approvedAt: user.approvedAt,

      referralCode: user.referralCode,

      commissionBalance: user.commissionBalance,

    });

  } else {

    res.status(404).json({ message: 'User not found' });

  }

};



// @desc    Get all users

// @route   GET /api/users/admin/all

// @access  Private/Admin

const getUsers = async (req, res) => {

  const users = await User.find({});

  res.json(users);

};



// @desc    Forgot password

// @route   POST /api/users/forgotpassword

// @access  Public

const forgotPassword = async (req, res) => {

  const user = await findUserByEmail(normalizeEmail(req.body.email));



  if (!user) {

    return res.status(404).json({ message: 'User not found' });

  }



  // Get reset token

  const resetToken = crypto.randomBytes(20).toString('hex');



  // Hash token and set to resetPasswordToken field

  user.resetPasswordToken = crypto

    .createHash('sha256')

    .update(resetToken)

    .digest('hex');



  // Set expire

  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes



  await user.save({ validateBeforeSave: false });



  // Create reset url

  const resetUrl = `${process.env.CLIENT_URL}/resetpassword/${resetToken}`;



  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click the link below to reset your password: \n\n ${resetUrl}`;



  try {

    await sendEmail({

      email: user.email,

      subject: 'Password reset token',

      message,

    });



    res.status(200).json({ success: true, data: 'Email sent' });

  } catch (err) {

    console.error('❌ FORGOT PASSWORD EMAIL ERROR:', err);

    user.resetPasswordToken = undefined;

    user.resetPasswordExpire = undefined;



    await user.save({ validateBeforeSave: false });



    res.status(500).json({ message: 'Email could not be sent' });

  }

};



// @desc    Reset password

// @route   PUT /api/users/resetpassword/:resettoken

// @access  Public

const resetPassword = async (req, res) => {

  // Get hashed token

  const resetPasswordToken = crypto

    .createHash('sha256')

    .update(req.params.resettoken)

    .digest('hex');



  const user = await User.findOne({

    resetPasswordToken,

    resetPasswordExpire: { $gt: Date.now() },

  });



  if (!user) {

    return res.status(400).json({ message: 'Invalid token' });

  }



  // Set new password

  user.password = req.body.password;

  user.resetPasswordToken = undefined;

  user.resetPasswordExpire = undefined;

  await user.save();



  res.json({

    _id: user._id,

    name: user.name,

    email: user.email,

    role: user.role,

    token: generateToken(user._id),

  });

};



// @desc    Export User Data (GDPR)

// @route   GET /api/users/export

// @access  Private

const exportUserData = async (req, res) => {

  try {

    const user = await User.findById(req.user._id).select('-password');

    // In a real app, you'd fetch enrollments, payments, etc.

    const data = {

      profile: user,

      exportDate: new Date(),

      status: 'GDPR Data Export'

    };

    

    res.setHeader('Content-disposition', `attachment; filename=user-data-${user._id}.json`);

    res.setHeader('Content-type', 'application/json');

    res.write(JSON.stringify(data, null, 2));

    res.end();

  } catch (error) {

    res.status(500).json({ message: 'Failed to export data' });

  }

};



// @desc    Delete Account (GDPR)

// @route   DELETE /api/users/delete-account

// @access  Private

const deleteAccount = async (req, res) => {

  try {

    const user = await User.findById(req.user._id);

    if (!user) {

      return res.status(404).json({ message: 'User not found' });

    }

    

    // Check if admin is trying to delete themselves (prevent lockout)

    if (user.role === 'admin') {

      const adminCount = await User.countDocuments({ role: 'admin' });

      if (adminCount <= 1) {

        return res.status(400).json({ message: 'Cannot delete the only admin account.' });

      }

    }

    

    // If instructor: preserve published courses/bundles (don't delete them, just remove instructor link)
    if (user.role === 'instructor') {
      const CourseModel = (await import('../models/courseModel.js')).default;
      const BundleModel = (await import('../models/bundleModel.js')).default;
      
      // Nullify instructor on published courses so students keep access
      await CourseModel.updateMany(
        { instructor: req.user._id, status: 'published' },
        { $set: { instructor: null } }
      );
      // Delete non-published courses
      await CourseModel.deleteMany({ instructor: req.user._id, status: { $ne: 'published' } });

      // Nullify instructor on approved bundles so students keep access
      await BundleModel.updateMany(
        { instructor: req.user._id, status: 'approved' },
        { $set: { instructor: null } }
      );
      // Delete non-approved bundles
      await BundleModel.deleteMany({ instructor: req.user._id, status: { $ne: 'approved' } });
    }


    // In a real app, delete associated data (enrollments, etc) or anonymize it

    await User.findByIdAndDelete(req.user._id);

    

    res.json({ message: 'Account and associated data deleted successfully.' });

  } catch (error) {

    res.status(500).json({ message: 'Failed to delete account' });

  }

};



// @desc    Request a withdrawal

// @route   POST /api/users/withdraw

// @access  Private

const requestWithdrawal = async (req, res) => {

  const { amount, bankName, accountNumber } = req.body;

  const user = await User.findById(req.user._id);



  if (!user) {

    return res.status(404).json({ message: 'User not found' });

  }



  if (Number(amount) > user.commissionBalance) {

    return res.status(400).json({ message: 'Insufficient commission balance' });

  }



  const withdrawal = await Withdrawal.create({

    user: user._id,

    amount: Number(amount),

    bankName,

    accountNumber,

  });



  if (withdrawal) {

    user.commissionBalance -= Number(amount);

    await user.save();

    res.status(201).json({ message: 'Withdrawal request submitted successfully' });

  } else {

    res.status(400).json({ message: 'Invalid withdrawal data' });

  }

};



// @desc    Request an appeal for suspended account

// @route   POST /api/users/request-appeal

// @access  Public

const requestAppeal = async (req, res) => {

  const { email } = req.body;

  

  // Find admin user

  const admin = await User.findOne({ role: 'admin' });

  if (admin) {

    await Notification.create({

      recipient: admin._id,

      sender: admin._id, // System generated on behalf of user

      type: 'account_appeal',

      title: 'Suspension Appeal Received',

      message: `User with email ${email} has requested an appeal to their suspension. Please review their case.`

    });

  }

  res.json({ message: 'Appeal sent successfully' });

};



export { 

  authUser, 

  registerUser, 

  verifyOTP,

  resendOTP,

  getUserProfile, 

  getUsers, 

  forgotPassword, 

  resetPassword, 

  exportUserData, 

  deleteAccount,

  requestWithdrawal,

  getWithdrawals,

  processWithdrawal,

  requestAppeal 

};

