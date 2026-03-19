import { useState } from 'react';
import { boardAPI } from '../../api/services';
import toast from 'react-hot-toast';

const COLORS = ['#64748b', '#f59e0b', '#8b5cf6', '#22c55e', '#ef4444', '#3b82f6', '#f97316', '#ec4899'];

export default function CreateBoardModal({ projectId, workspaceId, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', color: '#64748b' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Board name is required');
    setLoading(true);
    try {
      const { data } = await boardAPI.create({ name: form.name, color: form.color, projectId, workspaceId });
      toast.success('Column created!');
      onCreated(data.board);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create board');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <h2 className="modal-title">New Column</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ fontSize: '1.2rem', color: 'var(--text-3)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Column Name</label>
            <input className="form-input" placeholder="e.g. Backlog" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} autoFocus required />
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {COLORS.map(color => (
                <button key={color} type="button" onClick={() => setForm({ ...form, color })}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: color,
                    border: 'none', cursor: 'pointer',
                    outline: form.color === color ? `3px solid ${color}` : '3px solid transparent',
                    outlineOffset: 2, transition: 'all 0.15s',
                  }} />
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Column'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
