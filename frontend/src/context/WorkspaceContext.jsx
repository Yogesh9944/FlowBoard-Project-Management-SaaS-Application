import { createContext, useContext, useState, useCallback } from 'react';
import { workspaceAPI } from '../api/services';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await workspaceAPI.getAll();
      setWorkspaces(data.workspaces);
      if (data.workspaces.length > 0 && !activeWorkspace) {
        setActiveWorkspace(data.workspaces[0]);
      }
      return data.workspaces;
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  const createWorkspace = useCallback(async (formData) => {
    const { data } = await workspaceAPI.create(formData);
    setWorkspaces((prev) => [data.workspace, ...prev]);
    setActiveWorkspace(data.workspace);
    return data.workspace;
  }, []);

  const updateWorkspace = useCallback(async (id, formData) => {
    const { data } = await workspaceAPI.update(id, formData);
    setWorkspaces((prev) => prev.map((w) => (w._id === id ? data.workspace : w)));
    if (activeWorkspace?._id === id) setActiveWorkspace(data.workspace);
    return data.workspace;
  }, [activeWorkspace]);

  const deleteWorkspace = useCallback(async (id) => {
    await workspaceAPI.delete(id);
    setWorkspaces((prev) => prev.filter((w) => w._id !== id));
    if (activeWorkspace?._id === id) {
      setActiveWorkspace(workspaces.find((w) => w._id !== id) || null);
    }
  }, [activeWorkspace, workspaces]);

  return (
    <WorkspaceContext.Provider value={{
      workspaces, activeWorkspace, loading,
      setActiveWorkspace, fetchWorkspaces,
      createWorkspace, updateWorkspace, deleteWorkspace,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
};
