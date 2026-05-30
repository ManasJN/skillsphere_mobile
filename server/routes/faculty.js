/**
 * server/routes/faculty.js
 *
 * All routes require:
 *   1. valid JWT (protect)
 *   2. role === 'faculty' (authorize)
 *
 * Mount in server/index.js as:
 *   app.use('/api/faculty', require('./routes/faculty'));
 */

const express = require('express');
const router  = express.Router();

const { protect, authorize } = require('../middleware/auth');
const {
  getStudents,
  getStudent,
  getStats,
  getAnnouncements,
  createAnnouncement,
} = require('../controllers/facultyController');

// All faculty routes require authentication + faculty role
router.use(protect, authorize('faculty', 'admin'));

// ── Students ──────────────────────────────────────────────────────────────────
router.get('/students',     getStudents);
router.get('/students/:id', getStudent);

// ── Dashboard stats ───────────────────────────────────────────────────────────
router.get('/stats', getStats);

// ── Announcements ─────────────────────────────────────────────────────────────
router.get('/announcements',  getAnnouncements);
router.post('/announcements', createAnnouncement); // Phase 2

module.exports = router;
