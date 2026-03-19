import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { projectAPI } from '../../api/services';
import CreateWorkspaceModal from '../workspace/CreateWorkspaceModal';

const icons = {
  home: '⊞', tasks: '✓', settings: '⚙', plus: '+', workspace: '▦', chevron: '›', board: '▤', logout: '↪',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace, fetchWorkspaces } = useWorkspace();
  const [projects, setProjects] = useState([]);
  const [expanded, setExpanded] = useState(true);
  const [showCreateWS, setShowCreateWS] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchWorkspaces(); }, []);

  useEffect(() => {
    if (activeWorkspace?._id) {
      projectAPI.getByWorkspace(activeWorkspace._id)
        .then(({ data }) => setProjects(data.projects))
        .catch(() => setProjects([]));
    }
  }, [activeWorkspace]);

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <aside style={{
        width: 'var(--sidebar-w)', position: 'fixed', top: 0, left: 0, height: '100vh',
        background: 'var(--bg-2)', borderRight: '1.5px solid var(--border)',
        display: 'flex', flexDirection: 'column', zIndex: 100, overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <div style={{
              width: 32, height: 32, background: 'var(--accent)', borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fff',
              boxShadow: '0 0 16px var(--accent-glow)'
            }}>F</div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
              FlowBoard
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
          <NavItem to="/" icon="⊞" label="Dashboard" end />
          <NavItem to="/my-tasks" icon="✓" label="My Tasks" />

          {/* Workspace Section */}
          <div style={{ marginTop: 20, marginBottom: 6 }}>
            <div className="flex items-center justify-between" style={{ padding: '0 8px', marginBottom: 6 }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Workspaces
              </span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreateWS(true)} style={{ padding: '3px 5px', fontSize: '1rem', color: 'var(--text-3)' }} title="New workspace">+</button>
            </div>

            {workspaces.map((ws) => (
              <div key={ws._id}>
                <button
                  className="dropdown-item"
                  style={{
                    background: activeWorkspace?._id === ws._id ? 'var(--bg-4)' : 'transparent',
                    color: activeWorkspace?._id === ws._id ? 'var(--text)' : 'var(--text-2)',
                    width: '100%', borderRadius: 8, marginBottom: 2,
                  }}
                  onClick={() => { setActiveWorkspace(ws); navigate(`/workspace/${ws._id}`); }}
                >
                  <span style={{ fontSize: '1rem' }}>{ws.icon}</span>
                  <span className="truncate" style={{ flex: 1, textAlign: 'left', fontSize: '0.875rem', fontWeight: 500 }}>{ws.name}</span>
                </button>

                {/* Projects under active workspace */}
                {activeWorkspace?._id === ws._id && projects.length > 0 && (
                  <div style={{ paddingLeft: 12, marginBottom: 4 }}>
                    {projects.map((proj) => (
                      <NavLink
                        key={proj._id}
                        to={`/project/${proj._id}`}
                        style={({ isActive }) => ({
                          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                          borderRadius: 8, fontSize: '0.825rem', color: isActive ? 'var(--text)' : 'var(--text-3)',
                          background: isActive ? 'var(--bg-4)' : 'transparent',
                          marginBottom: 2, textDecoration: 'none', transition: 'all var(--transition)',
                        })}
                      >
                        <span style={{ fontSize: '0.8rem' }}>{proj.icon}</span>
                        <span className="truncate">{proj.title}</span>
                        <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: proj.color || 'var(--accent)', flexShrink: 0 }} />
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {workspaces.length === 0 && (
              <button
                className="btn btn-secondary w-full"
                style={{ marginTop: 8, fontSize: '0.8rem' }}
                onClick={() => setShowCreateWS(true)}
              >
                Create your first workspace
              </button>
            )}
          </div>
        </nav>

        {/* Bottom user */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <NavItem to="/settings" icon="⚙" label="Settings" />
          <div className="flex items-center gap-2" style={{ padding: '10px 8px', marginTop: 4 }}>
            <div className="avatar avatar-sm" style={{ background: 'var(--accent)' }}>{initials(user?.name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="truncate" style={{ fontSize: '0.825rem', fontWeight: 600 }}>{user?.name}</div>
              <div className="truncate" style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{user?.email}</div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={logout} title="Logout" style={{ color: 'var(--text-3)' }}>↪</button>
          </div>
        </div>
      </aside>

      {showCreateWS && <CreateWorkspaceModal onClose={() => setShowCreateWS(false)} />}
    </>
  );
}

function NavItem({ to, icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 10px', borderRadius: 9, marginBottom: 3,
        fontSize: '0.875rem', fontWeight: 500,
        color: isActive ? 'var(--text)' : 'var(--text-2)',
        background: isActive ? 'var(--bg-4)' : 'transparent',
        textDecoration: 'none', transition: 'all var(--transition)',
        borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
      })}
    >
      <span style={{ fontSize: '1rem', width: 18, textAlign: 'center' }}>{icon}</span>
      {label}
    </NavLink>
  );
}
