import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI } from '../api/services';
import { format, parseISO, isAfter } from 'date-fns';
import TaskDetailModal from '../components/task/TaskDetailModal';
import toast from 'react-hot-toast';

const PRIORITY_DOT = { low: '#5c5c78', medium: '#f5c542', high: '#f7934c', critical: '#f75c6a' };

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filter, setFilter] = useState({ priority: '', sort: 'dueDate' });

  useEffect(() => {
    taskAPI.getMyTasks()
      .then(({ data }) => setTasks(data.tasks || []))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tasks
    .filter(t => !filter.priority || t.priority === filter.priority)
    .sort((a, b) => {
      if (filter.sort === 'dueDate') return (a.dueDate || '9999') > (b.dueDate || '9999') ? 1 : -1;
      if (filter.sort === 'priority') {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return (order[a.priority] || 3) - (order[b.priority] || 3);
      }
      return 0;
    });

  const overdueTasks = filtered.filter(t => t.dueDate && isAfter(new Date(), parseISO(t.dueDate)));
  const todayTasks = filtered.filter(t => {
    if (!t.dueDate) return false;
    return parseISO(t.dueDate).toDateString() === new Date().toDateString();
  });
  const upcomingTasks = filtered.filter(t => {
    if (!t.dueDate) return false;
    const d = parseISO(t.dueDate);
    return d > new Date() && d.toDateString() !== new Date().toDateString();
  });
  const noDueTasks = filtered.filter(t => !t.dueDate);

  const handleTaskUpdated = (updatedTask) => {
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? { ...t, ...updatedTask } : t));
  };
  const handleTaskDeleted = (taskId) => {
    setTasks(prev => prev.filter(t => t._id !== taskId));
    setSelectedTask(null);
  };

  if (loading) return (
    <div style={{ padding: 32 }}>
      <div className="skeleton" style={{ height: 80, marginBottom: 24, borderRadius: 16 }} />
      {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60, marginBottom: 10, borderRadius: 10 }} />)}
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">My Tasks</h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginTop: 4 }}>
              {tasks.length} tasks assigned to you
            </p>
          </div>
          <div className="flex gap-2">
            <select className="form-select" value={filter.priority} onChange={e => setFilter({ ...filter, priority: e.target.value })}
              style={{ height: 36, fontSize: '0.85rem' }}>
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select className="form-select" value={filter.sort} onChange={e => setFilter({ ...filter, sort: e.target.value })}
              style={{ height: 36, fontSize: '0.85rem' }}>
              <option value="dueDate">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
            </select>
          </div>
        </div>
      </div>

      <div className="page-content">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🎉</span>
            <h3>No tasks!</h3>
            <p>You have no open tasks assigned to you. Enjoy the peace!</p>
          </div>
        ) : (
          <>
            <TaskGroup title="Overdue" count={overdueTasks.length} tasks={overdueTasks} color="var(--red)" onSelect={setSelectedTask} />
            <TaskGroup title="Due Today" count={todayTasks.length} tasks={todayTasks} color="var(--yellow)" onSelect={setSelectedTask} />
            <TaskGroup title="Upcoming" count={upcomingTasks.length} tasks={upcomingTasks} color="var(--blue)" onSelect={setSelectedTask} />
            <TaskGroup title="No Due Date" count={noDueTasks.length} tasks={noDueTasks} color="var(--text-3)" onSelect={setSelectedTask} />
          </>
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask._id}
          project={selectedTask.project}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
}

function TaskGroup({ title, count, tasks, color, onSelect }) {
  const [collapsed, setCollapsed] = useState(false);
  if (count === 0) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700, color }}>
          {title}
        </h2>
        <span style={{ background: `${color}22`, color, fontSize: '0.72rem', fontWeight: 700, padding: '1px 8px', borderRadius: 99 }}>
          {count}
        </span>
        <span style={{ color: 'var(--text-3)', fontSize: '0.75rem', marginLeft: 4 }}>{collapsed ? '›' : '⌄'}</span>
      </button>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tasks.map(task => (
            <TaskRow key={task._id} task={task} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onSelect }) {
  const isOverdue = task.dueDate && isAfter(new Date(), parseISO(task.dueDate));

  return (
    <div
      className="card"
      onClick={() => onSelect(task)}
      style={{ padding: '11px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_DOT[task.priority] || 'var(--text-3)', flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="truncate" style={{ fontSize: '0.875rem', fontWeight: 500 }}>{task.title}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 3, fontSize: '0.75rem', color: 'var(--text-3)' }}>
          {task.project?.title && (
            <span>{task.project.icon} {task.project.title}</span>
          )}
          {task.board?.name && <span>· {task.board.name}</span>}
        </div>
      </div>

      <span className={`badge badge-${task.priority}`} style={{ fontSize: '0.68rem' }}>{task.priority}</span>

      {task.dueDate && (
        <span style={{ fontSize: '0.72rem', color: isOverdue ? 'var(--red)' : 'var(--text-3)', fontWeight: isOverdue ? 600 : 400, flexShrink: 0 }}>
          {isOverdue ? '⚠ ' : ''}{format(parseISO(task.dueDate), 'MMM d')}
        </span>
      )}

      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>→</span>
    </div>
  );
}
