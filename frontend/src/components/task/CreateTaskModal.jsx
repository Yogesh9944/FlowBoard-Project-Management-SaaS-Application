import { useState } from 'react';
import { taskAPI } from '../../api/services';
import toast from 'react-hot-toast';

export default function CreateTaskModal({ board, project, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium',
    dueDate: '', assignedTo: [], estimatedHours: '',
  });
  const [loading, setLoading] = useState(false);
  const members = project?.members || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Task title is required');
    setLoading(true);
    try {
      const { data } = await taskAPI.create({
        title: form.title,
        description: form.description,
        boardId: board._id,
        projectId: project._id,
        workspaceId: project.workspace,
        priority: form.priority,
        assignedTo: form.assignedTo,
        dueDate: form.dueDate || undefined,
        estimatedHours: form.estimatedHours || undefined,
      });
      toast.success('Task created!');
      onCreated(data.task);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const toggleAssignee = (userId) => {
    setForm(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter(id => id !== userId)
        : [...prev.assignedTo, userId],
    }));
  };

  function initials(name) {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">New Task</h2>
            <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', marginTop: 3 }}>
              Adding to: <strong style={{ color: board.color || 'var(--accent)' }}>{board.name}</strong>
            </p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ fontSize: '1.2rem', color: 'var(--text-3)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="What needs to be done?" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} autoFocus required />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" placeholder="Add more details..." value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} style={{ minHeight: 80 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Estimated Hours</label>
            <input className="form-input" type="number" min="0" step="0.5" placeholder="e.g. 4"
              value={form.estimatedHours} onChange={e => setForm({ ...form, estimatedHours: e.target.value })} />
          </div>

          {members.length > 0 && (
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {members.map(m => {
                  const u = m.user;
                  const selected = form.assignedTo.includes(u._id);
                  return (
                    <button key={u._id} type="button" onClick={() => toggleAssignee(u._id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px',
                        borderRadius: 99, cursor: 'pointer', transition: 'all 0.15s',
                        background: selected ? 'var(--accent-glow)' : 'var(--bg-4)',
                        border: selected ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                        color: selected ? 'var(--accent-2)' : 'var(--text-2)',
                        fontFamily: 'var(--font-body)', fontSize: '0.82rem',
                      }}>
                      <div className="avatar" style={{ width: 20, height: 20, fontSize: '0.55rem', background: 'var(--accent)' }}>
                        {initials(u.name)}
                      </div>
                      {u.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
