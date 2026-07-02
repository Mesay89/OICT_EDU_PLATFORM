import Announcement from '../models/announcementModel.js';
import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';

// @desc    Create announcement
// @route   POST /api/admin/announcements
// @access  Private/Admin
export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, scheduledFor } = req.body;

    const announcement = await Announcement.create({
      title,
      message,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      createdBy: req.user._id,
      status: scheduledFor ? 'scheduled' : 'published',
    });

    // If published immediately, create notifications for all users
    if (!scheduledFor) {
      const users = await User.find({});
      const notifications = users.map(user => ({
        recipient: user._id,
        sender: req.user._id,
        type: 'announcement',
        title,
        message,
        relatedId: announcement._id,
      }));

      await Notification.insertMany(notifications);
    }

    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all announcements
// @route   GET /api/admin/announcements
// @access  Private/Admin
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({})
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update announcement
// @route   PUT /api/admin/announcements/:id
// @access  Private/Admin
export const updateAnnouncement = async (req, res) => {
  try {
    const { title, message, scheduledFor } = req.body;
    
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    announcement.title = title || announcement.title;
    announcement.message = message || announcement.message;
    announcement.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
    announcement.status = scheduledFor ? 'scheduled' : 'published';

    const updatedAnnouncement = await announcement.save();
    res.json(updatedAnnouncement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/admin/announcements/:id
// @access  Private/Admin
export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await announcement.deleteOne();
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send announcement notifications to all users
// @route   POST /api/admin/announcements/:id/send
// @access  Private/Admin
export const sendAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    const users = await User.find({});
    const notifications = users.map(user => ({
      recipient: user._id,
      sender: req.user._id,
      type: 'announcement',
      title: announcement.title,
      message: announcement.message,
      relatedId: announcement._id,
    }));

    await Notification.insertMany(notifications);
    
    // Update announcement status to published
    announcement.status = 'published';
    await announcement.save();

    res.json({ message: `Announcement sent to ${users.length} users` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
