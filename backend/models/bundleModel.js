import mongoose from 'mongoose';

const bundleSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
      },
    ],
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    image: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: {
      type: String,
      default: null
    },
    modules: [
      {
        title: { type: String, required: true },
        videoUrl: { type: String },
        thumbnail: { type: String },  // per-module thumbnail/poster image
        content: { type: String },
        videoSource: { 
          type: String, 
          enum: ['youtube', 'googledrive', 'local'],
          default: 'youtube'
        },
        dripDelayDays: {
          type: Number,
          default: 0
        },
        type: {
          type: String,
          enum: ['video', 'document', 'scorm'],
          default: 'video'
        },
        scormUrl: { type: String },
        isReleased: {
          type: Boolean,
          default: false  // hidden until admin approves
        },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending'
        },
        rejectionReason: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Bundle = mongoose.model('Bundle', bundleSchema);

export default Bundle;
