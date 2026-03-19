const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTasksByBoard, getTasksByProject, getMyTasks,
  createTask, getTask, updateTask, moveTask,
  updateChecklistItem, deleteTask
} = require('../controllers/taskController');

router.use(protect);

router.get('/board/:boardId', getTasksByBoard);
router.get('/project/:projectId', getTasksByProject);
router.get('/my', getMyTasks);
router.post('/', createTask);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);
router.put('/:id/move', moveTask);
router.put('/:id/checklist/:itemId', updateChecklistItem);

module.exports = router;
