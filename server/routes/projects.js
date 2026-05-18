const express = require('express');
const router = express.Router();
const { getProjects, createProject, updateProject, deleteProject, toggleProjectLike } = require('../controllers/contentController');
const { protect } = require('../middleware/auth');
const { projectRules, validate } = require('../middleware/validate');

router.use(protect);

router.get ('/',           getProjects);
router.post('/',           projectRules, validate, createProject);
router.put ('/:id',        updateProject);
router.delete('/:id',      deleteProject);
router.post('/:id/like',   toggleProjectLike);

router.get('/user/:userId', getProjects);

module.exports = router;
