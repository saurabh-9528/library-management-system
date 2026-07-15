import API from './axiosConfig';

export const reserveBook = async (bookId, memberId) => {
  const response = await API.post('/reservations/reserve', { bookId, memberId });
  return response.data.data;
};

export const cancelReservation = async (resId) => {
  const response = await API.post('/reservations/cancel', { resId });
  return response.data.data;
};

export const getReservations = async (params = {}) => {
  const response = await API.get('/reservations', { params });
  return response.data.data;
};
export default {
  reserveBook,
  cancelReservation,
  getReservations
};
