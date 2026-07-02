import asyncHandler from 'express-async-handler';
import Certificate from '../models/certificateModel.js';
import Enrollment from '../models/enrollmentModel.js';

// @desc    Get all certificates (Admin)
// @route   GET /api/admin/certificates
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
// @route   PUT /api/admin/certificates/:id/revoke
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
// @route   PUT /api/admin/certificates/:id/activate
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
// @route   DELETE /api/admin/certificates/:id
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

export { getAllCertificates, revokeCertificate, activateCertificate, deleteCertificate };
