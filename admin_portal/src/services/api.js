import axios from 'axios';
import { getAdminAuthHeader } from './auth';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const h = getAdminAuthHeader();
  if (h) config.headers = { ...config.headers, Authorization: h };
  return config;
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
        : error.response?.status === 401
          ? 'Unauthorized. Please log in.'
          : error.response?.status === 403
            ? 'Forbidden. Admin access required.'
        : 'An unexpected error occurred.');
    error.userMessage = message;
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export const adminService = {
  getComplaints: () => api.get('/management/complaints/'),
  getComplaintDetail: (complaintId) => api.get(`/management/complaints/${complaintId}/`),
  updateStatus: (complaintId, status, adminRemarks = '') =>
    api.patch(`/management/complaints/${complaintId}/update/`, {
      status,
      ...(adminRemarks.trim() ? { admin_remarks: adminRemarks.trim() } : {}),
    }),
  getAnalytics: () => api.get('/analytics/summary/'),
};

export default api;
