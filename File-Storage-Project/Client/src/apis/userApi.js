import { axiosWithCreds, axiosWithoutCreds } from './axiosInstances';

export const fetchUser = async () => {
  const { data } = await axiosWithCreds.get('/user');
  return data;
};

export const fetchAllUsers = async () => {
  const { data } = await axiosWithCreds.get('/users');
  return data;
};

export const fetchDeletedUsers = async () => {
  const { data } = await axiosWithCreds.get('/users/deleted');
  return data;
};

export const logoutUser = async () => {
  const { data } = await axiosWithCreds.post('/user/logout');
  return data;
};

export const logoutAllSessions = async () => {
  const { data } = await axiosWithCreds.post('/user/logout-all');
  return data;
};

export const logoutUserById = async (id) => {
  const { data } = await axiosWithCreds.post(`/users/${id}/logout`);
  return data;
};

export const loginUser = async (formData) => {
  const { data } = await axiosWithCreds.post('/user/login', formData);
  return data;
};

export const registerUser = async (formData) => {
  const { data } = await axiosWithoutCreds.post('/user/register', formData);
  return data;
};

// Soft delete
export const deleteUserById = async (id) => {
  const { data } = await axiosWithCreds.delete(`/users/${id}`);
  return data;
};

// Permanent delete
export const hardDeleteUserById = async (id) => {
  const { data } = await axiosWithCreds.delete(`/users/${id}/hard`);
  return data;
};

export const recoverUser = async (id) => {
  const { data } = await axiosWithCreds.patch(`/users/${id}/recover`);
  return data;
};

export const changeUserRole = async (id, role) => {
  const { data } = await axiosWithCreds.patch(`/users/${id}/role`, { role });
  return data;
};