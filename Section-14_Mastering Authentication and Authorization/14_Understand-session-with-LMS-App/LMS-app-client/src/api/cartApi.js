import axiosInstance from './axiosInstance';

export const getCartApi = async () => {
  const { data } = await axiosInstance.get('/cart');
  return data;
};

export const deleteCartItemApi = async (courseId) => {
  const { data } = await axiosInstance.delete(`/cart/${courseId}`);
  return data;
};

export const addToCartApi = async (courseId) => {
  const { data } = await axiosInstance.post('/cart', { courseId });
  return data;
};
