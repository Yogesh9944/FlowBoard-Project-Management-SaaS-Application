import api from './axios';

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Workspaces
export const workspaceAPI = {
  getAll: () => api.get('/workspaces'),
  getOne: (id) => api.get(`/workspaces/${id}`),
  create: (data) => api.post('/workspaces', data),
  update: (id, data) => api.put(`/workspaces/${id}`, data),
  delete: (id) => api.delete(`/workspaces/${id}`),
  inviteMember: (id, data) => api.post(`/workspaces/${id}/invite`, data),
  removeMember: (id, userId) => api.delete(`/workspaces/${id}/members/${userId}`),
  updateMemberRole: (id, userId, data) => api.put(`/workspaces/${id}/members/${userId}`, data),
};

// Projects
export const projectAPI = {
  getByWorkspace: (workspaceId) => api.get(`/projects/workspace/${workspaceId}`),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getStats: (id) => api.get(`/projects/${id}/stats`),
};

// Boards
export const boardAPI = {
  getByProject: (projectId) => api.get(`/boards/project/${projectId}`),
  create: (data) => api.post('/boards', data),
  update: (id, data) => api.put(`/boards/${id}`, data),
  delete: (id) => api.delete(`/boards/${id}`),
  reorder: (data) => api.put('/boards/reorder', data),
};

// Tasks
export const taskAPI = {
  getByBoard: (boardId) => api.get(`/tasks/board/${boardId}`),
  getByProject: (projectId, params) => api.get(`/tasks/project/${projectId}`, { params }),
  getMyTasks: () => api.get('/tasks/my'),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  move: (id, data) => api.put(`/tasks/${id}/move`, data),
  updateChecklistItem: (id, itemId, data) => api.put(`/tasks/${id}/checklist/${itemId}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// Comments
export const commentAPI = {
  getByTask: (taskId) => api.get(`/comments/task/${taskId}`),
  create: (data) => api.post('/comments', data),
  update: (id, data) => api.put(`/comments/${id}`, data),
  delete: (id) => api.delete(`/comments/${id}`),
  react: (id, data) => api.post(`/comments/${id}/react`, data),
};
