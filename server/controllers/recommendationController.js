const CareerProfile = require('../models/CareerProfile');
const Recommendation = require('../models/Recommendation');
const Skill = require('../models/Skill');
const Goal = require('../models/Goal');
const Project = require('../models/Project');
const User = require('../models/User');
const { generateRecommendations } = require('../services/recommendationEngine');

const getProfile = async (req, res, next) => {
  try {
    const profile = await CareerProfile.findOne({ user: req.user._id });
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

const saveProfile = async (req, res, next) => {
  try {
    const {
      interests = [],
      preferredDomain,
      learningGoals = [],
      weakAreas = [],
      academicFocus,
      additionalNotes,
    } = req.body;

    const profile = await CareerProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        interests,
        preferredDomain,
        learningGoals,
        weakAreas,
        academicFocus,
        additionalNotes,
        lastSubmittedAt: new Date(),
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, data: profile, message: 'Career profile saved' });
  } catch (err) {
    next(err);
  }
};

const generate = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let profile = await CareerProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await CareerProfile.create({
        user: req.user._id,
        preferredDomain: 'Web Development',
        interests: [],
        learningGoals: [],
        weakAreas: [],
      });
    }

    const [skills, goals, projects] = await Promise.all([
      Skill.find({ user: req.user._id }),
      Goal.find({ user: req.user._id }),
      Project.find({ user: req.user._id }),
    ]);

    const payload = generateRecommendations({
      user: user.toObject(),
      profile: profile.toObject(),
      skills,
      goals,
      projects,
    });

    const recommendation = await Recommendation.create({
      user: req.user._id,
      ...payload,
    });

    res.status(201).json({ success: true, data: recommendation });
  } catch (err) {
    next(err);
  }
};

const getLatest = async (req, res, next) => {
  try {
    const latest = await Recommendation.findOne({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: latest });
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);
    const history = await Recommendation.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('summary createdAt engineVersion profileSnapshot');

    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const rec = await Recommendation.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!rec) {
      return res.status(404).json({ success: false, message: 'Recommendation not found' });
    }
    res.json({ success: true, data: rec });
  } catch (err) {
    next(err);
  }
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const [profile, latest] = await Promise.all([
      CareerProfile.findOne({ user: req.user._id }),
      Recommendation.findOne({ user: req.user._id }).sort({ createdAt: -1 }),
    ]);

    if (!latest) {
      return res.json({
        success: true,
        data: {
          hasRecommendations: false,
          profileComplete: Boolean(profile?.lastSubmittedAt),
          preferredDomain: profile?.preferredDomain,
        },
      });
    }

    res.json({
      success: true,
      data: {
        hasRecommendations: true,
        profileComplete: Boolean(profile?.lastSubmittedAt),
        preferredDomain: profile?.preferredDomain,
        latestId: latest._id,
        summary: latest.summary,
        createdAt: latest.createdAt,
        topPriorities: (latest.priorityAreas || []).slice(0, 3),
        nextSkill: (latest.skillsToImprove || [])[0],
        roadmapPhase: (latest.roadmap || [])[0],
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  saveProfile,
  generate,
  getLatest,
  getHistory,
  getById,
  getDashboardSummary,
};
