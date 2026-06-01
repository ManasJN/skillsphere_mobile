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

    // Normalize email before lookup and save so casing never causes a mismatch
    const normalizedEmail = (email || '').trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      name,
      email: normalizedEmail,   // <-- always store lowercase-trimmed
      password,
      role: normalizedRole,
      verificationStatus,
      department,
      rollNumber,
      semester,
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000,  // DEMO: 10 min window (up from 5)
    });

    // Best-effort OTP email — don't block registration if email fails
    try {
      await sendOtpEmail(user.email, user.name, otp);
    } catch (emailErr) {
      console.error('[auth] OTP email send failed (non-fatal):', emailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'OTP sent to email',
      email: user.email,
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

    const normalizedEmail = (officialEmail || '').trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Official email already registered' });
    }

    const existingCollege = await College.findOne({ officialEmail: normalizedEmail });
    if (existingCollege) {
      return res.status(400).json({ success: false, message: 'College registration already exists' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      name: representativeName,
      email: normalizedEmail,
      password,
      role: 'faculty',
      verificationStatus: 'pending',
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000,
    });

    const college = await College.create({
      collegeName,
      officialEmail: normalizedEmail,
      website,
      user: user._id,
      authorizedRepresentative: {
        name: representativeName,
        designation: representativeDesignation,
        phone: representativePhone,
        email: representativeEmail || normalizedEmail,
      },
    });

    user.collegeId = college._id;
    user.college = college.collegeName;
    await user.save();

    try {
      await sendOtpEmail(user.email, user.name, otp);
    } catch (emailErr) {
      console.error('[auth] OTP email send failed (non-fatal):', emailErr.message);
    }

    return res.status(201).json({
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
//
// DEMO FIX: The 404 "User not found" was caused by email casing mismatch
// between registration and the OTP screen. We now normalise the email on
// lookup the same way we normalised it on save.
//
const verifyOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;
    // Always normalise so "User@Jec.ac.in" finds the stored "user@jec.ac.in"
    const email = (req.body.email || '').trim().toLowerCase();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register again.',
      });
    }

    // DEMO: if OTP is somehow missing on the record (e.g. already verified),
    // allow re-login instead of blocking with a cryptic error.
    if (!user.otp) {
      if (user.isVerified) {
        // Already verified — just log them in
        return sendTokenResponse(user, 200, res);
      }
      return res.status(400).json({
        success: false,
        message: 'No pending OTP. Please register again or request a new code.',
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new code.',
      });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // Best-effort welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailErr) {
      console.error('[auth] Welcome email failed (non-fatal):', emailErr.message);
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};


// ── @route  POST /api/auth/login ──────────────────────────────────────────────
// ── @access Public
const login = async (req, res, next) => {
  try {
    const { password } = req.body;
    // Accept `identifier` (new multi-login field) OR legacy `email` field.
    const raw        = (req.body.identifier || req.body.email || '').trim();
    const isEmail    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
    const identifier = isEmail ? raw.toLowerCase() : raw;

    // Build the query: email match OR roll number match (case-insensitive).
    const query = isEmail
      ? { email: identifier }
      : { rollNumber: { $regex: `^${identifier}$`, $options: 'i' } };

    const user = await User.findOne(query).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials — check your email / roll number and password'
      });
    }

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
        message: 'Invalid credentials — check your email / roll number and password'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account deactivated. Contact admin.'
      });
    }

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

    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const newToken = generateToken(user._id, user.role);
    res.json({ success: true, token: newToken });
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

  res.json({ success: true, data: user });
};


// ── @route  POST /api/auth/logout ─────────────────────────────────────────────
// ── @access Private
const logout = (req, res) => {
  res.cookie('token', '', {
    expires: new Date(0),
    httpOnly: true,
  });
  res.json({ success: true, message: 'Logged out successfully' });
};


// ── @route  PUT /api/auth/change-password ─────────────────────────────────────
// ── @access Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
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

    res.json({ success: true, message: 'Password updated successfully' });
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

    const normalizedEmail = (email || '').trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({
      name,
      email: normalizedEmail,
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
  createInternalAdmin,
};
