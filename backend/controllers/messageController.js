import Conversation from '../models/conversationModel.js';
import Message from '../models/messageModel.js';

// @desc    Get all conversations for the logged-in user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: { $in: [req.user._id] },
    })
      .populate('participants', 'name image role')
      .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get message history for a single conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessageHistory = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if the user is a participant
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }

    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate('sender', 'name image role')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a direct message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({ message: 'Recipient and content are required' });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user._id, recipientId],
      });
      await conversation.save();
    }

    const message = new Message({
      conversationId: conversation._id,
      sender: req.user._id,
      content,
    });

    const savedMessage = await message.save();

    // Update conversation metadata
    conversation.lastMessage = content;
    conversation.lastMessageBy = req.user._id;
    conversation.lastMessageAt = Date.now();
    await conversation.save();

    const populatedMessage = await savedMessage.populate('sender', 'name image role');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id });
    const convIds = conversations.map(c => c._id);
    const count = await Message.countDocuments({
      conversationId: { $in: convIds },
      sender: { $ne: req.user._id },
      isRead: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markMessagesAsRead = async (req, res) => {
  try {
    await Message.updateMany(
      { conversationId: req.params.conversationId, sender: { $ne: req.user._id }, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getConversations, getMessageHistory, sendMessage, getUnreadCount, markMessagesAsRead };
