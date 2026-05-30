const User = require('../models/User');
const Skill = require('../models/Skill');
const Goal = require('../models/Goal');
const Project = require('../models/Project');
const { awardXP } = require('../utils/xp');

const cleanHandle = (value = '') => value.trim().replace(/^@/, '');

const getGitHubStats = async (username) => {
  const headers = { 'user-agent': 'SkillSphere' };
  const [profileRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers }),
    fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`, { headers }),
  ]);

  if (profileRes.status === 404) return null;
  if (!profileRes.ok || !reposRes.ok) throw new Error('GitHub did not respond successfully');

  const profile = await profileRes.json();
  const repos = await reposRes.json();
  const publicRepos = Array.isArray(repos) ? repos.filter(repo => !repo.fork) : [];
  const totalStars = publicRepos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  const languages = publicRepos.reduce((acc, repo) => {
    if (repo.language) acc[repo.language] = (acc[repo.language] || 0) + 1;
    return acc;
  }, {});
  const topLanguages = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({ name, count }));

  return {
    username: profile.login,
    avatarUrl: profile.avatar_url,
    profileUrl: profile.html_url,
    publicRepos: profile.public_repos || 0,
    followers: profile.followers || 0,
    following: profile.following || 0,
    totalStars,
    topLanguages,
  };
};

const getLeetCodeStats = async (username) => {
  const query = `
    query userProfile($username: String!) {
      matchedUser(username: $username) {
        username
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
      userContestRanking(username: $username) {
        attendedContestsCount
      }
    }
  `;

  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      referer: 'https://leetcode.com',
    },
    body: JSON.stringify({ query, variables: { username } }),
  });

  if (!response.ok) throw new Error('LeetCode did not respond successfully');
  const body = await response.json();
  const matchedUser = body?.data?.matchedUser;
  if (!matchedUser) return null;

  const counts = matchedUser.submitStatsGlobal?.acSubmissionNum || [];
  const byDifficulty = counts.reduce((acc, item) => {
    acc[item.difficulty] = item.count;
    return acc;
  }, {});

  return {
    username: matchedUser.username,
    leetcodeSolved: byDifficulty.All || 0,
    leetcodeEasy: byDifficulty.Easy || 0,
    leetcodeMedium: byDifficulty.Medium || 0,
    leetcodeHard: byDifficulty.Hard || 0,
    contestsParticipated: body?.data?.userContestRanking?.attendedContestsCount || 0,
  };
};

// ── @route  GET /api/users ────────────────────────────────────────────────────
// ── @access Faculty, Admin
const getAllUsers = async (req, res, next) => {
  try {
    const { dept, role, aspiration, semester, search, page = 1, limit = 20, sort = '-xpPoints' } = req.query;

    const query = { isActive: true };
    if (['faculty', 'college'].includes(req.user.role)) query.collegeId = req.user.collegeId;
    if (dept)        query.department  = dept;
    if (role)        query.role        = role;
    if (aspiration)  query.aspiration  = aspiration;
    if (semester)    query.semester    = Number(semester);
    if (search) {
      query.$or = [
        { name:       { $regex: search, $options: 'i' } },
        { email:      { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

// ── @route  GET /api/users/:id ────────────────────────────────────────────────
// ── @access Private
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Attach skills, goals, projects for full profile
    const [skills, goals, projects] = await Promise.all([
      Skill.find({ user: user._id, isPublic: true }).sort('-level'),
      Goal.find({ user: user._id, isPublic: true, status: 'active' }),
      Project.find({ user: user._id, isPublic: true }).sort('-createdAt'),
    ]);

    res.json({ success: true, data: { user, skills, goals, projects } });
  } catch (err) {
    next(err);
  }
};

// ── @route  PUT /api/users/:id ────────────────────────────────────────────────
// ── @access Private (owner or admin)
const updateUser = async (req, res, next) => {
  try {
    // Fields a user is allowed to update themselves
    const allowed = ['name','bio','phone','semester','cgpa','aspiration',
                     'socialLinks','platformProfiles','resumeUrl','avatar','department','rollNumber','batch','section'];

    // Admin can also update role, isActive, etc.
    if (['admin'].includes(req.user.role)) {
      allowed.push('role', 'isActive', 'designation', 'subjects');
    }

    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true,
    }).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// ── @route  PUT /api/users/:id/coding-stats ───────────────────────────────────
// ── @access Private (owner)
// Manually update coding stats (until API integration is live)
const updateCodingStats = async (req, res, next) => {
  try {
    const { leetcodeSolved, leetcodeEasy, leetcodeMedium, leetcodeHard,
            codeforcesRating, codeforcesMaxRating, githubContributions, githubRepos,
            contestsParticipated } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const prev = user.codingStats.leetcodeSolved || 0;

    Object.assign(user.codingStats, {
      ...(leetcodeSolved        !== undefined && { leetcodeSolved }),
      ...(leetcodeEasy          !== undefined && { leetcodeEasy }),
      ...(leetcodeMedium        !== undefined && { leetcodeMedium }),
      ...(leetcodeHard          !== undefined && { leetcodeHard }),
      ...(codeforcesRating      !== undefined && { codeforcesRating }),
      ...(codeforcesMaxRating   !== undefined && { codeforcesMaxRating }),
      ...(githubContributions   !== undefined && { githubContributions }),
      ...(githubRepos           !== undefined && { githubRepos }),
      ...(contestsParticipated  !== undefined && { contestsParticipated }),
      lastUpdated: new Date(),
    });

    // XP for new problems solved
    const newSolved = (leetcodeSolved || 0) - prev;
    if (newSolved > 0) {
      user.xpPoints += newSolved * 10;
    }

    await user.save();

    // Check for new achievements
    const { checkAchievements } = require('../utils/xp');
    const newAchievements = await checkAchievements(user._id);

    res.json({ success: true, data: user.codingStats, newAchievements });
  } catch (err) {
    next(err);
  }
};

// ── @route  DELETE /api/users/:id ─────────────────────────────────────────────
// ── @access Admin
const importLeetCodeStats = async (req, res, next) => {
  try {
    const username = cleanHandle(req.body.username);
    if (!username) {
      return res.status(400).json({ success: false, message: 'LeetCode username is required' });
    }

    const stats = await getLeetCodeStats(username);
    if (!stats) {
      return res.status(404).json({ success: false, message: 'LeetCode user not found' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const prev = user.codingStats.leetcodeSolved || 0;

    if (!user.platformProfiles) user.platformProfiles = {};
    if (!user.socialLinks) user.socialLinks = {};
    user.platformProfiles.leetcode = stats.username;
    user.socialLinks.leetcode = `https://leetcode.com/${stats.username}`;
    Object.assign(user.codingStats, {
      leetcodeSolved: stats.leetcodeSolved,
      leetcodeEasy: stats.leetcodeEasy,
      leetcodeMedium: stats.leetcodeMedium,
      leetcodeHard: stats.leetcodeHard,
      contestsParticipated: Math.max(user.codingStats.contestsParticipated || 0, stats.contestsParticipated),
      lastUpdated: new Date(),
    });

    const newSolved = stats.leetcodeSolved - prev;
    if (newSolved > 0) user.xpPoints += newSolved * 10;

    await user.save();

    const { checkAchievements } = require('../utils/xp');
    const newAchievements = await checkAchievements(user._id);
    const freshUser = await User.findById(user._id).select('-password');

    res.json({ success: true, data: freshUser, imported: stats, newAchievements });
  } catch (err) {
    next(err);
  }
};

const importGitHubStats = async (req, res, next) => {
  try {
    const username = cleanHandle(req.body.username);
    if (!username) {
      return res.status(400).json({ success: false, message: 'GitHub username is required' });
    }

    const stats = await getGitHubStats(username);
    if (!stats) {
      return res.status(404).json({ success: false, message: 'GitHub user not found' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.platformProfiles) user.platformProfiles = {};
    if (!user.socialLinks) user.socialLinks = {};
    user.platformProfiles.github = stats.username;
    user.socialLinks.github = stats.profileUrl;
    user.codingStats.githubRepos = stats.publicRepos;
    user.codingStats.lastUpdated = new Date();

    await user.save();
    const freshUser = await User.findById(user._id).select('-password');

    res.json({ success: true, data: freshUser, imported: stats });
  } catch (err) {
    next(err);
  }
};

const addCertification = async (req, res, next) => {
  try {
    const { title, provider, credentialId, credentialUrl, issuedAt, expiresAt, notes } = req.body;
    if (!title || !provider) {
      return res.status(400).json({ success: false, message: 'Title and provider are required' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          certifications: {
            title,
            provider,
            credentialId,
            credentialUrl,
            issuedAt: issuedAt || undefined,
            expiresAt: expiresAt || undefined,
            notes,
            fileUrl: req.file ? `/uploads/certifications/${req.file.filename}` : '',
          },
        },
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await awardXP(user._id, 40, 'Added certification');

    const freshUser = await User.findById(user._id).select('-password');
    res.status(201).json({ success: true, data: freshUser });
  } catch (err) {
    next(err);
  }
};

const deleteCertification = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $pull: { certifications: { _id: req.params.certificationId } } },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const addShowcaseItem = async (req, res, next) => {
  try {
    const { title, category, platform, url, description } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Showcase title is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          showcaseItems: {
            title,
            category,
            platform,
            url,
            description,
            fileUrl: req.file ? `/uploads/showcase/${req.file.filename}` : '',
          },
        },
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await awardXP(user._id, 60, 'Added showcase work');

    const freshUser = await User.findById(user._id).select('-password');
    res.status(201).json({ success: true, data: freshUser });
  } catch (err) {
    next(err);
  }
};

const deleteShowcaseItem = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $pull: { showcaseItems: { _id: req.params.showcaseId } } },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (err) {
    next(err);
  }
};

// ── @route  GET /api/users/search/skills ─────────────────────────────────────
// ── @access Faculty, Admin
// Find students who have a specific skill
const searchBySkill = async (req, res, next) => {
  try {
    const { skill, minLevel = 0 } = req.query;
    if (!skill) return res.status(400).json({ success: false, message: 'skill query param required' });

    const skills = await Skill.find({
      name: { $regex: skill, $options: 'i' },
      level: { $gte: Number(minLevel) },
    }).populate('user', 'name email department semester cgpa aspiration avatar rollNumber');

    const results = skills.map(s => ({
      user: s.user,
      skillName: s.name,
      skillLevel: s.level,
      category: s.category,
    }));

    res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateCodingStats,
  importLeetCodeStats,
  importGitHubStats,
  addCertification,
  deleteCertification,
  addShowcaseItem,
  deleteShowcaseItem,
  deleteUser,
  searchBySkill,
};
