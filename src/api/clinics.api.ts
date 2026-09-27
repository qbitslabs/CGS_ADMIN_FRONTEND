/* Admin frontend client for clinics endpoints.
 * Talks to CGS admin routes with the operator bearer token. */
import { cgs_api } from './client';
import { Clinic, ClinicDetail, PaginatedResponse, PaginationParams, PlatformUser } from '../types';

export const clinicsApi = {
  getClinics: async (params?: PaginationParams): Promise<PaginatedResponse<Clinic>> => {
    const res = await cgs_api.get('/clinics', { params });
    const payload = res.data?.data || res.data || {};
    const clinicsList: Clinic[] = Array.isArray(payload) ? payload : payload.data || [];
    const pageSize = params?.pageSize || payload.pageSize || 20;
    const total = payload.total ?? clinicsList.length;
    return {
      data: clinicsList,
      total,
      page: payload.page || params?.page || 1,
      pageSize,
      totalPages: payload.totalPages || Math.ceil(total / pageSize) || 1,
    };
  },

  getClinicById: async (id: string): Promise<ClinicDetail> => {
    const res = await cgs_api.get(`/clinics/${id}`);
    return res.data?.data || res.data;
  },

  updateClinicStatus: async (
    id: string,
    status: Clinic['status'],
    reason?: string
  ): Promise<Clinic> => {
    const res = await cgs_api.patch(`/clinics/${id}`, { status, reason });
    return res.data?.data || res.data;
  },

  createClinic: async (payload: Record<string, unknown> | Partial<Clinic>): Promise<ClinicDetail> => {
    const res = await cgs_api.post('/clinics', payload);
    return res.data?.data || res.data;
  },

  addClinicUserProfile: async (clinicId: string, payload: Partial<PlatformUser>): Promise<PlatformUser> => {
    const res = await cgs_api.post(`/clinics/${clinicId}/users`, payload);
    return res.data?.data || res.data;
  },

  setPrimaryDoctor: async (clinicId: string, userId: string): Promise<ClinicDetail> => {
    const res = await cgs_api.patch(`/clinics/${clinicId}/primary-doctor`, { userId });
    return res.data?.data || res.data;
  },
};
