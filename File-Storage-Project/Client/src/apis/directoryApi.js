import { axiosWithCreds } from './axiosInstances';

export const getDirectoryItems = async (dirId = '', base = '') => {
  const { data } = await axiosWithCreds.get(`${base}/directory/${dirId}`);
  return data;
};

export const createDirectory = async (dirId = '', newDirname, base = '') => {
  const { data } = await axiosWithCreds.post(
    `${base}/directory/${dirId}`,
    {},
    { headers: { dirname: newDirname } },
  );
  return data;
};

export const deleteDirectory = async (id, base = '') => {
  const { data } = await axiosWithCreds.delete(`${base}/directory/${id}`);
  return data;
};

export const renameDirectory = async (id, newDirName, base = '') => {
  const { data } = await axiosWithCreds.patch(`${base}/directory/${id}`, {
    newDirName,
  });
  return data;
};