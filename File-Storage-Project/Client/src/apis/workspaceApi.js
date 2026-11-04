import { axiosWithCreds } from './axiosInstances';

export const listWorkspaces = async () => {
  const { data } = await axiosWithCreds.get('/workspace');
  return data;
};

export const createWorkspace = async (payload) => {
  const { data } = await axiosWithCreds.post('/workspace', payload);
  return data;
};

export const getWorkspace = async (id) => {
  const { data } = await axiosWithCreds.get(`/workspace/${id}`);
  return data;
};

export const updateWorkspace = async (id, payload) => {
  const { data } = await axiosWithCreds.patch(`/workspace/${id}`, payload);
  return data;
};

export const deleteWorkspace = async (id) => {
  const { data } = await axiosWithCreds.delete(`/workspace/${id}`);
  return data;
};

export const addWorkspaceMember = async (id, userId, role) => {
  const { data } = await axiosWithCreds.post(`/workspace/${id}/members`, { userId, role });
  return data;
};

export const updateWorkspaceMember = async (id, userId, role) => {
  const { data } = await axiosWithCreds.patch(`/workspace/${id}/members/${userId}`, { role });
  return data;
};

export const removeWorkspaceMember = async (id, userId) => {
  const { data } = await axiosWithCreds.delete(`/workspace/${id}/members/${userId}`);
  return data;
};

export const transferWorkspace = async (id, userId) => {
  const { data } = await axiosWithCreds.post(`/workspace/${id}/transfer`, { userId });
  return data;
};

export const listWorkspaceFiles = async (id, folderId) => {
  const { data } = await axiosWithCreds.get(`/workspace/${id}/files`, {
    params: folderId ? { folderId } : {},
  });
  return data; // { folder, breadcrumb, folders, files }
};

export const uploadWorkspaceFile = async (id, file, onUploadProgress, signal, folderId) => {
  const { data } = await axiosWithCreds.post(`/workspace/${id}/files`, file, {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      filename: file.name,
      filesize: file.size,
      ...(folderId && { folderId }),
    },
    onUploadProgress,
    signal,
  });
  return data;
};

export const renameWorkspaceFile = async (id, fileId, newFilename) => {
  const { data } = await axiosWithCreds.patch(`/workspace/${id}/files/${fileId}`, { newFilename });
  return data;
};

export const deleteWorkspaceFile = async (id, fileId) => {
  const { data } = await axiosWithCreds.delete(`/workspace/${id}/files/${fileId}`);
  return data;
};

export const reactivateWorkspace = async (id, expiresAt) => {
  const { data } = await axiosWithCreds.post(`/workspace/${id}/reactivate`, { expiresAt });
  return data;
};

export const acceptInvitation = async (id) => {
  const { data } = await axiosWithCreds.post(`/workspace/${id}/invitation/accept`);
  return data;
};

export const declineInvitation = async (id) => {
  const { data } = await axiosWithCreds.post(`/workspace/${id}/invitation/decline`);
  return data;
};

export const listWorkspaceFolders = async (id) => {
  const { data } = await axiosWithCreds.get(`/workspace/${id}/folders`);
  return data;
};

export const createWorkspaceFolder = async (id, name, parentId) => {
  const { data } = await axiosWithCreds.post(`/workspace/${id}/folders`, { name, parentId: parentId || null });
  return data;
};

export const renameWorkspaceFolder = async (id, folderId, name) => {
  const { data } = await axiosWithCreds.patch(`/workspace/${id}/folders/${folderId}`, { name });
  return data;
};

export const deleteWorkspaceFolder = async (id, folderId) => {
  const { data } = await axiosWithCreds.delete(`/workspace/${id}/folders/${folderId}`);
  return data;
};

export const moveWorkspaceFile = async (id, fileId, folderId) => {
  const { data } = await axiosWithCreds.patch(`/workspace/${id}/files/${fileId}/move`, { folderId: folderId || null });
  return data;
};

export const importDriveFile = async (id, fileId, folderId) => {
  const { data } = await axiosWithCreds.post(`/workspace/${id}/files/import`, { fileId, folderId: folderId || null });
  return data;
};

export const saveWorkspaceFileToDrive = async (id, fileId) => {
  const { data } = await axiosWithCreds.post(`/workspace/${id}/files/${fileId}/save-to-drive`, {});
  return data;
};

export const listWorkspaceActivity = async (id, before) => {
  const { data } = await axiosWithCreds.get(`/workspace/${id}/activity`, {
    params: before ? { before } : {},
  });
  return data; // { hasMore, items }
};

export const searchWorkspaceFiles = async (q) => {
  const { data } = await axiosWithCreds.get('/workspace/search', { params: { q } });
  return data;
};

export const adminListWorkspaces = async () => {
  const { data } = await axiosWithCreds.get('/workspace/admin/all');
  return data;
};

export const adminRetryCleanup = async (id) => {
  const { data } = await axiosWithCreds.post(`/workspace/admin/${id}/retry-cleanup`);
  return data;
};

// Same shapes the shared FileViewer expects, scoped to one workspace.
export const workspaceFileSource = (id) => ({
  getUrl: async (fileId) => {
    const { data } = await axiosWithCreds.get(`/workspace/${id}/files/${fileId}`, {
      params: { format: 'json' },
    });
    return data.url;
  },
  getText: async (fileId) => {
    const { data } = await axiosWithCreds.get(`/workspace/${id}/files/${fileId}`, {
      params: { format: 'text' },
      responseType: 'text',
      transformResponse: (d) => d,
    });
    return data;
  },
  download: async (fileId) => {
    const { data } = await axiosWithCreds.get(`/workspace/${id}/files/${fileId}`, {
      params: { format: 'json', action: 'download' },
    });
    const a = document.createElement('a');
    a.href = data.url;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  },
});
