import { axiosWithCreds } from './axiosInstances';

export const getNotifications = async () => {
  const { data } = await axiosWithCreds.get('/share/notifications');
  return data; // { unreadCount, notifications: [...] }
};

export const markNotificationsSeen = async (shareIds) => {
  await axiosWithCreds.post('/share/notifications/seen', { shareIds });
};