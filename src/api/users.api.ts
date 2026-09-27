/* Admin frontend client for users endpoints.
 * Talks to CGS admin routes with the operator bearer token. */
import { cgs_api } from './client';
import { PaginatedResponse, PaginationParams, PlatformUser } from '../types';

export const usersApi = {
  getUsers: async (params?: PaginationParams): Promise<PaginatedResponse<PlatformUser>> => {
    const res = await cgs_api.get('/users', { params });
    const payload = res.data?.data || res.data || {};
    const list: PlatformUser[] = Array.isArray(payload) ? payload : payload.data || [];
    const pageSize = params?.pageSize || payload.pageSize || 20;
    const total = payload.total ?? list.length;
    return {
      data: list,
      total,
      page: payload.page || params?.page || 1,
      pageSize,
      totalPages: payload.totalPages || Math.ceil(total / pageSize) || 1,
    };
  },
};
