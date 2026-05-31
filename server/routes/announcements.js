/**
 * server/routes/announcements.js
 *
 * Public (any authenticated user) route to fetch shared announcements.
 * Faculty POST is handled separately under /api/faculty/announcements.
 *
 * Mount in server/index.js as:
 *   app.use('/api/announcements', require('./routes/announcements'));
 */

const express = require('express');
const router  = express.Router();

const { protect } = require('../middleware/auth');
const Announcement = require('../models/Announcement');

/**
 * GET /api/announcements
 * Returns all published announcements, newest first.
 * Accessible by: students, faculty, admin (any authenticated user).
 */
router.get('/', protect, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const announcements = await Announcement.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('createdBy', 'name')
      .lean();

    return res.status(200).json({ success: true, data: announcements });
  } catch (err) {
    console.error('[announcements] GET / error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching announcements.' });
  }
});

module.exports = router;
