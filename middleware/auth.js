const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  // 1. Get token from header
  const authHeader = req.headers.authorization;

  // 2. Check if token exists
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authorization token required (Format: Bearer <token>)'
    });
  }

  const token = authHeader.split(' ')[1];

  // 3. Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach user to request object
    req.user = {
      _id: decoded.userId, // Using _id to match Mongoose/MongoDB convention
      userId: decoded.userId,
      name: decoded.name,
      role: decoded.role,
      email: decoded.email // Added if available
    };

    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);

    let errorMessage = 'Not authorized to access this route';
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token expired. Please login again';
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Invalid token. Please check your credentials';
    }

    return res.status(401).json({
      success: false,
      error: errorMessage
    });
  }
};

const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Unauthorized to access this route'
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authenticateUser: protect,
  authorizePermissions
};