const User = require('../models/User');
const { Notification } = require('../models/Achievement');

/**
 * Award XP to a user and handle level-up notifications
 */
const awardXP = async (userId, amount, reason = '') => {
  const user = await User.findById(userId);
  if (!user) return null;

  const prevLevel = user.level;
  user.xpPoints += amount;
  // level is recalculated in pre-save hook
  await user.save();

  // Level-up notification
  if (user.level > prevLevel) {
    await Notification.create({
      recipient: userId,
      type: 'achievement',
      title: `Level Up! You're now Level ${user.level} 🎉`,
      message: `You reached Level ${user.level} with ${user.xpPoints} XP. Keep pushing!`,
      icon: '⭐',
      color: '#f59e0b',
    });
  }

  return { xpAdded: amount, totalXP: user.xpPoints, level: user.level, leveledUp: user.level > prevLevel };
};

/**
 * Check and award achievements based on current user stats.
 * Called after major events (solve problem, complete goal, etc.)
 */
const checkAchievements = async (userId) => {
  const { AchievementDef, UserAchievement } = require('../models/Achievement');
  const user = await User.findById(userId);
  if (!user) return;

  const earned = await UserAchievement.find({ user: userId }).select('achievement');
  const earnedIds = new Set(earned.map(e => e.achievement.toString()));

  const defs = await AchievementDef.find();
  const newlyEarned = [];

  for (const def of defs) {
    if (earnedIds.has(def._id.toString())) continue;
    if (!def.condition) continue;

    // Navigate nested field path (e.g. "codingStats.leetcodeSolved")
    const fieldValue = def.condition.field.split('.').reduce((obj, key) => obj?.[key], user);
    if (fieldValue === undefined || fieldValue === null) continue;

    let conditionMet = false;
    if (def.condition.operator === 'gte') conditionMet = fieldValue >= def.condition.value;
    else if (def.condition.operator === 'lte') conditionMet = fieldValue <= def.condition.value;
    else if (def.condition.operator === 'eq')  conditionMet = fieldValue === def.condition.value;

    if (conditionMet) {
      await UserAchievement.create({ user: userId, achievement: def._id });
      await awardXP(userId, def.xpReward, `Achievement: ${def.title}`);
      await Notification.create({
        recipient: userId,
        type: 'achievement',
        title: `Achievement Unlocked: ${def.title} ${def.icon}`,
        message: def.description,
        icon: def.icon,
        color: '#f59e0b',
      });
      newlyEarned.push(def);
    }
  }
  return newlyEarned;
};

/**
 * Update streak (call daily when user is active)
 */
const updateStreak = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const now = new Date();
  const last = user.lastActiveAt;
  const diffHours = last ? (now - last) / 3600000 : Infinity;

  if (diffHours < 24) {
    // Already active today — do nothing
  } else if (diffHours < 48) {
    // Active yesterday — extend streak
    user.streakDays += 1;
    await awardXP(userId, 10 * user.streakDays, 'Daily streak');
  } else {
    // Streak broken
    user.streakDays = 1;
  }

  user.lastActiveAt = now;
  await user.save();
  return user.streakDays;
};

module.exports = { awardXP, checkAchievements, updateStreak };
