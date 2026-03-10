/**
 * ISET Classroom — API Client
 * Handles JWT authentication, token refresh, and all API endpoints.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://isetkl-classroom.gleeze.com';

/** Current app version — update this on each release */
export const APP_VERSION = '1.0.0';

/** Resolve a media path like /media/... to an absolute URL */
export function getMediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

class ApiClient {
  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  setTokens(access: string, refresh: string) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  hasTokens(): boolean {
    return !!this.getAccessToken() && !!this.getRefreshToken();
  }

  async request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}/api${path}`;
    const headers: Record<string, string> = {};

    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    let response = await fetch(url, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
    });

    // Auto-refresh on 401
    if (response.status === 401 && this.getRefreshToken()) {
      try {
        const refreshResp = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: this.getRefreshToken() }),
        });

        if (refreshResp.ok) {
          const data = await refreshResp.json();
          localStorage.setItem('access_token', data.access);
          headers['Authorization'] = `Bearer ${data.access}`;
          response = await fetch(url, {
            ...options,
            headers: { ...headers, ...(options.headers as Record<string, string>) },
          });
        } else {
          this.clearTokens();
          throw { status: 401, detail: 'Session expired' };
        }
      } catch (e: any) {
        if (e?.status === 401) throw e;
        this.clearTokens();
        throw { status: 401, detail: 'Session expired' };
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw { status: response.status, ...error };
    }

    if (response.status === 204) return null as T;
    return response.json();
  }

  get<T = any>(path: string) {
    return this.request<T>(path);
  }

  /** GET a list endpoint — auto-unwraps DRF paginated responses */
  async getList<T = any>(path: string): Promise<T[]> {
    const data = await this.request<any>(path);
    if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.results)) {
      return data.results;
    }
    if (Array.isArray(data)) return data;
    return [];
  }

  post<T = any>(path: string, data?: any) {
    const body = data instanceof FormData ? data : data ? JSON.stringify(data) : undefined;
    return this.request<T>(path, { method: 'POST', body });
  }

  patch<T = any>(path: string, data?: any) {
    const body = data instanceof FormData ? data : data ? JSON.stringify(data) : undefined;
    return this.request<T>(path, { method: 'PATCH', body });
  }

  delete<T = any>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

/* ─── Auth ──────────────────────────────────────────── */
export const authAPI = {
  signup: (data: { first_name: string; last_name: string; email: string; password: string; role: string }) =>
    api.post('/auth/signup/', data),
  login: (data: { email: string; password: string; totp_code?: string }) =>
    api.post('/auth/login/', data),
  me: () => api.get('/auth/me/'),
  updateProfile: (data: FormData) => api.patch('/auth/me/', data),
  deleteAvatar: () => api.delete('/auth/me/avatar/'),
  enable2FA: () => api.post('/auth/2fa/enable/'),
  confirm2FA: (code: string) => api.post('/auth/2fa/confirm/', { code }),
  disable2FA: () => api.post('/auth/2fa/disable/'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password/', { email }),
  resetPassword: (data: { email: string; code: string; new_password: string }) =>
    api.post('/auth/reset-password/', data),
};

/* ─── Rooms ─────────────────────────────────────────── */
export const roomsAPI = {
  list: (params?: { search?: string; archived?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.archived) query.set('archived', 'true');
    const qs = query.toString();
    return api.getList(`/rooms/${qs ? `?${qs}` : ''}`);
  },
  get: (id: number) => api.get(`/rooms/${id}/`),
  create: (data: FormData) => api.post('/rooms/', data),
  update: (id: number, data: FormData) => api.patch(`/rooms/${id}/`, data),
  delete: (id: number) => api.delete(`/rooms/${id}/`),
  join: (code: string) => api.post('/rooms/join/', { invite_code: code }),
  leave: (id: number) => api.post(`/rooms/${id}/leave/`),
  members: (id: number) => api.get(`/rooms/${id}/members/`),
  manageMember: (id: number, data: any) => api.post(`/rooms/${id}/manage_member/`, data),
  archive: (id: number) => api.post(`/rooms/${id}/archive/`),
  unarchive: (id: number) => api.post(`/rooms/${id}/unarchive/`),
};

/* ─── Sections ──────────────────────────────────────── */
export const sectionsAPI = {
  list: (roomId: number) => api.getList(`/sections/?room=${roomId}`),
  create: (data: any) => api.post('/sections/', data),
  update: (id: number, data: any) => api.patch(`/sections/${id}/`, data),
  delete: (id: number) => api.delete(`/sections/${id}/`),
};

/* ─── Content ───────────────────────────────────────── */
export const contentAPI = {
  list: (roomId: number) => api.getList(`/content/?room=${roomId}`),
  create: (data: FormData) => api.post('/content/', data),
  update: (id: number, data: FormData) => api.patch(`/content/${id}/`, data),
  delete: (id: number) => api.delete(`/content/${id}/`),
  bulkDelete: (ids: number[]) => api.post('/content/bulk_delete/', { ids }),
};

/* ─── Assignments ───────────────────────────────────── */
export const assignmentsAPI = {
  list: (roomId: number) => api.getList(`/assignments/?room=${roomId}`),
  get: (id: number) => api.get(`/assignments/${id}/`),
  create: (data: FormData) => api.post('/assignments/', data),
  update: (id: number, data: any) => api.patch(`/assignments/${id}/`, data),
  delete: (id: number) => api.delete(`/assignments/${id}/`),
  bulkDelete: (ids: number[]) => api.post('/assignments/bulk_delete/', { ids }),
};

/* ─── Submissions ───────────────────────────────────── */
export const submissionsAPI = {
  list: (assignmentId: number) => api.getList(`/submissions/?assignment=${assignmentId}`),
  create: (data: FormData) => api.post('/submissions/', data),
  delete: (id: number) => api.delete(`/submissions/${id}/`),
  grade: (id: number, data: { score: number; feedback?: string }) =>
    api.post(`/submissions/${id}/grade/`, data),
  resubmit: (id: number) => api.delete(`/submissions/${id}/resubmit/`),
  bulkGrade: (grades: { submission_id: number; score: number; feedback?: string }[]) =>
    api.post('/submissions/bulk_grade/', { grades }),
};

/* ─── Announcements ─────────────────────────────────── */
export const announcementsAPI = {
  list: (roomId: number) => api.getList(`/announcements/?room=${roomId}`),
  get: (id: number) => api.get(`/announcements/${id}/`),
  create: (data: any) => api.post('/announcements/', data),
  update: (id: number, data: any) => api.patch(`/announcements/${id}/`, data),
  delete: (id: number) => api.delete(`/announcements/${id}/`),
};

/* ─── Comments ──────────────────────────────────────── */
export const commentsAPI = {
  list: (announcementId: number) => api.getList(`/comments/?announcement=${announcementId}`),
  create: (data: { announcement: number; body: string }) => api.post('/comments/', data),
};

/* ─── Notifications ─────────────────────────────────── */
export const notificationsAPI = {
  list: () => api.getList('/notifications/'),
  read: (id: number) => api.post(`/notifications/${id}/read/`),
  readAll: () => api.post('/notifications/read_all/'),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread_count/'),
  delete: (id: number) => api.delete(`/notifications/${id}/`),
  deleteAll: () => api.delete('/notifications/delete_all/'),
};

/* ─── Grades ────────────────────────────────────────── */
export const gradesAPI = {
  overview: () => api.get('/grades/overview/'),
};

/* ─── App Version ───────────────────────────────────── */
export const versionAPI = {
  check: (v: string) => api.request<{
    needs_update: boolean;
    min_version: string;
    message: string;
    update_url: string;
  }>(`/app/version-check/?v=${encodeURIComponent(v)}`, { method: 'GET' }),
  getConfig: () => api.get('/app/version-config/'),
  updateConfig: (data: {
    min_version?: string;
    is_locked?: boolean;
    lock_message?: string;
    update_url?: string;
  }) => api.request('/app/version-config/', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};
