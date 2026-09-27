/* Admin frontend client for jobs endpoints.
 * Talks to CGS admin routes with the operator bearer token. */
import { cgs_api } from './client';
import { BackgroundJob, PaginatedResponse, PaginationParams } from '../types';

export const jobsApi = {
  getJobs: async (params?: PaginationParams): Promise<PaginatedResponse<BackgroundJob>> => {
    const res = await cgs_api.get('/jobs', { params });
    const payload = res.data?.data || res.data || {};
    const list: BackgroundJob[] = Array.isArray(payload) ? payload : payload.data || [];
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

  retryJob: async (id: string): Promise<BackgroundJob> => {
    const res = await cgs_api.post(`/jobs/${id}/retry`);
    return res.data?.data || res.data;
  },
};
