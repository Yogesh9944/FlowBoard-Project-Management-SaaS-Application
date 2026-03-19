import { useState, useEffect, useRef } from 'react';
import { taskAPI, commentAPI } from '../../api/services';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

function initials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}
function stringToColor(str) {
  if (!str) return 'var(--accent)';
  const colors = ['#7c6af7', '#22d3a0', '#f5c542', '#4da6ff', '#f7934c', '#e879f9'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const PRIORITY_OPTS = ['low', 'medium', 'high', 'critical'];
const STATUS_OPTS = ['todo', 'in-progress', 'in-review', 'done', 'blocked'];

export default function TaskDetailModal({ taskId, project, onClose, onUpdated, onDeleted }) {
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editField, setEditField] = useState(null);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [activeTab, setActiveTab] = useState('details'); // details | activity
  const commentEndRef = useRef(null);

  useEffect(() => {
    taskAPI.getOne(taskId)
      .then(({ data }) => { setTask(data.task); setComments(data.comments || []); })
      .catch(() => toast.error('Failed to load task'))
      .finally(() => setLoading(false));
  }, [taskId]);

  const updateField = async (field, value) => {
    setSaving(true);
    try {
      const { data } = await taskAPI.update(task._id, { [field]: value });
      setTask(data.task);
      onUpdated?.(data.task);
      setEditField(null);
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskAPI.delete(task._id);
      toast.success('Task deleted');
      onDeleted?.(task._id);
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const { data } = await commentAPI.create({ taskId: task._id, text: commentText });
      setComments(prev => [...prev, data.comment]);
      setCommentText('');
      setTimeout(() => commentEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentAPI.delete(commentId);
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleToggleChecklist = async (itemId, completed) => {
    try {
      const { data } = await taskAPI.updateChecklistItem(task._id, itemId, { completed });
      setTask(data.task);
    } catch {
      toast.error('Failed to update checklist');
    }
  };

  const handleAddChecklistItem = async (e) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;
    const updated = [...(task.checklist || []), { text: newCheckItem, completed: false }];
    await updateField('checklist', updated);
    setNewCheckItem('');
  };

  if (loading) return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 700, display: 'flex', justifyContent: 'center', padding: 60 }}>
        <span className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    </div>
  );

  if (!task) return null;

  const isOverdue = task.dueDate && new Date() > new Date(task.dueDate) && task.status !== 'done';
  const checklistDone = task.checklist?.filter(c => c.completed).length || 0;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 760, padding: 0, overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ flex: 1 }}>
            {editField === 'title' ? (
              <input
                className="form-input"
                defaultValue={task.title}
                autoFocus
                onBlur={(e) => updateField('title', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') updateField('title', e.target.value); if (e.key === 'Escape') setEditField(null); }}
                style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}
              />
            ) : (
              <h2
                style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', cursor: 'pointer', lineHeight: 1.3 }}
                onClick={() => setEditField('title')}
              >
                {task.title}
              </h2>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {/* Status */}
              <select
                className="badge"
                value={task.status}
                onChange={e => updateField('status', e.target.value)}
                style={{ background: 'var(--bg-4)', border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 99 }}
              >
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              {/* Priority */}
              <select
                className={`badge badge-${task.priority}`}
                value={task.priority}
                onChange={e => updateField('priority', e.target.value)}
                style={{ border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 99 }}
              >
                {PRIORITY_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              {isOverdue && <span className="badge" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>OVERDUE</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-danger btn-sm" onClick={handleDeleteTask}>Delete</button>
            <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ fontSize: '1.2rem', color: 'var(--text-3)' }}>✕</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', maxHeight: '75vh' }}>
          {/* Main content */}
          <div style={{ padding: '20px 24px', overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              {['details', 'activity'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: activeTab === tab ? 'var(--accent-2)' : 'var(--text-3)', fontWeight: activeTab === tab ? 700 : 400, textTransform: 'capitalize', borderBottom: activeTab === tab ? '2px solid var(--accent)' : 'none', borderRadius: 0 }}>
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'details' && (
              <>
                {/* Description */}
                <div style={{ marginBottom: 24 }}>
                  <div className="form-label" style={{ marginBottom: 8 }}>Description</div>
                  {editField === 'description' ? (
                    <textarea
                      className="form-input"
                      defaultValue={task.description || ''}
                      autoFocus
                      style={{ minHeight: 100 }}
                      onBlur={(e) => updateField('description', e.target.value)}
                    />
                  ) : (
                    <div
                      onClick={() => setEditField('description')}
                      style={{
                        minHeight: 60, padding: '10px 12px', background: 'var(--bg-3)',
                        borderRadius: 9, cursor: 'pointer', fontSize: '0.875rem',
                        color: task.description ? 'var(--text)' : 'var(--text-3)',
                        border: '1.5px solid transparent', transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                    >
                      {task.description || 'Click to add a description...'}
                    </div>
                  )}
                </div>

                {/* Checklist */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div className="form-label">
                      Checklist {task.checklist?.length > 0 && `(${checklistDone}/${task.checklist.length})`}
                    </div>
                  </div>
                  {task.checklist?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div className="progress-bar" style={{ marginBottom: 12 }}>
                        <div className="progress-bar-fill" style={{ width: `${task.checklist.length > 0 ? (checklistDone / task.checklist.length) * 100 : 0}%` }} />
                      </div>
                      {task.checklist.map((item) => (
                        <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={e => handleToggleChecklist(item._id, e.target.checked)}
                            style={{ cursor: 'pointer', accentColor: 'var(--accent)', width: 16, height: 16 }}
                          />
                          <span style={{ fontSize: '0.875rem', textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'var(--text-3)' : 'var(--text)', flex: 1 }}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <form onSubmit={handleAddChecklistItem} style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" placeholder="Add checklist item..." value={newCheckItem}
                      onChange={e => setNewCheckItem(e.target.value)} style={{ flex: 1 }} />
                    <button type="submit" className="btn btn-secondary btn-sm">Add</button>
                  </form>
                </div>

                {/* Comments */}
                <div>
                  <div className="form-label" style={{ marginBottom: 12 }}>Comments ({comments.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                    {comments.map((c) => (
                      <div key={c._id} style={{ display: 'flex', gap: 10 }}>
                        <div className="avatar avatar-sm" style={{ background: stringToColor(c.user?.name), flexShrink: 0 }}>
                          {initials(c.user?.name)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{c.user?.name}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{format(parseISO(c.createdAt), 'MMM d, h:mm a')}</span>
                            {c.isEdited && <span style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>(edited)</span>}
                          </div>
                          <div style={{ fontSize: '0.875rem', background: 'var(--bg-3)', padding: '8px 12px', borderRadius: 8, lineHeight: 1.5 }}>
                            {c.text}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={commentEndRef} />
                  </div>
                  <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 10 }}>
                    <textarea
                      className="form-input"
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      style={{ flex: 1, minHeight: 60, resize: 'none' }}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(e); } }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={submittingComment || !commentText.trim()}>
                      {submittingComment ? <span className="spinner" /> : '↑'}
                    </button>
                  </form>
                </div>
              </>
            )}

            {activeTab === 'activity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {task.activity?.length > 0 ? task.activity.slice().reverse().map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, fontSize: '0.8rem' }}>
                    <div className="avatar avatar-sm" style={{ background: 'var(--bg-4)', color: 'var(--text-3)', flexShrink: 0 }}>
                      {initials(a.user?.name || '?')}
                    </div>
                    <div>
                      <span style={{ fontWeight: 600 }}>{a.user?.name || 'System'}</span>
                      <span style={{ color: 'var(--text-3)' }}> {a.action}</span>
                      {a.oldValue && <span style={{ color: 'var(--text-3)' }}> from <em>{a.oldValue}</em> to <em>{a.newValue}</em></span>}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 2 }}>
                        {format(parseISO(a.timestamp), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </div>
                )) : (
                  <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>No activity yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div style={{ padding: '20px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <SidebarField label="Due Date">
              <input
                className="form-input"
                type="date"
                value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                onChange={e => updateField('dueDate', e.target.value || null)}
                style={{ fontSize: '0.82rem' }}
              />
              {isOverdue && <p style={{ fontSize: '0.72rem', color: 'var(--red)', marginTop: 4 }}>This task is overdue!</p>}
            </SidebarField>

            <SidebarField label="Assigned To">
              {project?.members?.map(m => {
                const u = m.user;
                const assigned = task.assignedTo?.some(a => (a._id || a) === u._id);
                return (
                  <button key={u._id} type="button"
                    onClick={() => {
                      const current = task.assignedTo?.map(a => a._id || a) || [];
                      const updated = assigned ? current.filter(id => id !== u._id) : [...current, u._id];
                      updateField('assignedTo', updated);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', width: '100%',
                      background: assigned ? 'var(--accent-glow)' : 'transparent',
                      border: assigned ? '1.5px solid var(--accent)' : '1.5px solid transparent',
                      borderRadius: 8, cursor: 'pointer', marginBottom: 6, transition: 'all 0.15s',
                      fontFamily: 'var(--font-body)',
                    }}>
                    <div className="avatar avatar-sm" style={{ background: stringToColor(u.name) }}>{initials(u.name)}</div>
                    <span style={{ fontSize: '0.82rem', color: assigned ? 'var(--accent-2)' : 'var(--text-2)' }}>{u.name}</span>
                    {assigned && <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: '0.8rem' }}>✓</span>}
                  </button>
                );
              })}
              {!project?.members?.length && <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>No members</p>}
            </SidebarField>

            <SidebarField label="Estimated Hours">
              <input
                className="form-input"
                type="number" min="0" step="0.5"
                value={task.estimatedHours || ''}
                onChange={e => updateField('estimatedHours', e.target.value)}
                style={{ fontSize: '0.82rem' }}
              />
            </SidebarField>

            <SidebarField label="Reporter">
              {task.reporter && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="avatar avatar-sm" style={{ background: stringToColor(task.reporter?.name) }}>
                    {initials(task.reporter?.name)}
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>{task.reporter?.name}</span>
                </div>
              )}
            </SidebarField>

            <SidebarField label="Created">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                {task.createdAt ? format(parseISO(task.createdAt), 'MMM d, yyyy') : '—'}
              </span>
            </SidebarField>

            {task.completedAt && (
              <SidebarField label="Completed">
                <span style={{ fontSize: '0.8rem', color: 'var(--green)' }}>
                  {format(parseISO(task.completedAt), 'MMM d, yyyy')}
                </span>
              </SidebarField>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarField({ label, children }) {
  return (
    <div>
      <div className="form-label" style={{ marginBottom: 7 }}>{label}</div>
      {children}
    </div>
  );
}
