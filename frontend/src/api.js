import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  // Don't set a default Content-Type — Axios auto-detects it per request.
  // Setting 'application/json' here breaks multipart/form-data retries
  // when the 401 interceptor re-sends the original request.
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(
            `${API_BASE}/api/auth/token/refresh/`,
            { refresh },
          );
          localStorage.setItem("access_token", data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch (err) {
          console.warn(
            "[api] Token refresh failed, redirecting to login:",
            err?.response?.status,
          );
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

// Auth
export const authAPI = {
  signup: (data) => api.post("/auth/signup/", data),
  login: (data) => api.post("/auth/login/", data),
  me: () => api.get("/auth/me/"),
  updateProfile: (data) =>
    api.patch("/auth/me/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  verifyEmail: (code) => api.post("/auth/verify-email/", { code }), // deprecated — email is auto-verified on signup
  resendVerification: () => api.post("/auth/resend-verification/"), // deprecated — returns 410 Gone
  deleteAvatar: () => api.delete("/auth/me/avatar/"),
  enable2FA: () => api.post("/auth/2fa/enable/"),
  confirm2FA: (code) => api.post("/auth/2fa/confirm/", { code }),
  disable2FA: () => api.post("/auth/2fa/disable/"),
  forgotPassword: (email) => api.post("/auth/forgot-password/", { email }),
  resetPassword: (data) => api.post("/auth/reset-password/", data),
};

// Rooms
export const roomsAPI = {
  list: (params) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.archived) query.set('archived', 'true');
    const qs = query.toString();
    return api.get(`/rooms/${qs ? `?${qs}` : ''}`);
  },
  get: (id) => api.get(`/rooms/${id}/`),
  create: (data) =>
    api.post("/rooms/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, data) =>
    api.patch(`/rooms/${id}/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/rooms/${id}/`),
  join: (code) => api.post("/rooms/join/", { invite_code: code }),
  leave: (id) => api.post(`/rooms/${id}/leave/`),
  members: (id) => api.get(`/rooms/${id}/members/`),
  manageMember: (id, data) => api.post(`/rooms/${id}/manage_member/`, data),
  archive: (id) => api.post(`/rooms/${id}/archive/`),
  unarchive: (id) => api.post(`/rooms/${id}/unarchive/`),
};

// Sections
export const sectionsAPI = {
  list: (roomId) => api.get(`/sections/?room=${roomId}`),
  create: (data) => api.post("/sections/", data),
  update: (id, data) => api.patch(`/sections/${id}/`, data),
  delete: (id) => api.delete(`/sections/${id}/`),
};

// Content
export const contentAPI = {
  list: (roomId) => api.get(`/content/?room=${roomId}`),
  create: (data) =>
    api.post("/content/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, data) =>
    api.patch(`/content/${id}/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/content/${id}/`),
  bulkDelete: (ids) => api.post("/content/bulk_delete/", { ids }),
};

// Assignments
export const assignmentsAPI = {
  list: (roomId) => api.get(`/assignments/?room=${roomId}`),
  get: (id) => api.get(`/assignments/${id}/`),
  create: (data) =>
    api.post("/assignments/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, data) => api.patch(`/assignments/${id}/`, data),
  delete: (id) => api.delete(`/assignments/${id}/`),
  bulkDelete: (ids) => api.post("/assignments/bulk_delete/", { ids }),
};

// Submissions
export const submissionsAPI = {
  list: (assignmentId) => api.get(`/submissions/?assignment=${assignmentId}`),
  create: (data) =>
    api.post("/submissions/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/submissions/${id}/`),
  grade: (id, data) => api.post(`/submissions/${id}/grade/`, data),
  resubmit: (id) => api.delete(`/submissions/${id}/resubmit/`),
  bulkGrade: (grades) => api.post("/submissions/bulk_grade/", { grades }),
};

// Announcements
export const announcementsAPI = {
  list: (roomId) => api.get(`/announcements/?room=${roomId}`),
  get: (id) => api.get(`/announcements/${id}/`),
  create: (data) => api.post("/announcements/", data),
  update: (id, data) => api.patch(`/announcements/${id}/`, data),
  delete: (id) => api.delete(`/announcements/${id}/`),
};

// Comments
export const commentsAPI = {
  list: (announcementId) =>
    api.get(`/comments/?announcement=${announcementId}`),
  create: (data) => api.post("/comments/", data),
};

// Notifications
export const notificationsAPI = {
  list: () => api.get("/notifications/"),
  read: (id) => api.post(`/notifications/${id}/read/`),
  readAll: () => api.post("/notifications/read_all/"),
  unreadCount: () => api.get("/notifications/unread_count/"),
  delete: (id) => api.delete(`/notifications/${id}/`),
  deleteAll: () => api.delete("/notifications/delete_all/"),
};

// Grades
export const gradesAPI = {
  overview: () => api.get("/grades/overview/"),
};

// Assignment CSV export
export const exportAPI = {
  assignmentGrades: (assignmentId) =>
    api.get(`/assignments/${assignmentId}/export_grades/`, {
      responseType: "blob",
    }),
};

export default api;
