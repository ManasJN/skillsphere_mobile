const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect: verify JWT and attach user to req
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized – no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired – please login again' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * Authorize: restrict to specific roles
 * Usage: authorize('admin', 'college')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized for this action`,
      });
    }
    next();
  };
};

/**
 * Owner or Admin: only the resource owner OR admin/college can access
 * Usage: ownerOrAdmin('userId')  — where 'userId' is the param name in the route
 */
const ownerOrAdmin = (paramName = 'id') => {
  return (req, res, next) => {
    const resourceOwnerId = req.params[paramName];
    const isOwner = req.user._id.toString() === resourceOwnerId;
    const isAdmin = ['admin', 'college'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied – not the resource owner' });
    }
    next();
  };
};

module.exports = { protect, authorize, ownerOrAdmin };
