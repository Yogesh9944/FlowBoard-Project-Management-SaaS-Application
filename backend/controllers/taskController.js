const Task = require('../models/Task');
const Board = require('../models/Board');
const Comment = require('../models/Comment');

// @desc  Get tasks by board
// @route GET /api/tasks/board/:boardId
const getTasksByBoard = async (req, res, next) => {
  try {
    const tasks = await Task.find({ board: req.params.boardId, isArchived: false })
      .populate('assignedTo', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .sort('order');
    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
};

// @desc  Get tasks by project (all boards)
// @route GET /api/tasks/project/:projectId
const getTasksByProject = async (req, res, next) => {
  try {
    const { status, priority, assignedTo, search, overdue } = req.query;
    const filter = { project: req.params.projectId, isArchived: false };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (overdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $ne: 'done' };
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('board', 'name color')
      .sort('order');

    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
};

// @desc  Get my assigned tasks (across all workspaces)
// @route GET /api/tasks/my
const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id, isArchived: false, status: { $ne: 'done' } })
      .populate('project', 'title color icon')
      .populate('board', 'name')
      .sort('dueDate');
    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
};

// @desc  Create task
// @route POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, boardId, projectId, workspaceId, priority, assignedTo, dueDate, startDate, estimatedHours, labels } = req.body;

    const lastTask = await Task.findOne({ board: boardId }).sort('-order');
    const order = lastTask ? lastTask.order + 1 : 0;

    const task = await Task.create({
      title,
      description,
      board: boardId,
      project: projectId,
      workspace: workspaceId,
      priority,
      assignedTo: assignedTo || [],
      reporter: req.user._id,
      dueDate,
      startDate,
      estimatedHours,
      labels: labels || [],
      order,
      activity: [{ user: req.user._id, action: 'created this task', timestamp: new Date() }],
    });

    await task.populate('assignedTo', 'name email avatar');
    await task.populate('reporter', 'name email avatar');

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`project-${projectId}`).emit('task:created', task);

    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single task
// @route GET /api/tasks/:id
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('board', 'name color')
      .populate('activity.user', 'name avatar');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const comments = await Comment.find({ task: task._id, isDeleted: false })
      .populate('user', 'name email avatar')
      .sort('createdAt');

    res.json({ success: true, task, comments });
  } catch (error) {
    next(error);
  }
};

// @desc  Update task
// @route PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const activityLog = [];
    const trackFields = ['title', 'description', 'status', 'priority', 'dueDate'];

    trackFields.forEach((field) => {
      if (req.body[field] !== undefined && req.body[field] !== task[field]?.toString()) {
        activityLog.push({
          user: req.user._id,
          action: `updated ${field}`,
          field,
          oldValue: task[field]?.toString(),
          newValue: req.body[field]?.toString(),
          timestamp: new Date(),
        });
      }
    });

    // If status changed to done, set completedAt
    if (req.body.status === 'done' && task.status !== 'done') {
      req.body.completedAt = new Date();
    }
    if (req.body.status && req.body.status !== 'done') {
      req.body.completedAt = null;
    }

    Object.assign(task, req.body);
    if (activityLog.length > 0) {
      task.activity.push(...activityLog);
    }

    await task.save();
    await task.populate('assignedTo', 'name email avatar');
    await task.populate('reporter', 'name email avatar');

    const io = req.app.get('io');
    io.to(`project-${task.project}`).emit('task:updated', task);

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc  Move task to different board
// @route PUT /api/tasks/:id/move
const moveTask = async (req, res, next) => {
  try {
    const { boardId, order } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

    task.activity.push({
      user: req.user._id,
      action: `moved task to ${board.name}`,
      field: 'board',
      oldValue: task.board.toString(),
      newValue: boardId,
      timestamp: new Date(),
    });

    task.board = boardId;
    task.order = order !== undefined ? order : task.order;

    // Update status based on board name (smart mapping)
    const boardName = board.name.toLowerCase();
    if (boardName.includes('todo')) task.status = 'todo';
    else if (boardName.includes('progress')) task.status = 'in-progress';
    else if (boardName.includes('review')) task.status = 'in-review';
    else if (boardName.includes('done') || boardName.includes('complete')) {
      task.status = 'done';
      task.completedAt = new Date();
    }

    await task.save();

    const io = req.app.get('io');
    io.to(`project-${task.project}`).emit('task:moved', { taskId: task._id, boardId, order });

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc  Update checklist item
// @route PUT /api/tasks/:id/checklist/:itemId
const updateChecklistItem = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    const item = task.checklist.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Checklist item not found' });

    item.completed = req.body.completed;
    if (req.body.completed) {
      item.completedAt = new Date();
      item.completedBy = req.user._id;
    } else {
      item.completedAt = null;
      item.completedBy = null;
    }
    if (req.body.text) item.text = req.body.text;

    await task.save();
    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete task
// @route DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    await Comment.deleteMany({ task: task._id });
    await task.deleteOne();

    const io = req.app.get('io');
    io.to(`project-${task.project}`).emit('task:deleted', { taskId: task._id });

    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasksByBoard, getTasksByProject, getMyTasks, createTask, getTask, updateTask, moveTask, updateChecklistItem, deleteTask };
