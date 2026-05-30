/**
 * server/controllers/facultyController.js
 *
 * Phase 1 endpoints:
 *   GET /api/faculty/students       — all students in this college
 *   GET /api/faculty/students/:id   — single student full profile
 *   GET /api/faculty/stats          — aggregate dashboard stats
 *   GET /api/faculty/announcements  — announcements by this college (empty list for now)
 *
 * Phase 2 will add:
 *   POST /api/faculty/announcements
 *   POST /api/faculty/opportunities
 */

const User         = require('../models/User');
const Announcement = require('../models/Announcement');   // may not exist yet — handled below

// ── helpers ──────────────────────────────────────────────────────────────────

const STUDENT_LIST_SELECT =
  'name email department semester rollNumber xpPoints level ' +
  'verificationStatus codingStats college collegeId batch createdAt lastActiveAt';

const STUDENT_DETAIL_SELECT =
  '-password -otp -otpExpiry';

// Safely compute week-ago date
function weekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

// ── GET /api/faculty/students ─────────────────────────────────────────────────

exports.getStudents = async (req, res) => {
  try {
    const { limit, sort, department, semester } = req.query;

    // Faculty can only see students from their own college
    const collegeId = req.user.collegeId;
    if (!collegeId) {
      return res.status(400).json({
        success: false,
        message: 'No college linked to this faculty account.',
      });
    }

    const filter = { role: 'student', collegeId };
    if (department) filter.department = department;
    if (semester)   filter.semester   = Number(semester);

    const sortField = sort === 'xpPoints'
      ? { xpPoints: -1 }
      : sort === 'name'
        ? { name: 1 }
        : { createdAt: -1 };

    let query = User.find(filter).select(STUDENT_LIST_SELECT).sort(sortField);
    if (limit) query = query.limit(Number(limit));

    const students = await query.lean();

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (err) {
    console.error('[faculty] getStudents error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching students.' });
  }
};

// ── GET /api/faculty/students/:id ─────────────────────────────────────────────

exports.getStudent = async (req, res) => {
  try {
    const collegeId = req.user.collegeId;
    const student = await User.findOne({
      _id:       req.params.id,
      role:      'student',
      collegeId, // scope to same college
    })
      .select(STUDENT_DETAIL_SELECT)
      .populate('collegeId', 'collegeName domain')
      .lean();

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    return res.status(200).json({ success: true, data: student });
  } catch (err) {
    console.error('[faculty] getStudent error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching student.' });
  }
};

// ── GET /api/faculty/stats ────────────────────────────────────────────────────

exports.getStats = async (req, res) => {
  try {
    const collegeId = req.user.collegeId;
    if (!collegeId) {
      return res.status(200).json({
        success: true,
        data: { totalStudents: 0, verifiedStudents: 0, activeThisWeek: 0, avgXP: 0, topDepartments: [] },
      });
    }

    const baseFilter = { role: 'student', collegeId };

    const [total, verified, activeThisWeek, xpAgg, deptAgg] = await Promise.all([
      // total students
      User.countDocuments(baseFilter),

      // verified students
      User.countDocuments({ ...baseFilter, verificationStatus: 'verified' }),

      // active in last 7 days
      User.countDocuments({ ...baseFilter, lastActiveAt: { $gte: weekAgo() } }),

      // average XP
      User.aggregate([
        { $match: { ...baseFilter } },
        { $group: { _id: null, avg: { $avg: '$xpPoints' } } },
      ]),

      // top departments by headcount
      User.aggregate([
        { $match: { ...baseFilter } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort:  { count: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, name: '$_id', count: 1 } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalStudents:    total,
        verifiedStudents: verified,
        activeThisWeek,
        avgXP:            Math.round(xpAgg[0]?.avg ?? 0),
        topDepartments:   deptAgg,
      },
    });
  } catch (err) {
    console.error('[faculty] getStats error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching stats.' });
  }
};

// ── GET /api/faculty/announcements ───────────────────────────────────────────

exports.getAnnouncements = async (req, res) => {
  try {
    // Gracefully handle case where Announcement model doesn't exist yet (Phase 2)
    if (!Announcement || typeof Announcement.find !== 'function') {
      return res.status(200).json({ success: true, data: [] });
    }

    const announcements = await Announcement.find({
      author: req.user._id,
    })
      .sort({ pinned: -1, createdAt: -1 })
      .populate('author', 'name')
      .lean();

    return res.status(200).json({ success: true, data: announcements });
  } catch (err) {
    // If model doesn't exist, just return empty
    return res.status(200).json({ success: true, data: [] });
  }
};

// ── POST /api/faculty/announcements (Phase 2 stub) ───────────────────────────

exports.createAnnouncement = async (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'Announcement creation coming in Phase 2.',
  });
};
