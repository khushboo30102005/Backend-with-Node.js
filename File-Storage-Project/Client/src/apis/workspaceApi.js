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

export const listWorkspaceFiles = async (id) => {
  const { data } = await axiosWithCreds.get(`/workspace/${id}/files`);
  return data;
};

export const uploadWorkspaceFile = async (id, file, onUploadProgress, signal) => {
  const { data } = await axiosWithCreds.post(`/workspace/${id}/files`, file, {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      filename: file.name,
      filesize: file.size,
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
