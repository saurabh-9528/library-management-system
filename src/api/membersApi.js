import API from './axiosConfig';

export const getMembers = async (params = {}) => {
  const response = await API.get('/members', { params });
  return response.data.data;
};

export const getMemberById = async (id) => {
  const response = await API.get(`/members/${id}`);
  return response.data.data;
};

export const addMember = async (memberData) => {
  const response = await API.post('/members', memberData);
  return response.data.data;
};

export const updateMember = async (id, memberData) => {
  const response = await API.put(`/members/${id}`, memberData);
  return response.data.data;
};

export const deleteMember = async (id) => {
  const response = await API.delete(`/members/${id}`);
  return response.data.data;
};
