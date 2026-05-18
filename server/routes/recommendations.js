const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getProfile,
  saveProfile,
  generate,
  getLatest,
  getHistory,
  getById,
  getDashboardSummary,
} = require('../controllers/recommendationController');

router.use(protect);
router.use(authorize('student'));

router.get('/profile', getProfile);
router.put('/profile', saveProfile);
router.get('/dashboard-summary', getDashboardSummary);
router.get('/history', getHistory);
router.get('/latest', getLatest);
router.get('/:id', getById);
router.post('/generate', generate);

module.exports = router;
