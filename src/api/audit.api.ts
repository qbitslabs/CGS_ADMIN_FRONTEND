/* Admin frontend client for audit endpoints.
 * Talks to CGS admin routes with the operator bearer token. */
import { cgs_api } from './client';
import { AuditLog, PaginatedResponse, PaginationParams } from '../types';

export const auditApi = {
  getLogs: async (params?: PaginationParams): Promise<PaginatedResponse<AuditLog>> => {
    const res = await cgs_api.get('/audit-logs', { params });
    const payload = res.data?.data || res.data || {};
    const list: AuditLog[] = Array.isArray(payload) ? payload : payload.data || [];
    const pageSize = params?.pageSize || payload.pageSize || 25;
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
