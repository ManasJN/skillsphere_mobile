const express = require('express');
const router = express.Router();
const C = require('../controllers/opportunityController');
const { protect, authorize } = require('../middleware/auth');
const { opportunityRules, validate } = require('../middleware/validate');

router.use(protect);
router.get ('/',                     C.getOpportunities);
router.get ('/:id',                  C.getOpportunity);
router.post('/',                     authorize('faculty','admin'), opportunityRules, validate, C.createOpportunity);
router.put ('/:id',                  authorize('faculty','admin'), C.updateOpportunity);
router.delete('/:id',                authorize('faculty','admin'), C.deleteOpportunity);
router.post('/:id/apply',            authorize('student'), C.applyToOpportunity);
router.get ('/:id/matched-students', authorize('faculty','admin'), C.getMatchedStudents);

module.exports = router;
