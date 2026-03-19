import { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import toast from 'react-hot-toast';

const ICONS = ['🚀', '💡', '🎯', '🏗️', '🌟', '⚡', '🔥', '💎', '🌈', '🎨', '📦', '🔬'];
const COLORS = ['#7c6af7', '#22d3a0', '#f5c542', '#f75c6a', '#4da6ff', '#f7934c', '#e879f9', '#34d399'];

export default function CreateWorkspaceModal({ onClose }) {
  const { createWorkspace } = useWorkspace();
  const [form, setForm] = useState({ name: '', description: '', icon: '🚀', color: '#7c6af7' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Workspace name is required');
    setLoading(true);
    try {
      await createWorkspace(form);
      toast.success('Workspace created!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New Workspace</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ fontSize: '1.2rem', color: 'var(--text-3)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Icon & Color Preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: 'var(--bg-3)', borderRadius: 12 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, background: form.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
              boxShadow: `0 0 20px ${form.color}44`,
            }}>{form.icon}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{form.name || 'My Workspace'}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 3 }}>Preview</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Workspace Name *</label>
            <input className="form-input" placeholder="e.g. My Startup" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" placeholder="What is this workspace for?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ minHeight: 70 }} />
          </div>

          <div className="form-group">
            <label className="form-label">Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ICONS.map(icon => (
                <button key={icon} type="button" onClick={() => setForm({ ...form, icon })}
                  style={{
                    width: 38, height: 38, borderRadius: 9, fontSize: '1.2rem',
                    background: form.icon === icon ? 'var(--bg-4)' : 'transparent',
                    border: form.icon === icon ? '2px solid var(--accent)' : '2px solid var(--border)',
                    cursor: 'pointer', transition: 'all var(--transition)',
                  }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {COLORS.map(color => (
                <button key={color} type="button" onClick={() => setForm({ ...form, color })}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: color, cursor: 'pointer', border: 'none',
                    outline: form.color === color ? `3px solid ${color}` : '3px solid transparent',
                    outlineOffset: 2, transition: 'all var(--transition)',
                  }} />
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
