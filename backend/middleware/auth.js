const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production');
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Middleware to check if user is superadmin
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
};

// Middleware to check if user is admin or superadmin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Middleware to check if user can manage students (admin, superadmin, or employee)
const canManageStudents = (req, res, next) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin' && req.user.role !== 'employee') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireSuperAdmin,
  requireAdmin,
  canManageStudents
};
