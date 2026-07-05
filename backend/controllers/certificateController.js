import asyncHandler from 'express-async-handler';
import Certificate from '../models/certificateModel.js';
import Enrollment from '../models/enrollmentModel.js';
import Course from '../models/courseModel.js';
import Bundle from '../models/bundleModel.js';
import crypto from 'crypto';

// Generate unique certificate number
const generateCertificateNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CERT-${timestamp}-${random}`;
};

// @desc    Issue certificate for course completion
// @route   POST /api/certificates/issue
// @access  Private
const issueCertificate = asyncHandler(async (req, res) => {
  const { courseId, bundleId } = req.body;
  const userId = req.user._id;

  if (!courseId && !bundleId) {
    res.status(400);
    throw new Error('Course ID or Bundle ID is required');
  }

  // Check if certificate already exists
  const existingCertificate = await Certificate.findOne({
    user: userId,
    $or: [{ course: courseId }, { bundle: bundleId }]
  });

  if (existingCertificate) {
    res.status(400);
    throw new Error('Certificate already issued for this course/bundle');
  }

  // Verify enrollment and completion
  let enrollment;
  if (courseId) {
    enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      progress: 100
    }).populate('course');
  } else {
    enrollment = await Enrollment.findOne({
      user: userId,
      bundle: bundleId,
      progress: 100
    }).populate('bundle');
  }

  if (!enrollment) {
    res.status(400);
    throw new Error('Course/Bundle not completed');
  }

  // Create certificate
  const certificate = await Certificate.create({
    user: userId,
    course: courseId || null,
    bundle: bundleId || null,
    certificateNumber: generateCertificateNumber(),
    completionDate: new Date()
  });

  const populatedCertificate = await Certificate.findById(certificate._id)
    .populate('user', 'name email')
    .populate('course', 'title')
    .populate('bundle', 'title');

  res.status(201).json(populatedCertificate);
});

// @desc    Get user certificates
// @route   GET /api/certificates/my
// @access  Private
const getMyCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({ user: req.user._id })
    .populate('course', 'title description image')
    .populate('bundle', 'title description image')
    .sort('-createdAt');
  res.json(certificates);
});

// @desc    Verify certificate
// @route   GET /api/certificates/verify/:certificateNumber
// @access  Public
const verifyCertificate = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findOne({
    certificateNumber: req.params.certificateNumber
  })
    .populate('user', 'name email')
    .populate('course', 'title')
    .populate('bundle', 'title');

  if (!certificate) {
    res.status(404);
    throw new Error('Certificate not found');
  }

  res.json({
    valid: certificate.status === 'active',
    certificate
  });
});

// @desc    Get all certificates (Admin)
// @route   GET /api/certificates/admin/all
// @access  Private/Admin
const getAllCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find()
    .populate('user', 'name email')
    .populate('course', 'title')
    .populate('bundle', 'title')
    .sort('-createdAt');
  res.json(certificates);
});

// @desc    Revoke certificate (Admin)
// @route   PUT /api/certificates/admin/:id/revoke
// @access  Private/Admin
const revokeCertificate = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findById(req.params.id);

  if (certificate) {
    certificate.status = 'revoked';
    await certificate.save();
    res.json({ message: 'Certificate revoked successfully' });
  } else {
    res.status(404);
    throw new Error('Certificate not found');
  }
});

// @desc    Activate certificate (Admin)
// @route   PUT /api/certificates/admin/:id/activate
// @access  Private/Admin
const activateCertificate = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findById(req.params.id);

  if (certificate) {
    certificate.status = 'active';
    await certificate.save();
    res.json({ message: 'Certificate activated successfully' });
  } else {
    res.status(404);
    throw new Error('Certificate not found');
  }
});

// @desc    Delete certificate (Admin)
// @route   DELETE /api/certificates/admin/:id
// @access  Private/Admin
const deleteCertificate = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findById(req.params.id);

  if (certificate) {
    await certificate.deleteOne();
    res.json({ message: 'Certificate deleted successfully' });
  } else {
    res.status(404);
    throw new Error('Certificate not found');
  }
});

export {
  getAllCertificates,
  revokeCertificate,
  activateCertificate,
  deleteCertificate,
  issueCertificate,
  getMyCertificates,
  verifyCertificate
};
