import { axiosWithCreds } from './axiosInstances';

export const shareFile = async (fileId, targetUserId, permission) => {
  const { data } = await axiosWithCreds.post('/share', {
    fileId,
    targetUserId,
    permission,
  });
  return data;
};

export const getFileShares = async (fileId) => {
  const { data } = await axiosWithCreds.get(`/share/${fileId}`);
  return data;
};

export const updateSharePermission = async (shareId, permission) => {
  const { data } = await axiosWithCreds.patch(`/share/${shareId}`, {
    permission,
  });
  return data;
};

export const removeShare = async (shareId) => {
  const { data } = await axiosWithCreds.delete(`/share/${shareId}`);
  return data;
};

export const getSharedWithMe = async () => {
  const { data } = await axiosWithCreds.get('/share/with-me');
  return data;
};

