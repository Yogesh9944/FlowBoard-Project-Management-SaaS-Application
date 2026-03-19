const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Board name is required'],
      trim: true,
      maxlength: [50, 'Board name cannot exceed 50 characters'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    limit: {
      type: Number,
      default: null, // WIP limit
    },
  },
  { timestamps: true }
);

// Index for sorted queries
BoardSchema.index({ project: 1, order: 1 });

module.exports = mongoose.model('Board', BoardSchema);
