// routes/auth.js

const express = require('express');

const router = express.Router();

const {
  register,
  registerCollege,
  verifyOtp,
  login,
  refresh,
  getMe,
  logout,
  changePassword,
  createInternalAdmin
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');

const {
  registerRules,
  loginRules,
  validate
} = require('../middleware/validate');


// ── Public Routes ─────────────────────────────────────────────

router.post(
  '/register',
  registerRules,
  validate,
  register
);

router.post(
  '/register-college',
  registerCollege
);

router.post(
  '/verify-otp',
  verifyOtp
);

router.post(
  '/login',
  loginRules,
  validate,
  login
);

router.post(
  '/refresh',
  refresh
);

router.post(
  '/internal/bootstrap-admin',
  createInternalAdmin
);


// ── Private Routes ────────────────────────────────────────────

router.get(
  '/me',
  protect,
  getMe
);

router.post(
  '/logout',
  protect,
  logout
);

router.put(
  '/change-password',
  protect,
  changePassword
);


module.exports = router;
