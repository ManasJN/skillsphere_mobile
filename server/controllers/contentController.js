const Skill = require('../models/Skill');
const Goal = require('../models/Goal');
const Project = require('../models/Project');
const { awardXP, checkAchievements } = require('../utils/xp');

// ═══════════════════════════════════════════════════════════
//  SKILLS
// ═══════════════════════════════════════════════════════════

const getSkills = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;
    const skills = await Skill.find({ user: userId }).sort('-level');
    res.json({ success: true, count: skills.length, data: skills });
  } catch (err) { next(err); }
};

const createSkill = async (req, res, next) => {
  try {
    const skill = await Skill.create({ ...req.body, user: req.user._id });
    // Award XP for adding a skill
    await awardXP(req.user._id, 50, 'Added new skill');
    res.status(201).json({ success: true, data: skill });
  } catch (err) { next(err); }
};

const updateSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findOne({ _id: req.params.id, user: req.user._id });
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });

    const prevLevel = skill.level;
    Object.assign(skill, req.body);

    // Mark completed if reached target
    if (skill.level >= 100 && !skill.completedAt) {
      skill.completedAt = new Date();
      await awardXP(req.user._id, skill.xpReward, `Completed skill: ${skill.name}`);
      await checkAchievements(req.user._id);
    } else if (skill.level > prevLevel) {
      // Award smaller XP for progress
      await awardXP(req.user._id, (skill.level - prevLevel) * 2, `Skill progress: ${skill.name}`);
    }

    await skill.save();
    res.json({ success: true, data: skill });
  } catch (err) { next(err); }
};

const deleteSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
    res.json({ success: true, message: 'Skill deleted' });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════
//  GOALS
// ═══════════════════════════════════════════════════════════

const getGoals = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;
    const { status, type } = req.query;
    const query = { user: userId };
    if (status) query.status = status;
    if (type)   query.type = type;
    const goals = await Goal.find(query).sort('-createdAt');
    res.json({ success: true, count: goals.length, data: goals });
  } catch (err) { next(err); }
};

const createGoal = async (req, res, next) => {
  try {
    const goal = await Goal.create({ ...req.body, user: req.user._id });
    await awardXP(req.user._id, 30, 'Set new goal');
    res.status(201).json({ success: true, data: goal });
  } catch (err) { next(err); }
};

const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    const wasActive = goal.status === 'active';
    Object.assign(goal, req.body);
    await goal.save(); // pre-save hook handles progress and auto-complete

    if (wasActive && goal.status === 'completed') {
      await awardXP(req.user._id, goal.xpReward, `Completed goal: ${goal.title}`);
      await checkAchievements(req.user._id);
    }

    res.json({ success: true, data: goal });
  } catch (err) { next(err); }
};

const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    res.json({ success: true, message: 'Goal deleted' });
  } catch (err) { next(err); }
};

// ── Toggle milestone ──────────────────────────────────────────────────────────
const toggleMilestone = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    const milestone = goal.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

    milestone.isCompleted = !milestone.isCompleted;
    milestone.completedAt = milestone.isCompleted ? new Date() : undefined;

    // Recalculate progress from milestones
    const total = goal.milestones.length;
    const done  = goal.milestones.filter(m => m.isCompleted).length;
    goal.currentValue = done;
    goal.targetValue  = total;

    await goal.save();
    if (milestone.isCompleted) await awardXP(req.user._id, 25, 'Milestone completed');

    res.json({ success: true, data: goal });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════
//  PROJECTS
// ═══════════════════════════════════════════════════════════

const getProjects = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;
    const { status } = req.query;
    const query = { user: userId };
    if (status) query.status = status;
    const projects = await Project.find(query)
      .populate('collaborators', 'name avatar department')
      .sort('-createdAt');
    res.json({ success: true, count: projects.length, data: projects });
  } catch (err) { next(err); }
};

const createProject = async (req, res, next) => {
  try {
    const project = await Project.create({ ...req.body, user: req.user._id });
    await awardXP(req.user._id, 100, 'Added new project');
    res.status(201).json({ success: true, data: project });
  } catch (err) { next(err); }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const wasOngoing = project.status !== 'completed';
    Object.assign(project, req.body);
    await project.save();

    if (wasOngoing && project.status === 'completed') {
      await awardXP(req.user._id, project.xpReward, `Completed project: ${project.title}`);
      await checkAchievements(req.user._id);
    }

    res.json({ success: true, data: project });
  } catch (err) { next(err); }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) { next(err); }
};

// Like / unlike a project
const toggleProjectLike = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const userId = req.user._id.toString();
    const liked  = project.likes.map(l => l.toString()).includes(userId);

    if (liked) project.likes.pull(req.user._id);
    else       project.likes.push(req.user._id);

    await project.save();
    res.json({ success: true, liked: !liked, likeCount: project.likes.length });
  } catch (err) { next(err); }
};

module.exports = {
  getSkills, createSkill, updateSkill, deleteSkill,
  getGoals, createGoal, updateGoal, deleteGoal, toggleMilestone,
  getProjects, createProject, updateProject, deleteProject, toggleProjectLike,
};
