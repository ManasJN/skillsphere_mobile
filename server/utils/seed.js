/**
 * SkillSphere – Database Seeder
 * Run: node utils/seed.js
 * Drops existing data and re-populates with demo records.
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User        = require('../models/User');
const Skill       = require('../models/Skill');
const Goal        = require('../models/Goal');
const Project     = require('../models/Project');
const Opportunity = require('../models/Opportunity');
const { AchievementDef, UserAchievement, Notification } = require('../models/Achievement');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://10.38.159.20:27017/skillsphere';

// ── Helpers ───────────────────────────────────────────────────────────────────
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ── Raw Data ──────────────────────────────────────────────────────────────────
const DEPTS       = ['CSE', 'MECH', 'CIVIL', 'INSTRUMENTATION', 'ELECTRICAL', 'ELECTRONICS', 'CHEMICAL'];
const ASPIRATIONS = ['Placements', 'GATE', 'Higher Studies', 'Startup', 'Research', 'Government', 'Freelancing'];
const SKILL_POOL  = [
  { name: 'Data Structures & Algorithms', category: 'DSA' },
  { name: 'Dynamic Programming',          category: 'DSA' },
  { name: 'React.js',                     category: 'Web Development' },
  { name: 'Node.js',                      category: 'Web Development' },
  { name: 'MongoDB',                      category: 'Database' },
  { name: 'PostgreSQL',                   category: 'Database' },
  { name: 'Python',                       category: 'Language' },
  { name: 'C++',                          category: 'Language' },
  { name: 'Machine Learning',             category: 'AI/ML' },
  { name: 'Deep Learning',                category: 'AI/ML' },
  { name: 'AWS',                          category: 'Cloud' },
  { name: 'Docker',                       category: 'DevOps' },
  { name: 'Figma / UI Design',            category: 'UI/UX' },
  { name: 'Flutter',                      category: 'App Development' },
  { name: 'System Design',               category: 'Other' },
];

const STUDENT_DATA = [
  { name: 'Arjun Mehta',    email: 'arjun@nit.edu',   dept: 'CSE', sem: 6, roll: '21CS047', cgpa: 9.2, aspiration: 'Placements',     lc: 247, cf: 1680, gh: 89,  xp: 4820 },
  { name: 'Priya Sharma',   email: 'priya@nit.edu',   dept: 'CSE', sem: 6, roll: '21CS023', cgpa: 9.5, aspiration: 'Research',        lc: 198, cf: 1920, gh: 134, xp: 5340 },
  { name: 'Rahul Verma',    email: 'rahul@nit.edu',   dept: 'ELECTRONICS', sem: 6, roll: '21EC015', cgpa: 8.7, aspiration: 'GATE',            lc: 132, cf: 1420, gh: 45,  xp: 3290 },
  { name: 'Sneha Iyer',     email: 'sneha@nit.edu',   dept: 'INSTRUMENTATION',  sem: 4, roll: '23IN008', cgpa: 8.9, aspiration: 'Startup',         lc: 89,  cf: 0,    gh: 67,  xp: 2870 },
  { name: 'Karthik Rao',    email: 'karthik@nit.edu', dept: 'CSE', sem: 8, roll: '21CS031', cgpa: 8.4, aspiration: 'Placements',     lc: 312, cf: 1540, gh: 112, xp: 5100 },
  { name: 'Ananya Singh',   email: 'ananya@nit.edu',  dept: 'CHEMICAL',  sem: 6, roll: '21CH019', cgpa: 9.0, aspiration: 'Higher Studies',  lc: 167, cf: 1380, gh: 78,  xp: 3650 },
  { name: 'Dev Patel',      email: 'dev@nit.edu',     dept: 'CSE', sem: 4, roll: '23CS012', cgpa: 8.1, aspiration: 'Placements',     lc: 95,  cf: 1200, gh: 34,  xp: 2100 },
  { name: 'Riya Nair',      email: 'riya@nit.edu',    dept: 'MECH',sem: 6, roll: '21ME022', cgpa: 7.9, aspiration: 'Government',      lc: 45,  cf: 0,    gh: 18,  xp: 1200 },
  { name: 'Aditya Kumar',   email: 'aditya@nit.edu',  dept: 'ELECTRICAL', sem: 6, roll: '21EE009', cgpa: 8.3, aspiration: 'GATE',            lc: 78,  cf: 1100, gh: 22,  xp: 1890 },
  { name: 'Meera Pillai',   email: 'meera@nit.edu',   dept: 'CSE', sem: 2, roll: '24CS005', cgpa: 9.1, aspiration: 'Research',        lc: 34,  cf: 890,  gh: 12,  xp: 980  },
];

const ACHIEVEMENT_DEFS = [
  { key: 'lc_50',    title: '50 Problems Solved',    description: 'Solved 50 problems on LeetCode',     icon: '💻', category: 'coding',  xpReward: 100, rarity: 'common',    condition: { field: 'codingStats.leetcodeSolved', operator: 'gte', value: 50   } },
  { key: 'lc_100',   title: '100 Problems Solved',   description: 'Solved 100 problems on LeetCode',    icon: '🔥', category: 'coding',  xpReward: 200, rarity: 'common',    condition: { field: 'codingStats.leetcodeSolved', operator: 'gte', value: 100  } },
  { key: 'lc_250',   title: '250 Problems Solved',   description: 'Solved 250 problems on LeetCode',    icon: '⚡', category: 'coding',  xpReward: 400, rarity: 'rare',      condition: { field: 'codingStats.leetcodeSolved', operator: 'gte', value: 250  } },
  { key: 'lc_500',   title: '500 Problems Solved',   description: 'Solved 500 problems on LeetCode',    icon: '🌟', category: 'coding',  xpReward: 800, rarity: 'epic',      condition: { field: 'codingStats.leetcodeSolved', operator: 'gte', value: 500  } },
  { key: 'cf_1400',  title: 'CF Specialist',         description: 'Reached 1400+ on Codeforces',        icon: '🎯', category: 'coding',  xpReward: 300, rarity: 'rare',      condition: { field: 'codingStats.codeforcesRating', operator: 'gte', value: 1400 } },
  { key: 'cf_1900',  title: 'CF Expert',             description: 'Reached 1900+ on Codeforces',        icon: '👑', category: 'coding',  xpReward: 600, rarity: 'epic',      condition: { field: 'codingStats.codeforcesRating', operator: 'gte', value: 1900 } },
  { key: 'streak_7', title: '7-Day Streak',          description: 'Logged in 7 days in a row',          icon: '🔥', category: 'streak',  xpReward: 150, rarity: 'common',    condition: { field: 'streakDays', operator: 'gte', value: 7  } },
  { key: 'streak_30',title: '30-Day Streak',         description: 'Logged in 30 days in a row',         icon: '🏅', category: 'streak',  xpReward: 500, rarity: 'epic',      condition: { field: 'streakDays', operator: 'gte', value: 30 } },
  { key: 'xp_1000',  title: 'Rising Star',           description: 'Earned 1000 XP',                     icon: '⭐', category: 'special', xpReward: 100, rarity: 'common',    condition: { field: 'xpPoints', operator: 'gte', value: 1000 } },
  { key: 'xp_5000',  title: 'SkillSphere Legend',    description: 'Earned 5000 XP',                     icon: '🏆', category: 'special', xpReward: 500, rarity: 'legendary', condition: { field: 'xpPoints', operator: 'gte', value: 5000 } },
];

const OPPORTUNITIES = [
  {
    title: 'Google SWE Intern 2025', company: 'Google', type: 'Internship',
    description: 'Join Google as a software engineering intern. Work on real products used by billions.',
    eligibleDepts: ['CSE', 'INSTRUMENTATION', 'ELECTRONICS'], minCGPA: 8.0, minSemester: 5,
    requiredSkills: ['Data Structures & Algorithms', 'System Design'],
    preferredSkills: ['Python', 'C++', 'Distributed Systems'],
    suitableFor: ['Placements'], stipend: '₹1,20,000/month',
    location: 'Bangalore / Remote', duration: '3 months',
    deadline: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    applyUrl: 'https://careers.google.com',
  },
  {
    title: 'Flipkart GRID 6.0', company: 'Flipkart', type: 'Hackathon',
    description: 'National level engineering challenge by Flipkart. Compete for prizes up to ₹5 Lakhs.',
    eligibleDepts: ['CSE', 'INSTRUMENTATION', 'ELECTRONICS'], minCGPA: 7.0,
    requiredSkills: ['React.js', 'Node.js'],
    preferredSkills: ['Machine Learning', 'Docker'],
    suitableFor: ['Placements', 'Startup'], stipend: 'Prize Pool ₹10L+',
    location: 'Online', duration: '2 days',
    deadline: new Date(Date.now() + 45 * 24 * 3600 * 1000),
    applyUrl: 'https://unstop.com/flipkart-grid',
  },
  {
    title: 'ISRO Research Fellowship', company: 'ISRO', type: 'Research',
    description: 'Work with ISRO scientists on cutting-edge space technology research.',
    eligibleDepts: ['ELECTRONICS', 'ELECTRICAL', 'MECH', 'CSE'], minCGPA: 8.5,
    requiredSkills: ['Python', 'Machine Learning'],
    preferredSkills: ['Deep Learning', 'Signal Processing'],
    suitableFor: ['Research', 'Higher Studies'],
    stipend: '₹35,000/month', location: 'Ahmedabad', duration: '6 months',
    deadline: new Date(Date.now() + 60 * 24 * 3600 * 1000),
    applyUrl: 'https://www.isro.gov.in',
  },
  {
    title: 'AWS Machine Learning Challenge', company: 'Amazon', type: 'Competition',
    description: 'Build ML solutions on AWS. Top teams get AWS credits and fast-track interviews.',
    eligibleDepts: ['ALL'], minCGPA: 7.5,
    requiredSkills: ['Machine Learning', 'Python'],
    preferredSkills: ['AWS', 'Deep Learning', 'Docker'],
    suitableFor: ['Placements', 'Research'],
    stipend: 'AWS Credits + PPO', location: 'Remote', duration: '1 month',
    deadline: new Date(Date.now() + 20 * 24 * 3600 * 1000),
    applyUrl: 'https://aws.amazon.com/ml-challenge',
  },
  {
    title: 'Microsoft Engage Mentorship', company: 'Microsoft', type: 'Workshop',
    description: '6-week mentorship with Microsoft engineers. Build a real product and get career guidance.',
    eligibleDepts: ['CSE', 'INSTRUMENTATION'], minCGPA: 7.0, minSemester: 3,
    requiredSkills: ['React.js'],
    preferredSkills: ['Node.js', 'Azure'],
    suitableFor: ['Placements', 'Higher Studies'],
    stipend: 'Stipend + Certificate', location: 'Remote', duration: '6 weeks',
    deadline: new Date(Date.now() + 15 * 24 * 3600 * 1000),
    applyUrl: 'https://microsoft.com/engage',
  },
];

// ── Seed Function ─────────────────────────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // ── Clear existing data ───────────────────────────────────────────────────
    console.log('🗑  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}), Skill.deleteMany({}),
      Goal.deleteMany({}), Project.deleteMany({}),
      Opportunity.deleteMany({}),
      AchievementDef.deleteMany({}), UserAchievement.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // ── Create Achievement Definitions ────────────────────────────────────────
    console.log('🏅 Seeding achievement definitions...');
    const achDefs = await AchievementDef.insertMany(ACHIEVEMENT_DEFS);
    const achMap  = {};
    achDefs.forEach(a => { achMap[a.key] = a._id; });

    // ── Create Admin ──────────────────────────────────────────────────────────
    console.log('👤 Creating admin and faculty...');
    const adminUser = await User.create({
      name: 'Prof. Ramesh Kumar', email: 'admin@nit.edu', password: 'Admin@1234',
      role: 'admin', department: 'CSE', designation: 'HOD – Computer Science',
      college: 'NIT Silchar', isVerified: true,
    });
    const facultyUser = await User.create({
      name: 'Dr. Ananya Roy', email: 'faculty@nit.edu', password: 'Faculty@1234',
      role: 'faculty', department: 'CSE', designation: 'Assistant Professor',
      subjects: ['Data Structures', 'Algorithms', 'Machine Learning'],
      college: 'NIT Silchar', isVerified: true,
    });

    // ── Create Students ───────────────────────────────────────────────────────
    console.log('🎓 Creating students...');
    const students = [];
    for (const sd of STUDENT_DATA) {
      const student = await User.create({
        name: sd.name, email: sd.email, password: 'Student@1234',
        role: 'student', department: sd.dept, semester: sd.sem,
        rollNumber: sd.roll, cgpa: sd.cgpa, aspiration: sd.aspiration,
        xpPoints: sd.xp, streakDays: randInt(0, 30),
        lastActiveAt: new Date(Date.now() - randInt(0, 2) * 86400000),
        college: 'NIT Silchar', isVerified: true, isActive: true,
        codingStats: {
          leetcodeSolved: sd.lc, leetcodeEasy: Math.floor(sd.lc * 0.5),
          leetcodeMedium: Math.floor(sd.lc * 0.35), leetcodeHard: Math.floor(sd.lc * 0.15),
          codeforcesRating: sd.cf, codeforcesMaxRating: sd.cf + randInt(0, 100),
          githubContributions: sd.gh, githubRepos: randInt(5, 30),
          contestsParticipated: randInt(2, 20),
        },
        bio: `${sd.dept} student at NIT Silchar. Passionate about technology and innovation. Aspiring ${sd.aspiration.toLowerCase()} candidate.`,
        socialLinks: {
          github: `https://github.com/${sd.name.split(' ')[0].toLowerCase()}`,
          linkedin: `https://linkedin.com/in/${sd.name.split(' ')[0].toLowerCase()}`,
          leetcode: `https://leetcode.com/${sd.name.split(' ')[0].toLowerCase()}`,
          codeforces: sd.cf ? `https://codeforces.com/profile/${sd.name.split(' ')[0].toLowerCase()}` : '',
        },
      });
      students.push(student);
    }

    // ── Create Skills ─────────────────────────────────────────────────────────
    console.log('🎯 Creating skills...');
    for (const student of students) {
      const numSkills = randInt(3, 6);
      const picked = [...SKILL_POOL].sort(() => 0.5 - Math.random()).slice(0, numSkills);
      for (const sk of picked) {
        await Skill.create({
          user: student._id,
          name: sk.name,
          category: sk.category,
          level: randInt(40, 95),
          targetLevel: 100,
          targetDate: new Date(Date.now() + randInt(30, 180) * 86400000),
          startedAt: new Date(Date.now() - randInt(30, 365) * 86400000),
          isPublic: true,
        });
      }
    }

    // ── Create Goals ──────────────────────────────────────────────────────────
    console.log('🏁 Creating goals...');
    const GOAL_TEMPLATES = [
      { title: 'Solve 300 LeetCode problems', category: 'Coding', type: 'semester', targetValue: 300, unit: 'problems' },
      { title: 'Maintain 9.0+ CGPA', category: 'Academic', type: 'semester', targetValue: 9.0, unit: 'CGPA' },
      { title: 'Build 3 full-stack projects', category: 'Project', type: 'yearly', targetValue: 3, unit: 'projects' },
      { title: 'Learn System Design', category: 'Skill', type: 'monthly', targetValue: 100, unit: '%' },
      { title: 'Reach CF 1800 rating', category: 'Coding', type: 'yearly', targetValue: 1800, unit: 'rating' },
      { title: 'Complete AWS certification', category: 'Skill', type: 'semester', targetValue: 100, unit: '%' },
      { title: 'Contribute to Open Source', category: 'Project', type: 'monthly', targetValue: 10, unit: 'PRs' },
    ];
    for (const student of students) {
      const numGoals = randInt(2, 4);
      const picked = [...GOAL_TEMPLATES].sort(() => 0.5 - Math.random()).slice(0, numGoals);
      for (const g of picked) {
        const current = randInt(0, g.targetValue);
        await Goal.create({
          user: student._id,
          title: g.title, category: g.category, type: g.type,
          targetValue: g.targetValue, currentValue: current, unit: g.unit,
          priority: rand(['low', 'medium', 'high']),
          deadline: new Date(Date.now() + randInt(30, 180) * 86400000),
          status: current >= g.targetValue ? 'completed' : 'active',
          isPublic: Math.random() > 0.5,
        });
      }
    }

    // ── Create Projects ───────────────────────────────────────────────────────
    console.log('🛠  Creating projects...');
    const PROJECT_TEMPLATES = [
      { title: 'SkillSphere Platform', domain: 'Web', tech: ['React', 'Node.js', 'MongoDB', 'Tailwind'], status: 'ongoing' },
      { title: 'AI Price Predictor', domain: 'AI/ML', tech: ['Python', 'Scikit-learn', 'Flask', 'Pandas'], status: 'completed' },
      { title: 'Smart Attendance System', domain: 'IoT', tech: ['Arduino', 'Python', 'OpenCV'], status: 'completed' },
      { title: 'CodeCollab Editor', domain: 'Web', tech: ['React', 'Socket.io', 'Node.js', 'Monaco'], status: 'ongoing' },
      { title: 'Placement Predictor ML', domain: 'AI/ML', tech: ['Python', 'TensorFlow', 'Streamlit'], status: 'planned' },
      { title: 'Campus Connect App', domain: 'Mobile', tech: ['Flutter', 'Firebase', 'Dart'], status: 'ongoing' },
      { title: 'Crypto Portfolio Tracker', domain: 'Web', tech: ['React', 'Express', 'CoinGecko API'], status: 'completed' },
    ];
    for (const student of students) {
      const numProjs = randInt(1, 3);
      const picked = [...PROJECT_TEMPLATES].sort(() => 0.5 - Math.random()).slice(0, numProjs);
      for (const p of picked) {
        await Project.create({
          user: student._id,
          title: p.title, domain: p.domain, techStack: p.tech,
          status: p.status,
          description: `A ${p.domain} project built with ${p.tech.slice(0, 2).join(' and ')}. Developed as part of personal skill development.`,
          githubUrl: `https://github.com/${student.name.split(' ')[0].toLowerCase()}/${p.title.replace(/\s+/g, '-').toLowerCase()}`,
          startDate: new Date(Date.now() - randInt(30, 180) * 86400000),
          isPublic: true,
        });
      }
    }

    // ── Create Opportunities ──────────────────────────────────────────────────
    console.log('💼 Creating opportunities...');
    for (const opp of OPPORTUNITIES) {
      await Opportunity.create({ ...opp, postedBy: adminUser._id });
    }

    // ── Award Achievements ────────────────────────────────────────────────────
    console.log('🏅 Awarding achievements...');
    for (const student of students) {
      const toAward = [];
      const s = student.codingStats;
      if (s.leetcodeSolved >= 50)  toAward.push(achMap['lc_50']);
      if (s.leetcodeSolved >= 100) toAward.push(achMap['lc_100']);
      if (s.leetcodeSolved >= 250) toAward.push(achMap['lc_250']);
      if (s.codeforcesRating >= 1400) toAward.push(achMap['cf_1400']);
      if (s.codeforcesRating >= 1900) toAward.push(achMap['cf_1900']);
      if (student.streakDays >= 7)    toAward.push(achMap['streak_7']);
      if (student.streakDays >= 30)   toAward.push(achMap['streak_30']);
      if (student.xpPoints >= 1000)   toAward.push(achMap['xp_1000']);
      if (student.xpPoints >= 5000)   toAward.push(achMap['xp_5000']);

      if (toAward.length) {
        await UserAchievement.insertMany(
          toAward.filter(Boolean).map(achId => ({ user: student._id, achievement: achId }))
        );
      }
    }

    // ── Create Welcome Notifications ──────────────────────────────────────────
    console.log('🔔 Creating notifications...');
    for (const student of students) {
      await Notification.insertMany([
        {
          recipient: student._id, sender: adminUser._id,
          type: 'announcement', title: 'Welcome to SkillSphere! 🎉',
          message: 'Your account is ready. Complete your profile to unlock the full potential of SkillSphere.',
          icon: '🚀', color: '#4f46e5',
        },
        {
          recipient: student._id, sender: facultyUser._id,
          type: 'opportunity', title: 'New Opportunity: Google SWE Intern 2025',
          message: 'A new internship opportunity matching your profile has been posted. Deadline in 30 days.',
          icon: '💼', color: '#06b6d4',
        },
      ]);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');
    console.log(`   👤 Admin:     admin@nit.edu     / Admin@1234`);
    console.log(`   👨‍🏫 Faculty:   faculty@nit.edu   / Faculty@1234`);
    console.log(`   🎓 Students:  <name>@nit.edu     / Student@1234`);
    console.log(`   📝 ${STUDENT_DATA.length} students, ${OPPORTUNITIES.length} opportunities, ${ACHIEVEMENT_DEFS.length} achievements`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
