import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectAPI } from '../api/services';
import CreateProjectModal from '../components/project/CreateProjectModal';
import toast from 'react-hot-toast';

export default function ProjectListPage() {
  const { workspaceId } = useParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    projectAPI.getByWorkspace(workspaceId)
      .then(({ data }) => setProjects(data.projects))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const filtered = projects.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <h1 className="page-title">All Projects</h1>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Project</button>
        </div>
        <div style={{ marginTop: 14, maxWidth: 320 }}>
          <input className="form-input" placeholder="🔍  Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🗂️</span>
            <h3>{search ? 'No results' : 'No projects yet'}</h3>
            <p>{search ? `No projects match "${search}"` : 'Create your first project to get started.'}</p>
            {!search && <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: 8 }}>Create Project</button>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map(proj => (
              <Link to={`/project/${proj._id}`} key={proj._id} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: 0, overflow: 'hidden', transition: 'transform 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  <div style={{ height: 5, background: proj.color || 'var(--accent)' }} />
                  <div style={{ padding: '16px 18px' }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                      <span style={{ fontSize: '1.2rem' }}>{proj.icon}</span>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{proj.title}</h3>
                    </div>
                    {proj.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {proj.description}
                      </p>
                    )}
                    <div className="progress-bar" style={{ marginBottom: 10 }}>
                      <div className="progress-bar-fill" style={{ width: `${proj.stats?.progress || 0}%`, background: proj.color || 'var(--accent)' }} />
                    </div>
                    <div className="flex justify-between" style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                      <span>{proj.stats?.totalTasks || 0} tasks · {proj.stats?.progress || 0}% done</span>
                      <span className={`badge badge-${proj.priority}`} style={{ fontSize: '0.65rem' }}>{proj.priority}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateProjectModal
          workspaceId={workspaceId}
          onClose={() => setShowCreate(false)}
          onCreated={(proj) => { setProjects(prev => [proj, ...prev]); setShowCreate(false); }}
        />
      )}
    </div>
  );
}
