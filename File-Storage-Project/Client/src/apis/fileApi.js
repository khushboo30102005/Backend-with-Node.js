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
  onUploadProgress,
  base = '',
) => {
  const { data } = await axiosWithCreds.post(
    `${base}/file/${dirId || ''}`,
    file,
    {
      headers: {
        'Content-Type': file.type,
        filename,
      },
      onUploadProgress,
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