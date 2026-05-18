const { body, validationResult } = require('express-validator');

/**
 * Run after validation rules — send errors if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Auth validators ────────────────────────────────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['student', 'college']).withMessage('Invalid role'),
  body('department').optional().isIn(['CSE', 'MECH', 'CIVIL', 'INSTRUMENTATION', 'ELECTRICAL', 'ELECTRONICS', 'CHEMICAL', 'OTHER']),
  body('rollNumber').optional().trim(),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Skill validators ───────────────────────────────────────────────────────────
const skillRules = [
  body('name').trim().notEmpty().withMessage('Skill name is required').isLength({ max: 80 }),
  body('level').optional().isInt({ min: 0, max: 100 }).withMessage('Level must be 0-100'),
  body('category').optional().isIn(['DSA','Web Development','AI/ML','Cloud','UI/UX',
    'App Development','DevOps','Cybersecurity','Database','Language','Framework','Other']),
];

// ── Goal validators ────────────────────────────────────────────────────────────
const goalRules = [
  body('title').trim().notEmpty().withMessage('Goal title is required').isLength({ max: 200 }),
  body('deadline').isISO8601().withMessage('Valid deadline date is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('type').optional().isIn(['monthly', 'semester', 'yearly', 'custom']),
  body('progress').optional().isInt({ min: 0, max: 100 }),
];

// ── Project validators ─────────────────────────────────────────────────────────
const projectRules = [
  body('title').trim().notEmpty().withMessage('Project title is required').isLength({ max: 150 }),
  body('status').optional().isIn(['planned', 'ongoing', 'completed', 'abandoned']),
  body('techStack').optional().isArray(),
];

// ── Opportunity validators ─────────────────────────────────────────────────────
const opportunityRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('type').isIn(['Internship','Hackathon','Research','Competition','Workshop','Scholarship','Job']).withMessage('Invalid type'),
  body('deadline').isISO8601().withMessage('Valid deadline is required'),
];

module.exports = {
  validate,
  registerRules, loginRules,
  skillRules, goalRules, projectRules, opportunityRules,
};
