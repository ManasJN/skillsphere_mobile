const Opportunity = require('../models/Opportunity');
const User = require('../models/User');
const Skill = require('../models/Skill');
const { Notification } = require('../models/Achievement');

// ── Helper: compute match score for a user ────────────────────────────────────
const computeMatchScore = (user, opportunity, userSkillNames) => {
  let score = 0;
  const req = opportunity.requiredSkills.map(s => s.toLowerCase());
  const pref = opportunity.preferredSkills.map(s => s.toLowerCase());
  const userSkills = userSkillNames.map(s => s.toLowerCase());

  // Skill match (required = 10pts, preferred = 5pts each)
  req.forEach(s  => { if (userSkills.some(us => us.includes(s) || s.includes(us))) score += 10; });
  pref.forEach(s => { if (userSkills.some(us => us.includes(s) || s.includes(us))) score += 5; });

  // Aspiration match
  if (opportunity.suitableFor?.includes(user.aspiration)) score += 15;

  // Department match
  if (opportunity.eligibleDepts?.includes('ALL') || opportunity.eligibleDepts?.includes(user.department)) score += 10;

  // CGPA filter
  if (user.cgpa >= (opportunity.minCGPA || 0)) score += 5;
  if (user.cgpa >= 8.5) score += 5; // bonus for high cgpa

  // Semester range
  const sem = user.semester || 6;
  if (sem >= (opportunity.minSemester || 1) && sem <= (opportunity.maxSemester || 8)) score += 10;

  const maxPossible = req.length * 10 + pref.length * 5 + 45;
  return maxPossible > 0 ? Math.min(100, Math.round((score / maxPossible) * 100)) : 50;
};

// ── @route  GET /api/opportunities ───────────────────────────────────────────
const getOpportunities = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 10, search } = req.query;
    const query = { isActive: true, deadline: { $gte: new Date() } };
    if (type)   query.type = type;
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [opps, total] = await Promise.all([
      Opportunity.find(query).populate('postedBy', 'name').sort('-createdAt').skip(skip).limit(Number(limit)),
      Opportunity.countDocuments(query),
    ]);

    // If student, compute match score
    let data = opps;
    if (req.user.role === 'student') {
      const userSkills = await Skill.find({ user: req.user._id }).select('name');
      const skillNames = userSkills.map(s => s.name);
      data = opps.map(o => ({ ...o.toObject(), matchScore: computeMatchScore(req.user, o, skillNames) }));
      data.sort((a, b) => b.matchScore - a.matchScore);
    }

    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), data });
  } catch (err) { next(err); }
};

// ── @route  GET /api/opportunities/:id ───────────────────────────────────────
const getOpportunity = async (req, res, next) => {
  try {
    const opp = await Opportunity.findById(req.params.id)
      .populate('postedBy', 'name email')
      .populate('applications.user', 'name email department cgpa avatar');
    if (!opp) return res.status(404).json({ success: false, message: 'Opportunity not found' });

    opp.views += 1;
    await opp.save();

    let matchScore = null;
    if (req.user.role === 'student') {
      const userSkills = await Skill.find({ user: req.user._id }).select('name');
      matchScore = computeMatchScore(req.user, opp, userSkills.map(s => s.name));
    }

    res.json({ success: true, data: { ...opp.toObject(), matchScore } });
  } catch (err) { next(err); }
};

// ── @route  POST /api/opportunities ──────────────────────────────────────────
const createOpportunity = async (req, res, next) => {
  try {
    const opp = await Opportunity.create({ ...req.body, postedBy: req.user._id });

    // Notify matching students
    const students = await User.find({ role: 'student', isActive: true })
      .select('_id aspiration department semester cgpa');

    const skillData = await Skill.find({ user: { $in: students.map(s => s._id) } }).select('user name');
    const userSkillMap = {};
    skillData.forEach(sk => {
      if (!userSkillMap[sk.user]) userSkillMap[sk.user] = [];
      userSkillMap[sk.user].push(sk.name);
    });

    const notifTargets = students.filter(s => {
      const score = computeMatchScore(s, opp, userSkillMap[s._id] || []);
      return score >= 60; // Only notify if 60%+ match
    });

    if (notifTargets.length > 0) {
      await Notification.insertMany(notifTargets.map(s => ({
        recipient: s._id,
        type: 'opportunity',
        title: `New Opportunity: ${opp.title}`,
        message: `${opp.company} posted a ${opp.type} that matches your profile. Deadline: ${new Date(opp.deadline).toLocaleDateString()}`,
        icon: '💼',
        color: '#4f46e5',
        linkType: 'opportunity',
        linkId: opp._id,
      })));
    }

    res.status(201).json({ success: true, data: opp, notified: notifTargets.length });
  } catch (err) { next(err); }
};

// ── @route  PUT /api/opportunities/:id ───────────────────────────────────────
const updateOpportunity = async (req, res, next) => {
  try {
    const opp = await Opportunity.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!opp) return res.status(404).json({ success: false, message: 'Opportunity not found' });
    res.json({ success: true, data: opp });
  } catch (err) { next(err); }
};

// ── @route  DELETE /api/opportunities/:id ────────────────────────────────────
const deleteOpportunity = async (req, res, next) => {
  try {
    await Opportunity.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Opportunity removed' });
  } catch (err) { next(err); }
};

// ── @route  POST /api/opportunities/:id/apply ────────────────────────────────
const applyToOpportunity = async (req, res, next) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) return res.status(404).json({ success: false, message: 'Opportunity not found' });
    if (new Date(opp.deadline) < new Date()) {
      return res.status(400).json({ success: false, message: 'Application deadline has passed' });
    }

    const alreadyApplied = opp.applications.some(a => a.user.toString() === req.user._id.toString());
    if (alreadyApplied) return res.status(400).json({ success: false, message: 'Already applied' });

    opp.applications.push({ user: req.user._id });
    await opp.save();

    res.json({ success: true, message: 'Application submitted successfully' });
  } catch (err) { next(err); }
};

// ── @route  GET /api/opportunities/:id/matched-students ──────────────────────
// ── @access Faculty, Admin
const getMatchedStudents = async (req, res, next) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) return res.status(404).json({ success: false, message: 'Opportunity not found' });

    const students = await User.find({ role: 'student', isActive: true });
    const skillData = await Skill.find({ user: { $in: students.map(s => s._id) } }).select('user name level');
    const userSkillMap = {};
    skillData.forEach(sk => {
      if (!userSkillMap[sk.user]) userSkillMap[sk.user] = [];
      userSkillMap[sk.user].push(sk.name);
    });

    const scored = students
      .map(s => ({ student: s, score: computeMatchScore(s, opp, userSkillMap[s._id] || []) }))
      .filter(s => s.score >= 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);

    res.json({ success: true, count: scored.length, data: scored });
  } catch (err) { next(err); }
};

module.exports = {
  getOpportunities, getOpportunity, createOpportunity,
  updateOpportunity, deleteOpportunity, applyToOpportunity, getMatchedStudents,
};
