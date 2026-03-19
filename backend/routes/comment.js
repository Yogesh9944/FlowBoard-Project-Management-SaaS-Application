const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getComments, createComment, updateComment, deleteComment, addReaction } = require('../controllers/commentController');

router.use(protect);

router.get('/task/:taskId', getComments);
router.post('/', createComment);
router.route('/:id').put(updateComment).delete(deleteComment);
router.post('/:id/react', addReaction);

module.exports = router;
