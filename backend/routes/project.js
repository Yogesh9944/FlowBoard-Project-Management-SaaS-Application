const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createProject, getProjectsByWorkspace, getProject,
  updateProject, deleteProject, getProjectStats
} = require('../controllers/projectController');

router.use(protect);

router.route('/').post(createProject);
router.get('/workspace/:workspaceId', getProjectsByWorkspace);
router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);
router.get('/:id/stats', getProjectStats);

module.exports = router;
