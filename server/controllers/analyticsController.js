const User = require('../models/User');
const Skill = require('../models/Skill');
const Goal = require('../models/Goal');
const Project = require('../models/Project');
const Opportunity = require('../models/Opportunity');

// ═══════════════════════════════════════════════════════════
//  LEADERBOARD CONTROLLER
// ═══════════════════════════════════════════════════════════

// ── @route  GET /api/leaderboard ─────────────────────────────────────────────
// ── @access Private
const getLeaderboard = async (req, res, next) => {
  try {
    const { type = 'xp', dept, limit = 20 } = req.query;

    const match = { role: 'student', isActive: true };
    if (dept && dept !== 'ALL') match.department = dept;

    let sortField = '-xpPoints';
    if (type === 'cgpa')    sortField = '-cgpa';
    if (type === 'leetcode') sortField = '-codingStats.leetcodeSolved';
    if (type === 'codeforces') sortField = '-codingStats.codeforcesRating';
    if (type === 'github')  sortField = '-codingStats.githubContributions';

    const users = await User.find(match)
      .select('name email department semester cgpa xpPoints level streakDays aspiration avatar codingStats')
      .sort(sortField)
      .limit(Number(limit))
      .lean();

    // Add rank and coding score
    const data = users.map((u, i) => ({
      ...u,
      rank: i + 1,
      codingScore: (u.codingStats?.leetcodeSolved || 0) * 10
        + Math.floor((u.codingStats?.codeforcesRating || 0) / 10)
        + (u.codingStats?.githubContributions || 0) * 2,
    }));

    // Caller's own rank (if student)
    let myRank = null;
    if (req.user.role === 'student') {
      const allUsers = await User.find(match).select('_id').sort(sortField).lean();
      myRank = allUsers.findIndex(u => u._id.toString() === req.user._id.toString()) + 1;
    }

    res.json({ success: true, count: data.length, myRank, data });
  } catch (err) { next(err); }
};

// ── @route  GET /api/leaderboard/department-summary ──────────────────────────
// ── @access Faculty, Admin
const getDeptSummary = async (req, res, next) => {
  try {
    const depts = ['CSE', 'MECH', 'CIVIL', 'INSTRUMENTATION', 'ELECTRICAL', 'ELECTRONICS', 'CHEMICAL', 'OTHER'];
    const summary = await Promise.all(depts.map(async dept => {
      const students = await User.find({ role: 'student', department: dept, isActive: true })
        .select('cgpa xpPoints codingStats');
      if (!students.length) return null;

      const avgCgpa   = (students.reduce((s, u) => s + (u.cgpa || 0), 0) / students.length).toFixed(2);
      const avgXP     = Math.round(students.reduce((s, u) => s + (u.xpPoints || 0), 0) / students.length);
      const avgLC     = Math.round(students.reduce((s, u) => s + (u.codingStats?.leetcodeSolved || 0), 0) / students.length);
      const active    = students.filter(u => u.xpPoints > 100).length;

      return { dept, total: students.length, avgCgpa, avgXP, avgLC, active };
    }));

    res.json({ success: true, data: summary.filter(Boolean) });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════
//  ANALYTICS CONTROLLER
// ═══════════════════════════════════════════════════════════

// ── @route  GET /api/analytics/overview ──────────────────────────────────────
// ── @access Faculty, Admin
const getOverview = async (req, res, next) => {
  try {
    const [
      totalStudents,
      activeStudents,
      totalSkills,
      totalProjects,
      totalGoals,
      completedGoals,
      totalOpportunities,
    ] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'student', isActive: true, xpPoints: { $gt: 0 } }),
      Skill.countDocuments(),
      Project.countDocuments(),
      Goal.countDocuments({ status: { $in: ['active', 'completed'] } }),
      Goal.countDocuments({ status: 'completed' }),
      Opportunity.countDocuments({ isActive: true }),
    ]);

    res.json({
      success: true,
      data: {
        totalStudents, activeStudents,
        totalSkills, totalProjects,
        totalGoals, completedGoals,
        goalCompletionRate: totalGoals ? Math.round((completedGoals / totalGoals) * 100) : 0,
        totalOpportunities,
      },
    });
  } catch (err) { next(err); }
};

// ── @route  GET /api/analytics/skills-distribution ───────────────────────────
const getSkillsDistribution = async (req, res, next) => {
  try {
    const dist = await Skill.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, avgLevel: { $avg: '$level' } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, data: dist });
  } catch (err) { next(err); }
};

// ── @route  GET /api/analytics/aspirations ───────────────────────────────────
const getAspirations = async (req, res, next) => {
  try {
    const { dept } = req.query;
    const match = { role: 'student', isActive: true };
    if (dept) match.department = dept;

    const data = await User.aggregate([
      { $match: match },
      { $group: { _id: '$aspiration', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const total = data.reduce((sum, d) => sum + d.count, 0);
    const result = data.map(d => ({
      aspiration: d._id,
      count: d.count,
      percentage: Math.round((d.count / total) * 100),
    }));

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// ── @route  GET /api/analytics/coding-activity ───────────────────────────────
const getCodingActivity = async (req, res, next) => {
  try {
    const { dept } = req.query;
    const match = { role: 'student', isActive: true };
    if (dept) match.department = dept;

    const stats = await User.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalLCSolved:     { $sum: '$codingStats.leetcodeSolved' },
          avgLCSolved:       { $avg: '$codingStats.leetcodeSolved' },
          avgCFRating:       { $avg: '$codingStats.codeforcesRating' },
          totalGHContrib:    { $sum: '$codingStats.githubContributions' },
          studentsOnLC:      { $sum: { $cond: [{ $gt: ['$codingStats.leetcodeSolved', 0] }, 1, 0] } },
          studentsOnCF:      { $sum: { $cond: [{ $gt: ['$codingStats.codeforcesRating', 0] }, 1, 0] } },
        },
      },
    ]);

    // Rating distribution buckets
    const ratingBuckets = await User.aggregate([
      { $match: { ...match, 'codingStats.codeforcesRating': { $gt: 0 } } },
      {
        $bucket: {
          groupBy: '$codingStats.codeforcesRating',
          boundaries: [0, 1000, 1200, 1400, 1600, 1900, 2100, 2400, 3000],
          default: 'Other',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    res.json({ success: true, data: { summary: stats[0] || {}, ratingBuckets } });
  } catch (err) { next(err); }
};

// ── @route  GET /api/analytics/placement-readiness ───────────────────────────
const getPlacementReadiness = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student', isActive: true })
      .select('cgpa codingStats department xpPoints aspiration');

    // Readiness score = weighted formula
    const scored = students.map(s => {
      const cgpaScore  = Math.min(100, (s.cgpa / 10) * 100) * 0.3;
      const lcScore    = Math.min(100, (s.codingStats?.leetcodeSolved || 0) / 3) * 0.3;
      const cfScore    = Math.min(100, (s.codingStats?.codeforcesRating || 0) / 20) * 0.2;
      const xpScore    = Math.min(100, (s.xpPoints || 0) / 100) * 0.2;
      return { ...s.toObject(), readinessScore: Math.round(cgpaScore + lcScore + cfScore + xpScore) };
    });

    const buckets = { excellent: 0, good: 0, average: 0, needsWork: 0 };
    scored.forEach(s => {
      if (s.readinessScore >= 80)      buckets.excellent++;
      else if (s.readinessScore >= 60) buckets.good++;
      else if (s.readinessScore >= 40) buckets.average++;
      else                             buckets.needsWork++;
    });

    const avgReadiness = Math.round(scored.reduce((sum, s) => sum + s.readinessScore, 0) / (scored.length || 1));

    res.json({ success: true, data: { avgReadiness, buckets, total: students.length } });
  } catch (err) { next(err); }
};

// ── @route  GET /api/analytics/my-stats ──────────────────────────────────────
// ── @access Student (own analytics)
const getMyStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const [skills, goals, projects] = await Promise.all([
      Skill.find({ user: userId }),
      Goal.find({ user: userId }),
      Project.find({ user: userId }),
    ]);

    const skillAvg = skills.length
      ? Math.round(skills.reduce((s, sk) => s + sk.level, 0) / skills.length)
      : 0;

    const goalCompletion = goals.length
      ? Math.round((goals.filter(g => g.status === 'completed').length / goals.length) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalSkills: skills.length,
        avgSkillLevel: skillAvg,
        skillsByCategory: skills.reduce((acc, sk) => {
          acc[sk.category] = (acc[sk.category] || 0) + 1; return acc;
        }, {}),
        totalGoals: goals.length,
        activeGoals: goals.filter(g => g.status === 'active').length,
        completedGoals: goals.filter(g => g.status === 'completed').length,
        goalCompletionRate: goalCompletion,
        totalProjects: projects.length,
        completedProjects: projects.filter(p => p.status === 'completed').length,
        ongoingProjects: projects.filter(p => p.status === 'ongoing').length,
        xpPoints: req.user.xpPoints,
        level: req.user.level,
        streakDays: req.user.streakDays,
      },
    });
  } catch (err) { next(err); }
};

module.exports = {
  getLeaderboard, getDeptSummary,
  getOverview, getSkillsDistribution, getAspirations,
  getCodingActivity, getPlacementReadiness, getMyStats,
};
