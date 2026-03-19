const Project = require('../models/Project');
const Board = require('../models/Board');
const Task = require('../models/Task');
const Workspace = require('../models/Workspace');

const DEFAULT_BOARDS = [
  { name: 'Todo', color: '#64748b', order: 0 },
  { name: 'In Progress', color: '#f59e0b', order: 1 },
  { name: 'In Review', color: '#8b5cf6', order: 2 },
  { name: 'Done', color: '#22c55e', order: 3 },
];

const createProject = async (req, res, next) => {
  try {
    const { title, description, workspaceId, color, icon, priority, startDate, endDate } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });

    const isMember = workspace.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a workspace member' });

    const project = await Project.create({
      title,
      description,
      workspace: workspaceId,
      owner: req.user._id,
      color,
      icon,
      priority,
      startDate,
      endDate,
      members: [{ user: req.user._id, role: 'admin' }],
    });

    // Create default boards
    const boardsData = DEFAULT_BOARDS.map((b) => ({
      ...b,
      project: project._id,
      workspace: workspaceId,
      isDefault: true,
    }));
    await Board.insertMany(boardsData);

    await project.populate('owner', 'name email avatar');

    res.status(201).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};


const getProjectsByWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const projects = await Project.find({
      workspace: workspaceId,
      isArchived: false,
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort('-createdAt');

    const projectsWithStats = await Promise.all(
      projects.map(async (p) => {
        const totalTasks = await Task.countDocuments({ project: p._id, isArchived: false });
        const doneTasks = await Task.countDocuments({ project: p._id, status: 'done', isArchived: false });
        const overdueTasks = await Task.countDocuments({
          project: p._id,
          dueDate: { $lt: new Date() },
          status: { $ne: 'done' },
          isArchived: false,
        });
        return {
          ...p.toObject(),
          stats: { totalTasks, doneTasks, overdueTasks, progress: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0 },
        };
      })
    );

    res.json({ success: true, projects: projectsWithStats });
  } catch (error) {
    next(error);
  }
};


const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};


const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};


const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Cascade delete boards and tasks
    const boards = await Board.find({ project: project._id });
    const boardIds = boards.map((b) => b._id);
    await Task.deleteMany({ board: { $in: boardIds } });
    await Board.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    next(error);
  }
};


const getProjectStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [total, done, inProgress, todo, overdue, critical] = await Promise.all([
      Task.countDocuments({ project: id, isArchived: false }),
      Task.countDocuments({ project: id, status: 'done' }),
      Task.countDocuments({ project: id, status: 'in-progress' }),
      Task.countDocuments({ project: id, status: 'todo' }),
      Task.countDocuments({ project: id, dueDate: { $lt: new Date() }, status: { $ne: 'done' } }),
      Task.countDocuments({ project: id, priority: 'critical', status: { $ne: 'done' } }),
    ]);

    res.json({
      success: true,
      stats: { total, done, inProgress, todo, overdue, critical, progress: total > 0 ? Math.round((done / total) * 100) : 0 },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createProject, getProjectsByWorkspace, getProject, updateProject, deleteProject, getProjectStats };
