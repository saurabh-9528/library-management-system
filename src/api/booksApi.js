import API from './axiosConfig';

export const getBooks = async (params = {}) => {
  const response = await API.get('/books', { params });
  return response.data.data;
};

export const getBookById = async (id) => {
  const response = await API.get(`/books/${id}`);
  return response.data.data;
};

export const addBook = async (bookData) => {
  const response = await API.post('/books', bookData);
  return response.data.data;
};

export const updateBook = async (id, bookData) => {
  const response = await API.put(`/books/${id}`, bookData);
  return response.data.data;
};

export const deleteBook = async (id) => {
  const response = await API.delete(`/books/${id}`);
  return response.data.data;
};
