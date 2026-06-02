import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;
    const body =
      typeof data === 'string'
        ? data
        : data?.error || data?.detail || data?.message;
    const message =
      body ||
      (error.code === 'ERR_NETWORK' || !error.response
        ? 'Cannot reach API. Start Django on port 8000 (python manage.py runserver).'
        : 'An unexpected error occurred.');
    error.userMessage = message;
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export const complaintService = {
  submit: (formData) => api.post('/complaints/submit/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getStatus: (trackingId) => api.get(`/complaints/status/${trackingId}/`),
};

export default api;
