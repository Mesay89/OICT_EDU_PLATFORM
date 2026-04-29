import mongoose from 'mongoose';

const settingsSchema = mongoose.Schema(
  {
    siteName: {
      type: String,
      default: 'EduPlatform',
    },
    siteEmail: {
      type: String,
      default: 'admin@eduplatform.com',
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    commissionRate: {
      type: Number,
      default: 10, // 10% default
    },
    allowInstructorRegistration: {
      type: Boolean,
      default: true,
    },
    termsOfService: {
      type: String,
      default: 'Default Terms of Service',
    },
    currency: {
      type: String,
      default: 'ETB',
    },
    etbUsdRate: {
      type: Number,
      default: 150,
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
