const express = require('express');
const router = express.Router();
const { getGoals, createGoal, updateGoal, deleteGoal, toggleMilestone } = require('../controllers/contentController');
const { protect } = require('../middleware/auth');
const { goalRules, validate } = require('../middleware/validate');

router.use(protect);

router.get ('/',     getGoals);
router.post('/',     goalRules, validate, createGoal);
router.put ('/:id',  updateGoal);
router.delete('/:id',deleteGoal);
router.put ('/:id/milestones/:milestoneId/toggle', toggleMilestone);

// View another user's public goals
router.get('/user/:userId', (req, res, next) => { next(); }, getGoals);

module.exports = router;
