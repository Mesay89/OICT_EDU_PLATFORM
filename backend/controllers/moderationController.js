import asyncHandler from 'express-async-handler';
import Moderation from '../models/moderationModel.js';

// @desc    Create content report (User)
// @route   POST /api/moderation/report
// @access  Private
const createReport = asyncHandler(async (req, res) => {
  const { contentType, contentId, reason, description } = req.body;
  const userId = req.user._id;

  if (!contentType || !contentId || !reason) {
    res.status(400);
    throw new Error('Content type, content ID, and reason are required');
  }

  // Check if user already reported this content
  const existingReport = await Moderation.findOne({
    reportedBy: userId,
    contentType,
    contentId
  });

  if (existingReport) {
    res.status(400);
    throw new Error('You have already reported this content');
  }

  const report = await Moderation.create({
    reportedBy: userId,
    contentType,
    contentId,
    reason,
    description,
    status: 'pending'
  });

  const populatedReport = await Moderation.findById(report._id)
    .populate('reportedBy', 'name email');

  res.status(201).json(populatedReport);
});

// @desc    Get all moderation reports (Admin)
// @route   GET /api/moderation/admin/all
// @access  Private/Admin
const getAllModerationReports = asyncHandler(async (req, res) => {
  const reports = await Moderation.find()
    .populate('reportedBy', 'name email')
    .sort('-createdAt');
  res.json(reports);
});

// @desc    Update moderation report status (Admin)
// @route   PUT /api/moderation/admin/:id
// @access  Private/Admin
const updateModerationReport = asyncHandler(async (req, res) => {
  const { status, actionTaken, notes } = req.body;
  
  const report = await Moderation.findById(req.params.id);

  if (report) {
    report.status = status || report.status;
    report.actionTaken = actionTaken || report.actionTaken;
    report.notes = notes || report.notes;
    await report.save();
    res.json(report);
  } else {
    res.status(404);
    throw new Error('Report not found');
  }
});

// @desc    Delete moderation report (Admin)
// @route   DELETE /api/moderation/admin/:id
// @access  Private/Admin
const deleteModerationReport = asyncHandler(async (req, res) => {
  const report = await Moderation.findById(req.params.id);

  if (report) {
    await report.deleteOne();
    res.json({ message: 'Report deleted successfully' });
  } else {
    res.status(404);
    throw new Error('Report not found');
  }
});

export { createReport, getAllModerationReports, updateModerationReport, deleteModerationReport };
