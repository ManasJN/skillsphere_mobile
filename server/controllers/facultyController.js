/**
 * server/controllers/facultyController.js
 *
 * DEMO MODE (JEC-only):
 *   - collegeId enforcement is removed entirely.
 *   - All faculty accounts can view ALL registered students.
 *   - No college-link requirement. No approval workflow.
 *
 * Phase 2 will re-introduce multi-college isolation.
 */

const User         = require('../models/User');
const Announcement = require('../models/Announcement');

// ── helpers ──────────────────────────────────────────────────────────────────

const STUDENT_LIST_SELECT =
  'name email department semester rollNumber xpPoints level ' +
  'verificationStatus codingStats college collegeId batch createdAt lastActiveAt';

const STUDENT_DETAIL_SELECT = '-password -otp -otpExpiry';

function weekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

// ── GET /api/faculty/students ─────────────────────────────────────────────────

exports.getStudents = async (req, res) => {
  try {
    const { limit, sort, department, semester } = req.query;

    // DEMO: no collegeId filter — faculty sees all students
    const filter = { role: 'student' };
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
    // DEMO: no collegeId scope — any student can be viewed
    const student = await User.findOne({
      _id:  req.params.id,
      role: 'student',
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
    // DEMO: stats across ALL students, no college filter
    const baseFilter = { role: 'student' };

    const [total, verified, activeThisWeek, xpAgg, deptAgg] = await Promise.all([
      User.countDocuments(baseFilter),
      User.countDocuments({ ...baseFilter, verificationStatus: 'verified' }),
      User.countDocuments({ ...baseFilter, lastActiveAt: { $gte: weekAgo() } }),
      User.aggregate([
        { $match: baseFilter },
        { $group: { _id: null, avg: { $avg: '$xpPoints' } } },
      ]),
      User.aggregate([
        { $match: baseFilter },
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
    if (!Announcement || typeof Announcement.find !== 'function') {
      return res.status(200).json({ success: true, data: [] });
    }

    const announcements = await Announcement.find({ author: req.user._id })
      .sort({ pinned: -1, createdAt: -1 })
      .populate('author', 'name')
      .lean();

    return res.status(200).json({ success: true, data: announcements });
  } catch (err) {
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
