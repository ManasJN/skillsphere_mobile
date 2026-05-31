const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Sub-schemas ────────────────────────────────────────────────────────────────
const socialLinksSchema = new mongoose.Schema({
  linkedin:   { type: String, default: '' },
  github:     { type: String, default: '' },
  leetcode:   { type: String, default: '' },
  codeforces: { type: String, default: '' },
  portfolio:  { type: String, default: '' },
}, { _id: false });

const platformProfilesSchema = new mongoose.Schema({
  leetcode:       { type: String, default: '' },
  github:         { type: String, default: '' },
  hackerrank:     { type: String, default: '' },
  codeforces:     { type: String, default: '' },
  codechef:       { type: String, default: '' },
  geeksforgeeks:  { type: String, default: '' },
}, { _id: false });

const certificationSchema = new mongoose.Schema({
  title:         { type: String, required: true, trim: true, maxlength: 160 },
  provider:      { type: String, required: true, trim: true, maxlength: 100 },
  credentialId:  { type: String, default: '', trim: true, maxlength: 120 },
  credentialUrl: { type: String, default: '', trim: true },
  issuedAt:      { type: Date },
  expiresAt:     { type: Date },
  fileUrl:       { type: String, default: '' },
  notes:         { type: String, default: '', maxlength: 300 },
}, { timestamps: true });

const showcaseItemSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true, maxlength: 160 },
  category:    { type: String, enum: ['coding', 'cad', 'design', 'research', 'other'], default: 'other' },
  platform:    { type: String, default: '', trim: true, maxlength: 80 },
  url:         { type: String, default: '', trim: true },
  fileUrl:     { type: String, default: '' },
  description: { type: String, default: '', maxlength: 400 },
}, { timestamps: true });

const codingStatsSchema = new mongoose.Schema({
  leetcodeSolved:    { type: Number, default: 0 },
  leetcodeEasy:      { type: Number, default: 0 },
  leetcodeMedium:    { type: Number, default: 0 },
  leetcodeHard:      { type: Number, default: 0 },
  codeforcesRating:  { type: Number, default: 0 },
  codeforcesMaxRating: { type: Number, default: 0 },
  githubContributions: { type: Number, default: 0 },
  githubRepos:       { type: Number, default: 0 },
  contestsParticipated: { type: Number, default: 0 },
  lastUpdated:       { type: Date, default: Date.now },
}, { _id: false });

// ── Main User Schema ───────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  // ── Identity ────────────────────────────────────────────────────────────────
  name:       { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
  email:      { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true,
                match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please enter a valid email'] },
  password:   { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
  role:       { type: String, enum: ['student', 'faculty', 'college', 'admin'], default: 'student' },
  avatar:     { type: String, default: '' },
  verificationStatus: {
    type: String,
    enum: ['unsubmitted', 'pending', 'verified', 'rejected'],
    default: 'unsubmitted',
  },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null },
  idProofUrl: { type: String, default: '' },
  admissionProofUrl: { type: String, default: '' },
  verificationNotes: { type: String, default: '' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  verifiedAt: { type: Date, default: null },

  // ── Academic (Students) ──────────────────────────────────────────────────────
  department: { type: String, enum: ['CSE', 'MECH', 'CIVIL', 'INSTRUMENTATION', 'ELECTRICAL', 'ELECTRONICS', 'CHEMICAL', 'OTHER'], default: 'CSE' },
  semester:   { type: Number, min: 1, max: 8 },
  rollNumber: { type: String, unique: true, sparse: true },
  cgpa:       { type: Number, min: 0, max: 10, default: 0 },
  batch:      { type: String }, // e.g. "2021-2025"
  section:    { type: String },

  // ── Profile ──────────────────────────────────────────────────────────────────
  bio:        { type: String, maxlength: 500, default: '' },
  phone:      { type: String },
  resumeUrl:  { type: String, default: '' },
  socialLinks: { type: socialLinksSchema, default: () => ({}) },
  platformProfiles: { type: platformProfilesSchema, default: () => ({}) },
  certifications:   { type: [certificationSchema], default: [] },
  showcaseItems:    { type: [showcaseItemSchema], default: [] },

  // ── Aspiration ───────────────────────────────────────────────────────────────
  aspiration: {
    type: String,
    enum: ['Placements', 'GATE', 'Higher Studies', 'Startup', 'Research', 'Government', 'Freelancing', 'Not decided'],
    default: 'Not decided',
  },

  // ── Gamification ─────────────────────────────────────────────────────────────
  xpPoints:     { type: Number, default: 0 },
  level:        { type: Number, default: 1 },
  streakDays:   { type: Number, default: 0 },
  lastActiveAt: { type: Date, default: Date.now },

  // ── Coding Stats ─────────────────────────────────────────────────────────────
  codingStats: { type: codingStatsSchema, default: () => ({}) },

// ── Meta ─────────────────────────────────────────────────────────────────────
isActive:    { type: Boolean, default: true },

isVerified:  { 
  type: Boolean, 
  default: false 
},

otp: {
  type: String,
  default: null
},

otpExpiry: {
  type: Date,
  default: null
},

college:     { type: String, default: '' },

joinedAt:    { 
  type: Date, 
  default: Date.now 
},

  // ── Faculty specific ─────────────────────────────────────────────────────────
  designation: { type: String }, // "Assistant Professor", "HOD" etc.
  subjects:    [{ type: String }],
  mentoring:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // students under mentorship

}, { timestamps: true });

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ role: 1, department: 1 });
userSchema.index({ collegeId: 1, verificationStatus: 1 });
userSchema.index({ xpPoints: -1 });
userSchema.index({ 'codingStats.leetcodeSolved': -1 });

// ── Pre-save: hash password ───────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Pre-save: auto-calculate XP level ────────────────────────────────────────
userSchema.pre('save', function (next) {
  // Level thresholds: level n requires n*500 XP
  this.level = Math.floor(this.xpPoints / 500) + 1;
  next();
});

// ── Instance Methods ──────────────────────────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// ── Virtual: full coding score (for leaderboard) ──────────────────────────────
userSchema.virtual('codingScore').get(function () {
  const s = this.codingStats;
  if (!s) return 0;
  return (
    (s.leetcodeSolved        || 0) * 10 +
    Math.floor((s.codeforcesRating  || 0) / 10) +
    (s.githubContributions   || 0) * 2
  );
});

userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);