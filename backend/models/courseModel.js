import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const courseSchema = mongoose.Schema(
  {
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    introVideoUrl: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      enum: ['ETB', 'USD'],
      default: 'ETB',
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    videoSource: {
      type: String,
      enum: ['youtube', 'googledrive'],
      default: 'youtube',
    },
    modules: [
      {
        title: { type: String, required: true },
        videoUrl: { type: String },
        content: { type: String },
        videoSource: { 
          type: String, 
          enum: ['youtube', 'googledrive'],
          default: 'youtube'
        },
        dripDelayDays: {
          type: Number,
          default: 0
        },
        type: {
          type: String,
          enum: ['video', 'scorm'],
          default: 'video'
        },
        scormUrl: { type: String },
        isReleased: {
          type: Boolean,
          default: true
        },
      },
    ],
    reviews: [reviewSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'published', 'rejected'],
      default: 'pending',
    },
    tags: [String],
    isFeatured: {
      type: Boolean,
      default: false
    },
    averageRating: {
      type: Number,
      default: 0
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'All Levels',
    }
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ status: 1, createdAt: -1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ category: 1 });

const Course = mongoose.model('Course', courseSchema);

export default Course;
