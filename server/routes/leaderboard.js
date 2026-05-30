const express = require('express');
const router = express.Router();
const { getLeaderboard, getDeptSummary } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/',                   getLeaderboard);
router.get('/department-summary', authorize('faculty','admin'), getDeptSummary);

module.exports = router;
