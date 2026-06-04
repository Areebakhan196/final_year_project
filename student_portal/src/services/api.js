import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('student_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;

    let body = null;

    if (typeof data === 'string') {
      // Plain-text / HTML error (e.g. CSRF failure)
      body = data;
    } else if (data) {
      // DRF standard: { detail: "..." }
      if (data.detail) body = data.detail;
      // Our custom views: { error: "..." } or { message: "..." }
      else if (data.error) body = data.error;
      else if (data.message) body = data.message;
      // DRF Serializer validation: { non_field_errors: ["..."] }
      else if (Array.isArray(data.non_field_errors) && data.non_field_errors.length)
        body = data.non_field_errors[0];
      // DRF field-level errors: { email: ["..."], password: ["..."], ... }
      else {
        const firstField = Object.values(data).find(
          (v) => Array.isArray(v) && v.length
        );
        if (firstField) body = firstField[0];
      }
    }

    const message =
      body ||
      (error.code === 'ERR_NETWORK' || !error.response
        ? 'Cannot reach API. Is Django running on port 8000?'
        : 'An unexpected error occurred.');

    error.userMessage = message;
    console.error('API Error:', error.response?.status, data);
    return Promise.reject(error);
  }
);


export const authService = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: () => api.post('/auth/logout/'),
  forgotPassword: (data) => api.post('/auth/forgot-password/', data),
  getMe: () => api.get('/auth/me/'),
};

export const complaintService = {
  submit: (formData) => api.post('/complaints/submit/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getStatus: (trackingId) => api.get(`/complaints/status/${trackingId}/`),
  getById: (complaintId) => api.get(`/complaints/mine/${complaintId}/`),
  listMine: () => api.get('/complaints/mine/'),
};

export default api;
