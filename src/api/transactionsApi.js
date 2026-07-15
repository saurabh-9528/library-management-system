import API from './axiosConfig';

export const borrowBook = async (bookId, memberId, dueDate) => {
  const response = await API.post('/transactions/borrow', { bookId, memberId, dueDate });
  return response.data.data;
};

export const returnBook = async (txnId) => {
  const response = await API.post('/transactions/return', { txnId });
  return response.data.data;
};

export const getTransactionHistory = async (params = {}) => {
  const response = await API.get('/transactions/history', { params });
  return response.data.data;
};

export const getStats = async () => {
  const response = await API.get('/dashboard/stats');
  return response.data.data;
};
