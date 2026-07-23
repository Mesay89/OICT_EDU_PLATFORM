import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    otp: {
      type: String,
      default: null
    },
    otpExpire: {
      type: Date,
      default: null
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin', 'superAdmin', 'cashManager'],
      default: 'student',
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending'
    },
    rejectionReason: {
      type: String,
      default: null
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    commissionBalance: {
      type: Number,
      default: 0,
    },
    apiKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    cv: {
      type: String,
      default: null,
    },
    certificates: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function () {
  // Set status and approval based on role for new users
  if (this.isNew) {
    if (this.role === 'student') {
      this.status = 'approved';
      this.isApproved = true;
      this.approvedAt = new Date();
    } else if (this.role === 'instructor') {
      this.status = 'pending';
      this.isApproved = false;
    } else if (this.role === 'admin' || this.role === 'superAdmin' || this.role === 'cashManager') {
      this.status = 'approved';
      this.isApproved = true;
      this.approvedAt = new Date();
    }
  }

  // Handle role changes for existing users
  if (this.isModified('role') && !this.isNew) {
    if (this.role === 'admin' || this.role === 'superAdmin' || this.role === 'cashManager') {
      // Automatically approve when role is changed
      this.status = 'approved';
      this.isApproved = true;
      this.approvedAt = new Date();
    } else if (this.role === 'student') {
      // Students are always approved
      this.status = 'approved';
      this.isApproved = true;
      this.approvedAt = new Date();
    } else if (this.role === 'instructor') {
      // Instructors need approval (unless already approved)
      if (this.status !== 'approved') {
        this.status = 'pending';
        this.isApproved = false;
        this.approvedAt = null;
      }
    }
  }

  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.index({ role: 1, status: 1 });

const User = mongoose.model('User', userSchema);

export default User;
