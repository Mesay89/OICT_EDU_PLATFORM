import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Block suspended users from all services
      if (req.user.status === 'suspended') {
        return res.status(403).json({ 
          message: 'Your account has been suspended. Please contact an administrator.' 
        });
      }

      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const optionalProtect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      req.user = null;
    }
  }

  next();
};

// Role-based middleware with approval check
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin' && req.user.status === 'approved') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
};

const instructor = (req, res, next) => {
  if (req.user && (req.user.role === 'instructor' || req.user.role === 'admin')) {
    // Check if instructor is approved
    if (req.user.role === 'instructor' && req.user.status !== 'approved') {
      return res.status(403).json({ 
        message: 'Access denied. Instructor approval pending from admin.' 
      });
    }
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Instructor role required.' });
  }
};

const student = (req, res, next) => {
  if (req.user && ['student', 'instructor'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Student role required.' });
  }
};

// Multiple role middleware
const adminOrInstructor = (req, res, next) => {
  if (req.user && ['admin', 'instructor'].includes(req.user.role)) {
    // Check instructor approval
    if (req.user.role === 'instructor' && req.user.status !== 'approved') {
      return res.status(403).json({ 
        message: 'Access denied. Instructor approval pending from admin.' 
      });
    }
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin or Instructor role required.' });
  }
};

const anyRole = (roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      // Check instructor approval if needed
      if (req.user.role === 'instructor' && req.user.status !== 'approved') {
        return res.status(403).json({ 
          message: 'Access denied. Instructor approval pending from admin.' 
        });
      }
      next();
    } else {
      res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }
  };
};

export { protect, optionalProtect, admin, instructor, student, adminOrInstructor, anyRole };
