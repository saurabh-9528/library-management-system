import API from './axiosConfig';

export const login = async (email, password) => {
  const response = await API.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (name, email, password, role = 'admin') => {
  const response = await API.post('/auth/register', { name, email, password, role });
  return response.data;
};

export const logout = async () => {
  const response = await API.post('/auth/logout');
  return response.data;
};
