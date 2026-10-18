import { axiosWithCreds } from './axiosInstances';

export const getStorageSummary = async () => {
  const { data } = await axiosWithCreds.get('/storage/summary');
  return data;
};