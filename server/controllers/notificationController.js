const { Notification, AchievementDef, UserAchievement } = require('../models/Achievement');

// ═══════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

// ── @route  GET /api/notifications ───────────────────────────────────────────
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const query = { recipient: req.user._id };
    if (unread === 'true') query.isRead = false;

    const skip = (Number(page) - 1) * Number(limit);
    const [notifs, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('sender', 'name avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    res.json({ success: true, total, unreadCount, page: Number(page), data: notifs });
  } catch (err) { next(err); }
};

// ── @route  PUT /api/notifications/:id/read ──────────────────────────────────
const markRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) { next(err); }
};

// ── @route  PUT /api/notifications/mark-all-read ─────────────────────────────
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
};

// ── @route  DELETE /api/notifications/:id ────────────────────────────────────
const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) { next(err); }
};

// ── @route  POST /api/notifications/broadcast ────────────────────────────────
// ── @access Faculty, Admin — send announcement to students
const broadcast = async (req, res, next) => {
  try {
    const { title, message, dept, icon = '📢', color = '#4f46e5' } = req.body;
    const User = require('../models/User');

    const query = { role: 'student', isActive: true };
    if (['faculty', 'college'].includes(req.user.role)) {
      query.collegeId = req.user.collegeId;
      query.verificationStatus = 'verified';
    }
    if (dept && dept !== 'ALL') query.department = dept;

    const students = await User.find(query).select('_id');
    if (!students.length) {
      return res.status(404).json({ success: false, message: 'No students found for target department' });
    }

    await Notification.insertMany(students.map(s => ({
      recipient: s._id,
      sender: req.user._id,
      type: 'announcement',
      title,
      message,
      icon,
      color,
    })));

    res.json({ success: true, message: `Broadcast sent to ${students.length} students` });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════
//  ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════

// ── @route  GET /api/achievements ────────────────────────────────────────────
// All achievement definitions (the catalog)
const getAllAchievements = async (req, res, next) => {
  try {
    const defs = await AchievementDef.find().sort('category rarity');
    res.json({ success: true, count: defs.length, data: defs });
  } catch (err) { next(err); }
};

// ── @route  GET /api/achievements/my ─────────────────────────────────────────
// Current user's earned achievements
const getMyAchievements = async (req, res, next) => {
  try {
    const earned = await UserAchievement.find({ user: req.user._id })
      .populate('achievement')
      .sort('-earnedAt');

    // Mark unseen as seen
    await UserAchievement.updateMany(
      { user: req.user._id, seen: false },
      { seen: true }
    );

    res.json({ success: true, count: earned.length, data: earned });
  } catch (err) { next(err); }
};

// ── @route  GET /api/achievements/user/:userId ────────────────────────────────
const getUserAchievements = async (req, res, next) => {
  try {
    const earned = await UserAchievement.find({ user: req.params.userId })
      .populate('achievement')
      .sort('-earnedAt');
    res.json({ success: true, count: earned.length, data: earned });
  } catch (err) { next(err); }
};

// ── @route  POST /api/achievements (admin: create definition) ─────────────────
const createAchievementDef = async (req, res, next) => {
  try {
    const def = await AchievementDef.create(req.body);
    res.status(201).json({ success: true, data: def });
  } catch (err) { next(err); }
};

module.exports = {
  getNotifications, markRead, markAllRead, deleteNotification, broadcast,
  getAllAchievements, getMyAchievements, getUserAchievements, createAchievementDef,
};
