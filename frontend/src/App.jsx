import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import WorkspacePage from './pages/WorkspacePage';
import ProjectBoardPage from './pages/ProjectBoardPage';
import ProjectListPage from './pages/ProjectListPage';
import MyTasksPage from './pages/MyTasksPage';
import SettingsPage from './pages/SettingsPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
    <Route path="/" element={<ProtectedRoute><WorkspaceProvider><AppLayout /></WorkspaceProvider></ProtectedRoute>}>
      <Route index element={<DashboardPage />} />
      <Route path="workspace/:workspaceId" element={<WorkspacePage />} />
      <Route path="workspace/:workspaceId/projects" element={<ProjectListPage />} />
      <Route path="project/:projectId" element={<ProjectBoardPage />} />
      <Route path="my-tasks" element={<MyTasksPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e1e28', color: '#f0f0f5', border: '1.5px solid rgba(255,255,255,0.1)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem' },
            success: { iconTheme: { primary: '#22d3a0', secondary: '#0a0a0f' } },
            error: { iconTheme: { primary: '#f75c6a', secondary: '#0a0a0f' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
