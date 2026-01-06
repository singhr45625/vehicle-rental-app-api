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
    // Fetch fresh user data from DB to ensure latest role/status
    const User = require('../models/User');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.user = user; // Now req.user is the Mongoose document
    req.user.userId = user._id; // Keep compatibility

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

const checkVerification = (req, res, next) => {
  const user = req.user;
  // Admins bypass verification check
  if (user.role === 'admin') return next();

  // Load user from DB if status is missing in token/req.user (optional but safer)
  // For now relying on what's in req.user which came from token or protect middleware
  // We need to ensure protect middleware fetches the LATEST status from DB or we might have stale status in token.
  // The current protect middleware in Step 48 sets req.user from decoded token.
  // If verification changes, token might be old.
  // Ideally, protect should fetch user from DB.
  // Let's check protect implementation again. 
  // Step 48: protect uses jwt.verify and sets req.user from payload.
  // It DOES NOT fetch from DB. This is a potential issue if status changes.
  // BUT the current protect implementation doesn't fetch from DB.
  // I should update protect to fetch from DB to be safe, OR just assume token is valid.
  // For strict enforcement, fetching from DB is better.
  // However, to minimise changes, I will add logic here to fetch if needed, or update protect.

  // Let's look at `checkVerification`. 
  // I will assume I need to fetch user to get latest status if not in token.
  // But wait, the token payload might not even HAVE verificationStatus.
  // Let's check `createToken` in `authController.js` (Step 23).
  // It does NOT include verificationStatus.
  // So I MUST fetch the user in `protect` or here.

  // Actually, let's update `protect` to fetch the user from DB. 
  // It's much safer for all role/status checks.
  // But strictly following user request... let's just add it to `protect` or make a hybrid.

  // Strategy: Update `protect` to fetch from DB.
  // Wait, `protect` in `auth.js` currently:
  /*
    req.user = {
      _id: decoded.userId,
      userId: decoded.userId,
      name: decoded.name,
      role: decoded.role,
      email: decoded.email 
    };
  */
  // If I change this, it might break other things expecting simple object.
  // BUT fetching user is standard practice.
  // I will modify `protect` in `auth.js` to fetch user.

  // For this tool call, I will add `checkVerification` export and function holder,
  // AND I will modify `protect` to fetch user.

  // Actually, I can do it in two steps. First, modify protect.
  // No, `replace_file_content` is valid.

  // Let's just add checkVerification that fetches user if needed?
  // No, cleaner to fix `protect`.

  // I'll stick to updating `auth.js` completely in this call if possible, or just the exports.
  // The chunk is for `authorizePermissions`...`module.exports`.

  if (req.user && req.user.verificationStatus === 'approved') {
    return next();
  }

  return res.status(403).json({
    error: 'Account not verified. Please wait for admin approval.'
  });
};

module.exports = {
  protect,
  authenticateUser: protect,
  authorizePermissions,
  checkVerification
};