import mongoose from 'mongoose';

const settingsSchema = mongoose.Schema(
  {
    // General Site Settings
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
    currency: {
      type: String,
      default: 'ETB',
    },
    etbUsdRate: {
      type: Number,
      default: 150,
    },
    termsOfService: {
      type: String,
      default: 'Default Terms of Service',
    },
    privacyPolicy: {
      type: String,
      default: 'Default Privacy Policy',
    },

    // User Management Settings
    allowStudentRegistration: {
      type: Boolean,
      default: true,
    },
    allowInstructorRegistration: {
      type: Boolean,
      default: true,
    },
    defaultUserStatus: {
      type: String,
      enum: ['approved', 'pending'],
      default: 'approved',
    },
    requireEmailVerification: {
      type: Boolean,
      default: false,
    },
    autoSuspendInactiveDays: {
      type: Number,
      default: 0,
    },

    // Authentication & Security
    passwordMinLength: {
      type: Number,
      default: 8,
    },
    requireUppercase: {
      type: Boolean,
      default: true,
    },
    requireLowercase: {
      type: Boolean,
      default: true,
    },
    requireNumbers: {
      type: Boolean,
      default: true,
    },
    requireSpecialChars: {
      type: Boolean,
      default: false,
    },
    sessionTimeoutMinutes: {
      type: Number,
      default: 1440,
    },
    jwtExpirationDays: {
      type: Number,
      default: 30,
    },
    enableTwoFactorAuth: {
      type: Boolean,
      default: false,
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
    },
    lockoutDurationMinutes: {
      type: Number,
      default: 30,
    },

    // Payment Settings
    paymentGateways: {
      type: [String],
      enum: ['chapa', 'paypal', 'stripe', 'bank', 'telebirr'],
      default: ['chapa'],
    },
    chapaApiKey: {
      type: String,
      default: '',
    },
    paypalClientId: {
      type: String,
      default: '',
    },
    paypalClientSecret: {
      type: String,
      default: '',
    },
    stripePublicKey: {
      type: String,
      default: '',
    },
    stripeSecretKey: {
      type: String,
      default: '',
    },
    bankAccountInfo: {
      accountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      bankName: { type: String, default: '' },
      branch: { type: String, default: '' },
    },
    minimumWithdrawalAmount: {
      type: Number,
      default: 500,
    },
    maximumWithdrawalAmount: {
      type: Number,
      default: 10000,
    },
    dailyWithdrawalLimit: {
      type: Number,
      default: 50000,
    },
    platformCommissionPercentage: {
      type: Number,
      default: 10,
    },

    // Course Settings
    requireCourseApproval: {
      type: Boolean,
      default: true,
    },
    autoPublishCourses: {
      type: Boolean,
      default: false,
    },
    courseCategories: {
      type: [String],
      default: ['Programming', 'Design', 'Business', 'Marketing', 'Health', 'Language'],
    },
    courseVisibilityRules: {
      showUnpublished: { type: Boolean, default: false },
      showPending: { type: Boolean, default: false },
    },
    minimumCoursePrice: {
      type: Number,
      default: 0,
    },
    maximumCoursePrice: {
      type: Number,
      default: 100000,
    },

    // Instructor Settings
    instructorApprovalRequired: {
      type: Boolean,
      default: true,
    },
    instructorCommissionPercentage: {
      type: Number,
      default: 70,
    },
    instructorVerificationRequired: {
      type: Boolean,
      default: false,
    },
    instructorWithdrawalApproval: {
      type: Boolean,
      default: true,
    },

    // Affiliate Settings
    enableAffiliateProgram: {
      type: Boolean,
      default: false,
    },
    affiliateCommissionRate: {
      type: Number,
      default: 10,
    },
    referralBonusAmount: {
      type: Number,
      default: 100,
    },
    affiliateMinimumPayout: {
      type: Number,
      default: 1000,
    },

    // Notification Settings
    enableEmailNotifications: {
      type: Boolean,
      default: true,
    },
    enableSMSNotifications: {
      type: Boolean,
      default: false,
    },
    enablePushNotifications: {
      type: Boolean,
      default: true,
    },
    announcementBanner: {
      type: String,
      default: '',
    },
    announcementActive: {
      type: Boolean,
      default: false,
    },

    // Certificate Settings
    certificateTemplate: {
      type: String,
      default: 'default',
    },
    certificateSignature: {
      type: String,
      default: 'Platform Administrator',
    },
    certificateVerificationEnabled: {
      type: Boolean,
      default: true,
    },
    certificateVerificationURL: {
      type: String,
      default: 'oicttutor.com',
    },

    // Financial Settings
    taxPercentage: {
      type: Number,
      default: 0,
    },
    revenueSharingEnabled: {
      type: Boolean,
      default: true,
    },
    refundPolicyDays: {
      type: Number,
      default: 7,
    },
    allowFinancialReports: {
      type: Boolean,
      default: true,
    },

    // Email Configuration
    smtpHost: {
      type: String,
      default: '',
    },
    smtpPort: {
      type: Number,
      default: 587,
    },
    smtpUser: {
      type: String,
      default: '',
    },
    smtpPassword: {
      type: String,
      default: '',
    },
    smtpSecure: {
      type: Boolean,
      default: true,
    },
    emailFromName: {
      type: String,
      default: 'EduPlatform',
    },
    emailFromAddress: {
      type: String,
      default: 'noreply@eduplatform.com',
    },
    verificationEmailTemplate: {
      type: String,
      default: 'default',
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
