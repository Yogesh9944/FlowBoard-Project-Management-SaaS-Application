import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { projectAPI, workspaceAPI } from '../api/services';
import CreateProjectModal from '../components/project/CreateProjectModal';
import InviteMemberModal from '../components/workspace/InviteMemberModal';
import toast from 'react-hot-toast';

const PRIORITY_COLOR = { low: 'var(--text-3)', medium: 'var(--yellow)', high: 'var(--orange)', critical: 'var(--red)' };

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const [workspace, setWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [wsRes, projRes] = await Promise.all([
          workspaceAPI.getOne(workspaceId),
          projectAPI.getByWorkspace(workspaceId),
        ]);
        setWorkspace(wsRes.data.workspace);
        setProjects(projRes.data.projects);
        setActiveWorkspace(wsRes.data.workspace);
      } catch (e) {
        toast.error('Failed to load workspace');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [workspaceId]);

  const handleProjectCreated = (proj) => {
    setProjects((prev) => [proj, ...prev]);
    setShowCreateProject(false);
  };

  const handleDeleteProject = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await projectAPI.delete(id);
      setProjects((prev) => prev.filter(p => p._id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  if (loading) return (
    <div style={{ padding: 32 }}>
      <div className="skeleton" style={{ height: 100, borderRadius: 16, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />)}
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: workspace?.color || 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
            }}>{workspace?.icon}</div>
            <div>
              <h1 className="page-title">{workspace?.name}</h1>
              <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginTop: 2 }}>
                {workspace?.members?.length} members · {projects.length} projects
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={() => setShowInvite(true)}>
              <span>+</span> Invite Member
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreateProject(true)}>
              <span>+</span> New Project
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Members row */}
        {workspace?.members && (
          <div className="flex items-center gap-2" style={{ marginBottom: 24 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginRight: 4 }}>Team:</span>
            {workspace.members.slice(0, 8).map((m) => (
              <div key={m.user._id} className="avatar avatar-sm"
                data-tooltip={`${m.user.name} (${m.role})`}
                style={{ background: stringToColor(m.user.name) }}>
                {initials(m.user.name)}
              </div>
            ))}
            {workspace.members.length > 8 && (
              <div className="avatar avatar-sm" style={{ background: 'var(--bg-4)', color: 'var(--text-2)' }}>
                +{workspace.members.length - 8}
              </div>
            )}
          </div>
        )}

        {/* Projects grid */}
        {projects.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 40 }}>
            <span className="empty-state-icon">🗂️</span>
            <h3>No projects yet</h3>
            <p>Create your first project to start organizing tasks and boards.</p>
            <button className="btn btn-primary" onClick={() => setShowCreateProject(true)} style={{ marginTop: 8 }}>
              Create Project
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {projects.map((proj) => (
              <ProjectCard key={proj._id} project={proj} onDelete={handleDeleteProject} />
            ))}
            {/* Add card */}
            <button
              onClick={() => setShowCreateProject(true)}
              style={{
                background: 'transparent', border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-lg)', padding: 28, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 10, color: 'var(--text-3)', transition: 'all var(--transition)', minHeight: 180,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
            >
              <span style={{ fontSize: '1.8rem' }}>+</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>New Project</span>
            </button>
          </div>
        )}
      </div>

      {showCreateProject && (
        <CreateProjectModal
          workspaceId={workspaceId}
          members={workspace?.members || []}
          onClose={() => setShowCreateProject(false)}
          onCreated={handleProjectCreated}
        />
      )}
      {showInvite && (
        <InviteMemberModal
          workspaceId={workspaceId}
          onClose={() => setShowInvite(false)}
          onInvited={(ws) => setWorkspace(ws)}
        />
      )}
    </div>
  );
}

function ProjectCard({ project, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const progress = project.stats?.progress || 0;

  return (
    <div className="card" style={{ position: 'relative', padding: 0, overflow: 'hidden' }}>
      {/* Color strip */}
      <div style={{ height: 4, background: project.color || 'var(--accent)' }} />
      <div style={{ padding: '18px 20px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '1.2rem' }}>{project.icon}</span>
            <h3 className="truncate" style={{ fontSize: '0.95rem', fontWeight: 700, maxWidth: 170 }}>{project.title}</h3>
          </div>
          <div style={{ position: 'relative' }}>
            <button className="btn btn-ghost btn-icon" style={{ color: 'var(--text-3)', fontSize: '1rem' }}
              onClick={() => setShowMenu(!showMenu)}>⋯</button>
            {showMenu && (
              <div className="dropdown-menu" style={{ right: 0, top: '100%' }} onClick={() => setShowMenu(false)}>
                <Link to={`/project/${project._id}`} className="dropdown-item">Open Board</Link>
                <button className="dropdown-item danger" onClick={() => onDelete(project._id)}>Delete</button>
              </div>
            )}
          </div>
        </div>

        {project.description && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.description}
          </p>
        )}

        <div style={{ marginBottom: 12 }}>
          <div className="flex justify-between" style={{ marginBottom: 5, fontSize: '0.75rem', color: 'var(--text-3)' }}>
            <span>{project.stats?.doneTasks || 0} / {project.stats?.totalTasks || 0} tasks</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%`, background: project.color || 'var(--accent)' }} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex" style={{ gap: -4 }}>
            {project.members?.slice(0, 4).map((m, i) => (
              <div key={m.user._id || i} className="avatar avatar-sm"
                style={{ background: stringToColor(m.user?.name || '?'), marginLeft: i > 0 ? -6 : 0, border: '2px solid var(--bg-2)', zIndex: 4 - i }}>
                {initials(m.user?.name)}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {project.stats?.overdueTasks > 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--red)', background: 'var(--red-bg)', padding: '2px 7px', borderRadius: 99, fontWeight: 600 }}>
                {project.stats.overdueTasks} overdue
              </span>
            )}
            <Link to={`/project/${project._id}`} className="btn btn-secondary btn-sm">Open →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function initials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str?.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['#7c6af7', '#22d3a0', '#f5c542', '#4da6ff', '#f7934c', '#e879f9'];
  return colors[Math.abs(hash) % colors.length];
}
