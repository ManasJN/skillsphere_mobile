const express = require('express');
const router = express.Router();
const N = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get ('/',             N.getAllAchievements);
router.post('/',             authorize('admin'), N.createAchievementDef);
router.get ('/my',           N.getMyAchievements);
router.get ('/user/:userId', N.getUserAchievements);

module.exports = router;
