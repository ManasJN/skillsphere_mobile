/**
 * server/controllers/facultyController.js
 *
 * DEMO MODE (JEC-only):
 *   - collegeId enforcement removed. All faculty see all students.
 *   - Announcements are shared ecosystem-wide (no college filter).
 *   - Phase 2 will re-introduce multi-college isolation.
 */

const User         = require('../models/User');
const Announcement = require('../models/Announcement');
const Skill        = require('../models/Skill');
const Project      = require('../models/Project');
const Goal         = require('../models/Goal');
const { UserAchievement } = require('../models/Achievement');

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
    const student = await User.findOne({ _id: req.params.id, role: 'student' })
      .select(STUDENT_DETAIL_SELECT)
      .populate('collegeId', 'collegeName domain')
      .lean();

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const [skills, projects, goals, achievements, studentsAhead] = await Promise.all([
      Skill.find({ user: student._id }).sort('-level').lean(),
      Project.find({ user: student._id }).sort('-createdAt').lean(),
      Goal.find({ user: student._id }).sort('-createdAt').lean(),
      UserAchievement.find({ user: student._id })
        .populate('achievement')
        .sort('-earnedAt')
        .lean(),
      User.countDocuments({
        role: 'student',
        xpPoints: { $gt: student.xpPoints || 0 },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        ...student,
        skills,
        projects,
        goals,
        achievements,
        leaderboardRank: studentsAhead + 1,
      },
    });
  } catch (err) {
    console.error('[faculty] getStudent error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching student.' });
  }
};

// ── GET /api/faculty/stats ────────────────────────────────────────────────────

exports.getStats = async (req, res) => {
  try {
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
// Returns all announcements posted by this faculty member, newest first.

exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({
      createdBy: req.user._id,
      isPublished: true,
    })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name')
      .lean();

    return res.status(200).json({ success: true, data: announcements });
  } catch (err) {
    console.error('[faculty] getAnnouncements error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching announcements.' });
  }
};

// ── POST /api/faculty/announcements ──────────────────────────────────────────
// Create a new shared announcement visible to all students.

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required.' });
    }

    const VALID_CATEGORIES = ['Academic', 'Internship', 'Event', 'Hackathon', 'Workshop', 'General'];
    const resolvedCategory = VALID_CATEGORIES.includes(category) ? category : 'General';

    const announcement = await Announcement.create({
      title:       title.trim(),
      description: description.trim(),
      category:    resolvedCategory,
      createdBy:   req.user._id,
    });

    // Populate createdBy for the response
    await announcement.populate('createdBy', 'name');

    return res.status(201).json({ success: true, data: announcement });
  } catch (err) {
    console.error('[faculty] createAnnouncement error:', err);
    return res.status(500).json({ success: false, message: 'Server error creating announcement.' });
  }
};
