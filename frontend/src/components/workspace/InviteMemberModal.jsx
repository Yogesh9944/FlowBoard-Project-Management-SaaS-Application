import { useState } from 'react';
import { workspaceAPI } from '../../api/services';
import toast from 'react-hot-toast';

export default function InviteMemberModal({ workspaceId, onClose, onInvited }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await workspaceAPI.inviteMember(workspaceId, { email, role });
      toast.success('Member added successfully!');
      onInvited?.(data.workspace);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2 className="modal-title">Invite Member</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ fontSize: '1.2rem', color: 'var(--text-3)' }}>✕</button>
        </div>

        <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: 20 }}>
          The user must already have a FlowBoard account to be added.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="colleague@company.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="viewer">Viewer — can view only</option>
              <option value="member">Member — can edit tasks</option>
              <option value="admin">Admin — full access</option>
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
