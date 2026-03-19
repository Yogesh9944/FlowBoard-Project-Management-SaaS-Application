import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { taskAPI, projectAPI } from '../api/services';
import { format, isAfter, parseISO } from 'date-fns';

const PRIORITY_COLOR = { low: 'var(--text-3)', medium: 'var(--yellow)', high: 'var(--orange)', critical: 'var(--red)' };
const PRIORITY_DOT = { low: '#5c5c78', medium: '#f5c542', high: '#f7934c', critical: '#f75c6a' };

export default function DashboardPage() {
  const { user } = useAuth();
  const { workspaces, activeWorkspace } = useWorkspace();
  const [myTasks, setMyTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [tasksRes] = await Promise.all([taskAPI.getMyTasks()]);
        setMyTasks(tasksRes.data.tasks || []);
        if (activeWorkspace?._id) {
          const projRes = await projectAPI.getByWorkspace(activeWorkspace._id);
          setProjects(projRes.data.projects || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeWorkspace]);

  const overdueTasks = myTasks.filter(t => t.dueDate && isAfter(new Date(), parseISO(t.dueDate)));
  const todayTasks = myTasks.filter(t => {
    if (!t.dueDate) return false;
    const due = parseISO(t.dueDate);
    const today = new Date();
    return due.toDateString() === today.toDateString();
  });

  const greetingTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return (
    <div style={{ padding: 32 }}>
      <div className="skeleton" style={{ height: 80, marginBottom: 24, borderRadius: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />)}
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header" style={{ background: 'linear-gradient(135deg, var(--bg-2) 0%, var(--bg) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>{greetingTime()}, {user?.name?.split(' ')[0]} 👋</h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>
              {format(new Date(), 'EEEE, MMMM d, yyyy')} · {activeWorkspace ? activeWorkspace.name : 'No workspace selected'}
            </p>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard icon="📋" label="My Open Tasks" value={myTasks.length} color="var(--accent)" />
          <StatCard icon="⚠️" label="Overdue" value={overdueTasks.length} color="var(--red)" alert={overdueTasks.length > 0} />
          <StatCard icon="📅" label="Due Today" value={todayTasks.length} color="var(--yellow)" />
          <StatCard icon="🗂️" label="Active Projects" value={projects.length} color="var(--green)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          {/* My Tasks */}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-heading)' }}>My Tasks</h2>
              <Link to="/my-tasks" style={{ fontSize: '0.8rem', color: 'var(--accent-2)' }}>View all →</Link>
            </div>

            {myTasks.length === 0 ? (
              <div className="card empty-state" style={{ padding: '48px 20px' }}>
                <span className="empty-state-icon">✓</span>
                <h3>All clear!</h3>
                <p>No tasks assigned to you right now.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {myTasks.slice(0, 8).map(task => (
                  <TaskRow key={task._id} task={task} />
                ))}
              </div>
            )}
          </div>

          {/* Projects */}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-heading)' }}>Projects</h2>
              {activeWorkspace && (
                <Link to={`/workspace/${activeWorkspace._id}/projects`} style={{ fontSize: '0.8rem', color: 'var(--accent-2)' }}>All →</Link>
              )}
            </div>

            {projects.length === 0 ? (
              <div className="card" style={{ padding: 28, textAlign: 'center' }}>
                <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>No projects yet in this workspace.</p>
                {activeWorkspace && (
                  <Link to={`/workspace/${activeWorkspace._id}`} className="btn btn-primary btn-sm" style={{ marginTop: 14, display: 'inline-flex' }}>
                    Create Project
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {projects.slice(0, 6).map(proj => (
                  <ProjectRow key={proj._id} project={proj} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, alert }) {
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden', padding: 22 }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 80, height: 80,
        background: color, opacity: 0.07, borderRadius: '0 0 0 80px',
      }} />
      <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', fontWeight: 800, color, lineHeight: 1 }}>
        {value}
        {alert && value > 0 && <span style={{ width: 8, height: 8, background: 'var(--red)', borderRadius: '50%', display: 'inline-block', marginLeft: 6, verticalAlign: 'middle', animation: 'pulse 2s infinite' }} />}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function TaskRow({ task }) {
  const overdue = task.dueDate && isAfter(new Date(), parseISO(task.dueDate));
  return (
    <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_DOT[task.priority] || 'var(--text-3)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="truncate" style={{ fontSize: '0.875rem', fontWeight: 500 }}>{task.title}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>
          {task.project?.title} · {task.board?.name}
        </div>
      </div>
      {task.dueDate && (
        <span style={{ fontSize: '0.72rem', color: overdue ? 'var(--red)' : 'var(--text-3)', flexShrink: 0, fontWeight: overdue ? 600 : 400 }}>
          {overdue ? '⚠ ' : ''}{format(parseISO(task.dueDate), 'MMM d')}
        </span>
      )}
    </div>
  );
}

function ProjectRow({ project }) {
  const progress = project.stats?.progress || 0;
  return (
    <Link to={`/project/${project._id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ padding: '14px 16px' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
          <span>{project.icon}</span>
          <span className="truncate" style={{ fontWeight: 600, fontSize: '0.875rem', flex: 1 }}>{project.title}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', flexShrink: 0 }}>{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.72rem', color: 'var(--text-3)' }}>
          <span>{project.stats?.totalTasks || 0} tasks</span>
          <span>{project.stats?.doneTasks || 0} done</span>
        </div>
      </div>
    </Link>
  );
}
