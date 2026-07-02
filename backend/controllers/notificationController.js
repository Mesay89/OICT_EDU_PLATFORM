import asyncHandler from 'express-async-handler';
import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';
import mongoose from 'mongoose';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);
  res.json(notifications);
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (notification) {
    if (notification.recipient.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }
    notification.isRead = true;
    const updatedNotification = await notification.save();
    res.json(updatedNotification);
  } else {
    res.status(404);
    throw new Error('Notification not found');
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );
  res.json({ message: 'All notifications marked as read' });
});

// @desc    Broadcast notification to users
// @route   POST /api/notifications/broadcast
// @access  Private/Admin
const broadcastNotification = asyncHandler(async (req, res) => {
  const { title, message, targetType, targetId } = req.body;

  let recipients = [];

  if (targetType === 'all') {
    recipients = await User.find({});
  } else if (targetType === 'students') {
    recipients = await User.find({ role: 'student' });
  } else if (targetType === 'instructors') {
    recipients = await User.find({ role: 'instructor' });
  } else if (targetType === 'cashManagers') {
    recipients = await User.find({ role: 'cashManager' });
  } else if (targetType === 'admins') {
    recipients = await User.find({ role: 'admin' });
  } else if (targetType === 'superAdmins') {
    recipients = await User.find({ role: 'superAdmin' });
  } else if (targetType === 'user' && targetId) {
    const user = await User.findById(targetId);
    if (user) recipients = [user];
  }

  if (recipients.length === 0) {
    return res.status(400).json({ message: 'No recipients found' });
  }

  const broadcastId = new mongoose.Types.ObjectId();

  const notifications = recipients.map(recipient => ({
    recipient: recipient._id,
    sender: req.user._id,
    type: 'broadcast',
    title,
    message,
    broadcastId,
  }));

  await Notification.insertMany(notifications);
  res.json({ message: `Notification sent to ${recipients.length} users` });
});

// @desc    Get all notifications (admin)
// @route   GET /api/notifications/all
// @access  Private/Admin
const getAllNotifications = asyncHandler(async (req, res) => {
  // Get all broadcast notifications and group by broadcastId
  const broadcastNotifications = await Notification.find({ type: 'broadcast', broadcastId: { $ne: null } })
    .populate('sender', 'name email')
    .sort({ createdAt: -1 });

  // Group by broadcastId and keep only one per group
  const groupedBroadcasts = {};
  broadcastNotifications.forEach(n => {
    if (!groupedBroadcasts[n.broadcastId.toString()]) {
      groupedBroadcasts[n.broadcastId.toString()] = {
        ...n.toObject(),
        recipientCount: 1
      };
    } else {
      groupedBroadcasts[n.broadcastId.toString()].recipientCount++;
    }
  });

  const uniqueBroadcasts = Object.values(groupedBroadcasts);

  // Get non-broadcast notifications
  const otherNotifications = await Notification.find({
    $or: [
      { type: { $ne: 'broadcast' } },
      { broadcastId: null }
    ]
  })
    .populate('recipient', 'name email')
    .populate('sender', 'name email')
    .sort({ createdAt: -1 })
    .limit(50);

  // Combine and sort by date
  const allNotifications = [...uniqueBroadcasts, ...otherNotifications]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50);

  res.json(allNotifications);
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private/Admin
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (notification) {
    // If it's a broadcast notification, delete all notifications with the same broadcastId
    if (notification.broadcastId) {
      await Notification.deleteMany({ broadcastId: notification.broadcastId });
      res.json({ message: 'Notification and all related broadcast notifications deleted successfully' });
    } else {
      // Delete single notification
      await notification.deleteOne();
      res.json({ message: 'Notification deleted successfully' });
    }
  } else {
    res.status(404);
    throw new Error('Notification not found');
  }
});

// @desc    Update notification
// @route   PUT /api/notifications/:id
// @access  Private/Admin
const updateNotification = asyncHandler(async (req, res) => {
  const { title, message } = req.body;

  const notification = await Notification.findById(req.params.id);

  if (notification) {
    notification.title = title || notification.title;
    notification.message = message || notification.message;

    const updatedNotification = await notification.save();
    res.json(updatedNotification);
  } else {
    res.status(404);
    throw new Error('Notification not found');
  }
});

export { getMyNotifications, markAsRead, markAllAsRead, broadcastNotification, getAllNotifications, deleteNotification, updateNotification };
