/* Admin frontend client for auth endpoints.
 * Talks to CGS admin routes with the operator bearer token. */
import { AdminUser } from '../types';
import { cgs_api } from './client';
import { ROLE_PERMISSIONS } from '../utils/permissions';

function mapAdminUser(raw: any): AdminUser {
  const role = (raw?.role || 'PLATFORM_ADMIN') as AdminUser['role'];
  const permissions =
    Array.isArray(raw?.permissions) && raw.permissions.length > 0
      ? raw.permissions
      : ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.SUPER_ADMIN;

  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    role,
    permissions,
    status: raw.status || 'ACTIVE',
    lastLoginAt: raw.lastLoginAt || new Date().toISOString(),
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export const authApi = {
  login: async (email: string, password?: string): Promise<{ token: string; user: AdminUser }> => {
    const res = await cgs_api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password: password || '',
    });
    const payload = res.data?.data || res.data;
    const token = payload?.accessToken || payload?.token;
    if (!token || !payload?.user) {
      throw new Error('Invalid authentication response from server.');
    }
    return { token, user: mapAdminUser(payload.user) };
  },

  getCurrentUser: async (): Promise<AdminUser> => {
    const res = await cgs_api.get('/auth/me');
    const raw = res.data?.data || res.data;
    if (!raw?.id) {
      throw new Error('Unable to restore admin session.');
    }
    return mapAdminUser(raw);
  },

  logout: async (): Promise<{ success: boolean }> => {
    try {
      await cgs_api.post('/auth/logout');
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem('cgs_admin_token');
    localStorage.removeItem('cgs_admin_user');
    return { success: true };
  },
};
