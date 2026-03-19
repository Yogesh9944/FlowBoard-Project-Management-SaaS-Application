const Board = require('../models/Board');
const Task = require('../models/Task');


const getBoardsByProject = async (req, res, next) => {
  try {
    const boards = await Board.find({ project: req.params.projectId }).sort('order');
    res.json({ success: true, boards });
  } catch (error) {
    next(error);
  }
};

const createBoard = async (req, res, next) => {
  try {
    const { name, projectId, workspaceId, color } = req.body;
    const lastBoard = await Board.findOne({ project: projectId }).sort('-order');
    const order = lastBoard ? lastBoard.order + 1 : 0;

    const board = await Board.create({ name, project: projectId, workspace: workspaceId, color, order });
    res.status(201).json({ success: true, board });
  } catch (error) {
    next(error);
  }
};


const updateBoard = async (req, res, next) => {
  try {
    const board = await Board.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });
    res.json({ success: true, board });
  } catch (error) {
    next(error);
  }
};


const deleteBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });
    if (board.isDefault) return res.status(400).json({ success: false, message: 'Cannot delete default board' });

    await Task.deleteMany({ board: board._id });
    await board.deleteOne();

    res.json({ success: true, message: 'Board deleted' });
  } catch (error) {
    next(error);
  }
};


const reorderBoards = async (req, res, next) => {
  try {
    const { boards } = req.body; // [{ id, order }]
    await Promise.all(boards.map(({ id, order }) => Board.findByIdAndUpdate(id, { order })));
    res.json({ success: true, message: 'Boards reordered' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBoardsByProject, createBoard, updateBoard, deleteBoard, reorderBoards };
