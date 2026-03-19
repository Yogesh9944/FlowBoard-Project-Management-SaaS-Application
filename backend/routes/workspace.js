const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createWorkspace, getWorkspaces, getWorkspace,
  updateWorkspace, inviteMember, removeMember,
  updateMemberRole, deleteWorkspace
} = require('../controllers/workspaceController');

router.use(protect);

router.route('/').get(getWorkspaces).post(createWorkspace);
router.route('/:id').get(getWorkspace).put(updateWorkspace).delete(deleteWorkspace);
router.post('/:id/invite', inviteMember);
router.route('/:id/members/:userId').put(updateMemberRole).delete(removeMember);

module.exports = router;
