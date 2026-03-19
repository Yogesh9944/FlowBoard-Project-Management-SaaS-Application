const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getBoardsByProject, createBoard, updateBoard, deleteBoard, reorderBoards } = require('../controllers/boardController');

router.use(protect);

router.get('/project/:projectId', getBoardsByProject);
router.post('/', createBoard);
router.put('/reorder', reorderBoards);
router.route('/:id').put(updateBoard).delete(deleteBoard);

module.exports = router;
