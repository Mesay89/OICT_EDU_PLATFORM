import asyncHandler from 'express-async-handler';
import Moderation from '../models/moderationModel.js';

// @desc    Get all moderation reports (Admin)
// @route   GET /api/admin/moderation
// @access  Private/Admin
const getAllModerationReports = asyncHandler(async (req, res) => {
  const reports = await Moderation.find()
    .populate('reportedBy', 'name email')
    .sort('-createdAt');
  res.json(reports);
});

// @desc    Update moderation report status (Admin)
// @route   PUT /api/admin/moderation/:id
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
// @route   DELETE /api/admin/moderation/:id
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

export { getAllModerationReports, updateModerationReport, deleteModerationReport };
