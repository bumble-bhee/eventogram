import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL + '/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

export const getEvents = (params) => API.get('/events', { params });
export const getEventById = (id) => API.get(`/events/${id}`);
export const createEvent = (data) => API.post('/events', data);

export const getEventMedia = (eventId, params) => API.get(`/events/${eventId}/media`, { params });
export const getMediaById = (eventId, mediaId) => API.get(`/events/${eventId}/media/${mediaId}`);
export const uploadMedia = (eventId, formData) =>
  API.post(`/events/${eventId}/media/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const toggleLike = (mediaId) => API.post(`/social/like/${mediaId}`);
export const addComment = (mediaId, data) => API.post(`/social/comment/${mediaId}`, data);
export const getComments = (mediaId) => API.get(`/social/comments/${mediaId}`);
export const toggleFavourite = (mediaId) => API.post(`/social/favourite/${mediaId}`);
export const downloadMedia = (mediaId) =>
  API.get(`/social/download/${mediaId}`, { responseType: 'blob' });

export const searchMedia = (params) => API.get('/search', { params });
export const saveFaceDescriptor = (data) => API.post('/face/save-descriptor', data);
export const findMyPhotos = () => API.get('/face/my-photos');
export const updateAvatar = (formData) =>
  API.post('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const getNotifications = () => API.get('/social/notifications');
export const markNotificationsRead = () => API.put('/social/notifications/read');
export const searchUsers = (query) => API.get(`/auth/users/search?query=${query}`);
export default API;