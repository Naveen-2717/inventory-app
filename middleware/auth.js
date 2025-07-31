const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Account is blocked.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    res.status(500).json({ message: 'Server error during authentication.' });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Check if user is customer
const requireCustomer = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Access denied. Customer privileges required.' });
  }
  next();
};

// Optional authentication (for public routes that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.token;
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && !user.isBlocked) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireCustomer,
  optionalAuth
};