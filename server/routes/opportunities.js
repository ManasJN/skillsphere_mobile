const express = require('express');
const router = express.Router();
const C = require('../controllers/opportunityController');
const { protect, authorize } = require('../middleware/auth');
const { opportunityRules, validate } = require('../middleware/validate');

router.use(protect);
router.get ('/',                     C.getOpportunities);
router.get ('/:id',                  C.getOpportunity);
router.post('/',                     authorize('college','admin'), opportunityRules, validate, C.createOpportunity);
router.put ('/:id',                  authorize('college','admin'), C.updateOpportunity);
router.delete('/:id',                authorize('college','admin'), C.deleteOpportunity);
router.post('/:id/apply',            authorize('student'), C.applyToOpportunity);
router.get ('/:id/matched-students', authorize('college','admin'), C.getMatchedStudents);

module.exports = router;
