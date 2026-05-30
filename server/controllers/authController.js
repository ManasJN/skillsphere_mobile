const User = require('../models/User');
const College = require('../models/College');

const {
  sendTokenResponse,
  verifyToken,
  generateToken
} = require('../utils/jwt');

const { updateStreak } = require('../utils/xp');

const sendWelcomeEmail = require('../utils/sendWelcomeEmail');

const sendOtpEmail = require('../utils/sendOtpEmail');


// ── @route  POST /api/auth/register ──────────────────────────────────────────
// ── @access Public
const register = async (req, res, next) => {

  try {

    const {
      name,
      email,
      password,
      department,
      rollNumber,
      semester,
      role: requestedRole,
    } = req.body;

    const normalizedRole = ['faculty', 'college'].includes(requestedRole) ? 'faculty' : 'student';
    const verificationStatus = normalizedRole === 'faculty' ? 'pending' : 'unsubmitted';

    const existing = await User.findOne({ email });

    if (existing) {

      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });

    }

    // Generate OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Create user
    const user = await User.create({

      name,
      email,
      password,

      role: normalizedRole,
      verificationStatus,

      department,

      rollNumber,

      semester,

      otp,

      otpExpiry: Date.now() + 5 * 60 * 1000

    });

    // Send OTP Email
    await sendOtpEmail(
      user.email,
      user.name,
      otp
    );

    // Response
    res.status(201).json({

      success: true,

      message: 'OTP sent to email',

      email: user.email

    });

  } catch (err) {

    next(err);

  }

};

const registerCollege = async (req, res, next) => {
  try {
    const {
      collegeName,
      officialEmail,
      website,
      password,
      representativeName,
      representativeDesignation,
      representativePhone,
      representativeEmail,
    } = req.body;

    const existing = await User.findOne({ email: officialEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Official email already registered' });
    }

    const existingCollege = await College.findOne({ officialEmail });
    if (existingCollege) {
      return res.status(400).json({ success: false, message: 'College registration already exists' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      name: representativeName,
      email: officialEmail,
      password,
      role: 'faculty',
      verificationStatus: 'pending',
      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000,
    });

    const college = await College.create({
      collegeName,
      officialEmail,
      website,
      user: user._id,
      authorizedRepresentative: {
        name: representativeName,
        designation: representativeDesignation,
        phone: representativePhone,
        email: representativeEmail || officialEmail,
      },
    });

    user.collegeId = college._id;
    user.college = college.collegeName;
    await user.save();

    await sendOtpEmail(user.email, user.name, otp);

    res.status(201).json({
      success: true,
      message: 'College account created. OTP sent to official email.',
      email: user.email,
    });
  } catch (err) {
    next(err);
  }
};


// ── @route  POST /api/auth/verify-otp ────────────────────────────────────────
// ── @access Public
const verifyOtp = async (req, res, next) => {

  try {

    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {

      return res.status(404).json({

        success: false,

        message: 'User not found'

      });

    }

    if (user.otp !== otp) {

      return res.status(400).json({

        success: false,

        message: 'Invalid OTP'

      });

    }

    if (user.otpExpiry < Date.now()) {

      return res.status(400).json({

        success: false,

        message: 'OTP expired'

      });

    }

    // Verify account
    user.isVerified = true;

    user.otp = null;

    user.otpExpiry = null;

    await user.save();

    // Send Welcome Email
    await sendWelcomeEmail(
      user.email,
      user.name
    );

    // Login user automatically
    sendTokenResponse(user, 200, res);

  } catch (err) {

    next(err);

  }

};


// ── @route  POST /api/auth/login ──────────────────────────────────────────────
// ── @access Public
const login = async (req, res, next) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email })
      .select('+password');

    if (!user) {

      return res.status(401).json({

        success: false,

        message: 'Invalid email or password'

      });

    }

    // Check verification
    if (!user.isVerified) {

      return res.status(401).json({

        success: false,

        message: 'Please verify your email first'

      });

    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {

      return res.status(401).json({

        success: false,

        message: 'Invalid email or password'

      });

    }

    if (!user.isActive) {

      return res.status(403).json({

        success: false,

        message: 'Account deactivated. Contact admin.'

      });

    }

    // Update streak silently
    await updateStreak(user._id);

    sendTokenResponse(user, 200, res);

  } catch (err) {

    next(err);

  }

};


// ── @route  POST /api/auth/refresh ───────────────────────────────────────────
// ── @access Public
const refresh = async (req, res, next) => {

  try {

    const { refreshToken } = req.body;

    if (!refreshToken) {

      return res.status(401).json({

        success: false,

        message: 'No refresh token provided'

      });

    }

    const decoded = verifyToken(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user) {

      return res.status(401).json({

        success: false,

        message: 'User not found'

      });

    }

    const newToken = generateToken(user._id, user.role);

    res.json({

      success: true,

      token: newToken

    });

  } catch (err) {

    return res.status(401).json({

      success: false,

      message: 'Invalid or expired refresh token'

    });

  }

};


// ── @route  GET /api/auth/me ──────────────────────────────────────────────────
// ── @access Private
const getMe = async (req, res) => {

  const user = await User.findById(req.user._id)
    .populate('collegeId', 'collegeName officialEmail website logo verificationStatus')
    .populate('mentoring', 'name email department');

  res.json({

    success: true,

    data: user

  });

};


// ── @route  POST /api/auth/logout ─────────────────────────────────────────────
// ── @access Private
const logout = (req, res) => {

  res.cookie('token', '', {

    expires: new Date(0),

    httpOnly: true

  });

  res.json({

    success: true,

    message: 'Logged out successfully'

  });

};


// ── @route  PUT /api/auth/change-password ─────────────────────────────────────
// ── @access Private
const changePassword = async (req, res, next) => {

  try {

    const {
      currentPassword,
      newPassword
    } = req.body;

    const user = await User.findById(req.user._id)
      .select('+password');

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {

      return res.status(400).json({

        success: false,

        message: 'Current password is incorrect'

      });

    }

    if (newPassword.length < 8) {

      return res.status(400).json({

        success: false,

        message: 'New password must be at least 8 characters'

      });

    }

    user.password = newPassword;

    await user.save();

    res.json({

      success: true,

      message: 'Password updated successfully'

    });

  } catch (err) {

    next(err);

  }

};

const createInternalAdmin = async (req, res, next) => {
  try {
    const secret = req.headers['x-admin-secret'] || req.body.secret;
    if (!process.env.ADMIN_BOOTSTRAP_SECRET || secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({
      name,
      email,
      password,
      role: 'admin',
      isVerified: true,
      verificationStatus: 'verified',
      verifiedAt: new Date(),
    });

    res.status(201).json({ success: true, data: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
};


module.exports = {
  register,
  registerCollege,
  verifyOtp,
  login,
  refresh,
  getMe,
  logout,
  changePassword,
  createInternalAdmin
};
