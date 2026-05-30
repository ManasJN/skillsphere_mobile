const express = require('express');
const router = express.Router();
const N = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get ('/',               N.getNotifications);
router.put ('/mark-all-read',  N.markAllRead);
router.post('/broadcast',      authorize('faculty','admin'), N.broadcast);
router.put ('/:id/read',       N.markRead);
router.delete('/:id',          N.deleteNotification);

module.exports = router;
