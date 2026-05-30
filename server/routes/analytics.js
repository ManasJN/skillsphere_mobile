const express = require('express');
const router = express.Router();
const A = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/overview',             authorize('faculty','admin'), A.getOverview);
router.get('/skills-distribution',  A.getSkillsDistribution);
router.get('/aspirations',          A.getAspirations);
router.get('/coding-activity',      A.getCodingActivity);
router.get('/placement-readiness',  authorize('faculty','admin'), A.getPlacementReadiness);
router.get('/my-stats',             A.getMyStats);

module.exports = router;
