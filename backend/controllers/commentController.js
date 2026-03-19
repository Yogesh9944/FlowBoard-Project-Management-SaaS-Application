const Comment = require('../models/Comment');
const Task = require('../models/Task');

// @desc  Get comments for task
// @route GET /api/comments/task/:taskId
const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId, isDeleted: false })
      .populate('user', 'name email avatar')
      .sort('createdAt');
    res.json({ success: true, comments });
  } catch (error) {
    next(error);
  }
};

// @desc  Create comment
// @route POST /api/comments
const createComment = async (req, res, next) => {
  try {
    const { taskId, text, mentions, parentComment } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const comment = await Comment.create({
      task: taskId,
      user: req.user._id,
      text,
      mentions: mentions || [],
      parentComment: parentComment || null,
    });

    await comment.populate('user', 'name email avatar');

    // Add activity to task
    task.activity.push({ user: req.user._id, action: 'commented on this task', timestamp: new Date() });
    await task.save();

    const io = req.app.get('io');
    io.to(`project-${task.project}`).emit('comment:created', { taskId, comment });

    res.status(201).json({ success: true, comment });
  } catch (error) {
    next(error);
  }
};

// @desc  Update comment
// @route PUT /api/comments/:id
const updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this comment' });
    }

    comment.text = req.body.text;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();
    await comment.populate('user', 'name email avatar');

    res.json({ success: true, comment });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete comment
// @route DELETE /api/comments/:id
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    comment.isDeleted = true;
    comment.text = '[deleted]';
    await comment.save();

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc  Add reaction to comment
// @route POST /api/comments/:id/react
const addReaction = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const reactionIndex = comment.reactions.findIndex((r) => r.emoji === emoji);
    if (reactionIndex === -1) {
      comment.reactions.push({ emoji, users: [req.user._id] });
    } else {
      const userReacted = comment.reactions[reactionIndex].users.includes(req.user._id);
      if (userReacted) {
        comment.reactions[reactionIndex].users = comment.reactions[reactionIndex].users.filter(
          (u) => u.toString() !== req.user._id.toString()
        );
        if (comment.reactions[reactionIndex].users.length === 0) {
          comment.reactions.splice(reactionIndex, 1);
        }
      } else {
        comment.reactions[reactionIndex].users.push(req.user._id);
      }
    }

    await comment.save();
    res.json({ success: true, reactions: comment.reactions });
  } catch (error) {
    next(error);
  }
};

module.exports = { getComments, createComment, updateComment, deleteComment, addReaction };
