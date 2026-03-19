const Workspace = require('../models/Workspace');
const Project = require('../models/Project');
const User = require('../models/User');

const createWorkspace = async (req, res, next) => {
  try {
    const { name, description, icon, color } = req.body;
    const workspace = await Workspace.create({
      name,
      description,
      icon,
      color,
      owner: req.user._id,
    });

    await workspace.populate('members.user', 'name email avatar');
    res.status(201).json({ success: true, workspace });
  } catch (error) {
    next(error);
  }
};


const getWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.user._id,
      isActive: true,
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort('-createdAt');

    res.json({ success: true, workspaces });
  } catch (error) {
    next(error);
  }
};


const getWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    const isMember = workspace.members.some((m) => m.user._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, workspace });
  } catch (error) {
    next(error);
  }
};

const updateWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });

    if (workspace.owner.toString() !== req.user._id.toString()) {
      const memberRole = workspace.members.find((m) => m.user.toString() === req.user._id.toString())?.role;
      if (memberRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Only admins can update workspace' });
      }
    }

    const { name, description, icon, color } = req.body;
    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (icon) workspace.icon = icon;
    if (color) workspace.color = color;

    await workspace.save();
    await workspace.populate('members.user', 'name email avatar');

    res.json({ success: true, workspace });
  } catch (error) {
    next(error);
  }
};


const inviteMember = async (req, res, next) => {
  try {
    const { email, role = 'member' } = req.body;
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });

    // Check permissions
    const requesterMember = workspace.members.find((m) => m.user.toString() === req.user._id.toString());
    if (!requesterMember || !['admin'].includes(requesterMember.role)) {
      if (workspace.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Only admins can invite members' });
      }
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with that email' });
    }

    // Check if already a member
    const alreadyMember = workspace.members.some((m) => m.user.toString() === user._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member' });
    }

    workspace.members.push({ user: user._id, role });
    await workspace.save();
    await workspace.populate('members.user', 'name email avatar');

    res.json({ success: true, message: 'Member added successfully', workspace });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });

    if (workspace.owner.toString() === req.params.userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove workspace owner' });
    }

    workspace.members = workspace.members.filter((m) => m.user.toString() !== req.params.userId);
    await workspace.save();

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    next(error);
  }
};


const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });

    const member = workspace.members.find((m) => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    member.role = role;
    await workspace.save();

    res.json({ success: true, message: 'Role updated' });
  } catch (error) {
    next(error);
  }
};


const deleteWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });

    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only workspace owner can delete it' });
    }

    await workspace.deleteOne();
    res.json({ success: true, message: 'Workspace deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createWorkspace, getWorkspaces, getWorkspace, updateWorkspace, inviteMember, removeMember, updateMemberRole, deleteWorkspace };
