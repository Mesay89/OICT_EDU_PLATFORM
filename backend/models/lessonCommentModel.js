import mongoose from 'mongoose';

const commentSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    bundle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bundle',
    },
    moduleId: {
      type: String, // This maps to the _id of the module in the Course's modules array
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    replies: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'User',
        },
        content: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const LessonComment = mongoose.model('LessonComment', commentSchema);

export default LessonComment;
