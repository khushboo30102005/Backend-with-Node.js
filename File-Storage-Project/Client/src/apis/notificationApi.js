import { axiosWithCreds } from './axiosInstances';

export const getNotifications = async () => {
  const { data } = await axiosWithCreds.get('/share/notifications');
  return data; // { unreadCount, notifications: [...] }
};

export const markNotificationsSeen = async (shareIds) => {
  await axiosWithCreds.post('/share/notifications/seen', { shareIds });
};

export const getWorkspaceNotifications = async () => {
  const { data } = await axiosWithCreds.get('/workspace/notifications');
  return data; // { unreadCount, notifications: [{ type: 'workspace', ... }] }
};

export const markWorkspaceNotificationsSeen = async (workspaceIds) => {
  await axiosWithCreds.post('/workspace/notifications/seen', { workspaceIds });
};
