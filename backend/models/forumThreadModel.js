import mongoose from 'mongoose';

const postSchema = mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const forumThreadSchema = mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Course',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['General', 'Technical', 'Study Group', 'Off-topic'],
      default: 'General',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    posts: [postSchema],
  },
  {
    timestamps: true,
  }
);

const ForumThread = mongoose.model('ForumThread', forumThreadSchema);

export default ForumThread;
