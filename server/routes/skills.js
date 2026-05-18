const express = require('express');
const router = express.Router();
const { getSkills, createSkill, updateSkill, deleteSkill } = require('../controllers/contentController');
const { protect } = require('../middleware/auth');
const { skillRules, validate } = require('../middleware/validate');

router.use(protect);

// /api/skills  — own skills
router.get ('/',     getSkills);
router.post('/',     skillRules, validate, createSkill);
router.put ('/:id',  updateSkill);
router.delete('/:id',deleteSkill);

// /api/skills/user/:userId — view another student's skills
router.get('/user/:userId', (req, res, next) => {
  req.params.userId = req.params.userId;
  next();
}, getSkills);

module.exports = router;
