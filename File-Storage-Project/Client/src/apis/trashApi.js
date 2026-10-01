import { axiosWithCreds } from './axiosInstances';

export const getTrash = async () => {
  const { data } = await axiosWithCreds.get('/trash');
  return data;
};