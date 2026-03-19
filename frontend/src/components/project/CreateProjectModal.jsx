import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../../api/services';
import toast from 'react-hot-toast';

const ICONS = ['📋', '🚀', '💡', '🎯', '🏗️', '🌟', '⚡', '🔥', '💎', '🌈', '🎨', '📦', '🔬', '📊', '🛠️', '🎮'];
const COLORS = ['#7c6af7', '#22d3a0', '#f5c542', '#f75c6a', '#4da6ff', '#f7934c', '#e879f9', '#34d399'];

export default function CreateProjectModal({ workspaceId, members, onClose, onCreated }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', icon: '📋', color: '#7c6af7', priority: 'medium', startDate: '', endDate: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Project title is required');
    setLoading(true);
    try {
      const { data } = await projectAPI.create({ ...form, workspaceId });
      toast.success('Project created with default boards!');
      onCreated?.(data.project);
      navigate(`/project/${data.project._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2 className="modal-title">New Project</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ fontSize: '1.2rem', color: 'var(--text-3)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'var(--bg-3)', borderRadius: 12 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 13, background: form.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem',
              boxShadow: `0 0 20px ${form.color}44`,
            }}>{form.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{form.title || 'Project Name'}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>
                Boards: Todo · In Progress · In Review · Done
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Project Title *</label>
            <input className="form-input" placeholder="e.g. Website Redesign" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" placeholder="What is this project about?" value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} style={{ minHeight: 70 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="form-input" type="date" value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input className="form-input" type="date" value={form.endDate}
                onChange={e => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>

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
            <label className="form-label">Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {ICONS.map(icon => (
                <button key={icon} type="button" onClick={() => setForm({ ...form, icon })}
                  style={{
                    width: 36, height: 36, borderRadius: 8, fontSize: '1.1rem',
                    background: form.icon === icon ? 'var(--bg-4)' : 'transparent',
                    border: form.icon === icon ? '2px solid var(--accent)' : '2px solid var(--border)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>{icon}</button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {COLORS.map(color => (
                <button key={color} type="button" onClick={() => setForm({ ...form, color })}
                  style={{
                    width: 26, height: 26, borderRadius: '50%', background: color, cursor: 'pointer', border: 'none',
                    outline: form.color === color ? `3px solid ${color}` : '3px solid transparent',
                    outlineOffset: 2, transition: 'all 0.15s',
                  }} />
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
