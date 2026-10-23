import { axiosWithCreds } from './axiosInstances';

export const deleteFile = async (id, base = '') => {
  const { data } = await axiosWithCreds.delete(`${base}/file/${id}`);
  return data;
};

export const renameFile = async (id, newFilename, base = '') => {
  const { data } = await axiosWithCreds.patch(`${base}/file/${id}`, {
    newFilename,
  });
  return data;
};

export const uploadFileWithProgress = async (
  dirId,
  file,
  filename,
  filesize,
  onUploadProgress,
  base = '',
  signal,
) => {
  const { data } = await axiosWithCreds.post(
    `${base}/file/${dirId || ''}`,
    file,
    {
      headers: {
        'Content-Type': file.type,
        filename,
        filesize,
      },
      onUploadProgress,
      signal,
    },
  );
  return data;
};

// Builds the download/view URL for a file — used directly as href, not fetched via axios
export const getFileUrl = (id, base = '') => {
  return `${base}/file/${id}`;
};

export const getFileDownloadUrl = (id, base = '') => {
  return `${base}/file/${id}?action=download`;
};

// Asks the API (with the session cookie, as a normal request) for a short-lived
// signed storage URL, so opening/downloading never depends on the cookie being
// sent on a top-level navigation to the API domain.
export const fetchFileSignedUrl = async (id, { download = false, base = '' } = {}) => {
  const { data } = await axiosWithCreds.get(`${base}/file/${id}`, {
    params: { format: 'json', ...(download && { action: 'download' }) },
  });
  return data.url;
};

// Opens a file in a new tab. The tab is opened synchronously inside the click
// (so pop-up blockers allow it) and pointed at the signed URL once it arrives.
// Returns 'blocked' when the browser refuses the new tab; it never navigates
// the app tab away (that would also interrupt running uploads). If the signed
// URL can't be fetched, the new tab falls back to the plain API URL, which
// shows the server's error.
export const openFileInNewTab = async (id, base = '') => {
  const tab = window.open('', '_blank');
  if (!tab) return 'blocked';
  tab.opener = null;
  try {
    tab.location.href = await fetchFileSignedUrl(id, { base });
  } catch {
    tab.location.href = `${import.meta.env.VITE_BACKEND_BASE_URL}${getFileUrl(id, base)}`;
  }
  return 'opened';
};

// Starts a download through the signed attachment URL without leaving the app.
export const downloadFile = async (id, base = '') => {
  let url;
  try {
    url = await fetchFileSignedUrl(id, { download: true, base });
  } catch {
    url = `${import.meta.env.VITE_BACKEND_BASE_URL}${getFileDownloadUrl(id, base)}`;
  }
  const a = document.createElement('a');
  a.href = url;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export const moveFile = async (id, newParentId, base = '') => {
  const { data } = await axiosWithCreds.patch(`${base}/file/${id}/move`, {
    newParentId,
  });
  return data;
};

export const restoreFile = async (id) => {
  const { data } = await axiosWithCreds.patch(`/file/${id}/restore`);
  return data;
};
export const permanentlyDeleteFile = async (id) => {
  const { data } = await axiosWithCreds.delete(`/file/${id}/permanent`);
  return data;
};