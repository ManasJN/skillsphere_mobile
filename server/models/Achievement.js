const mongoose = require('mongoose');

// ── Achievement Definition (global catalog) ────────────────────────────────────
const achievementDefSchema = new mongoose.Schema({
  key:         { type: String, required: true, unique: true }, // e.g. 'lc_100'
  title:       { type: String, required: true },
  description: { type: String, required: true },
  icon:        { type: String, default: '🏅' },
  category:    { type: String, enum: ['coding', 'skills', 'goals', 'projects', 'social', 'streak', 'special'] },
  xpReward:    { type: Number, default: 100 },
  rarity:      { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
  // Condition for auto-award
  condition: {
    field:     String, // e.g. 'codingStats.leetcodeSolved'
    operator:  { type: String, enum: ['gte', 'lte', 'eq'] },
    value:     Number,
  },
}, { timestamps: true });

// ── User Achievement (earned instances) ──────────────────────────────────────
const userAchievementSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  achievement: { type: mongoose.Schema.Types.ObjectId, ref: 'AchievementDef', required: true },
  earnedAt:    { type: Date, default: Date.now },
  seen:        { type: Boolean, default: false },
}, { timestamps: false });

userAchievementSchema.index({ user: 1 });
userAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true }); // no duplicates

// ── Notification ──────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  recipient:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null = system

  type: {
    type: String,
    enum: ['opportunity', 'achievement', 'deadline', 'announcement', 'mention', 'system'],
    required: true,
  },

  title:   { type: String, required: true },
  message: { type: String, required: true },
  icon:    { type: String, default: '🔔' },
  color:   { type: String, default: '#4f46e5' },

  // Deep link
  linkType: { type: String, enum: ['opportunity', 'goal', 'project', 'profile', 'leaderboard', 'none'] },
  linkId:   { type: mongoose.Schema.Types.ObjectId },

  isRead:   { type: Boolean, default: false },
  readAt:   { type: Date },

}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = {
  AchievementDef:   mongoose.model('AchievementDef', achievementDefSchema),
  UserAchievement:  mongoose.model('UserAchievement', userAchievementSchema),
  Notification:     mongoose.model('Notification', notificationSchema),
};
