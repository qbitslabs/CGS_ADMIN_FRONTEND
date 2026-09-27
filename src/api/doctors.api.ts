/* Admin frontend client for doctors endpoints.
 * Talks to CGS admin routes with the operator bearer token. */
import { cgs_api } from './client';

export interface DoctorRecord {
  id: string;
  clinicId: string;
  clinicName: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  specialization: string;
  qualification?: string;
  registrationNo?: string;
  experienceYears: number;
  consultationFee: number;
  availabilityDays: string[];
  availabilityHours: string;
  isActive: boolean;
  servicesCount: number;
  appointmentsCount: number;
  services: Array<{
    serviceId: string;
    serviceName: string;
    price: number;
    durationMinutes: number;
  }>;
  schedules: any[];
}

export const doctorsApi = {
  getDoctors: async (params?: { clinicId?: string; specialization?: string; isActive?: boolean; search?: string }): Promise<DoctorRecord[]> => {
    const res = await cgs_api.get('/doctors', { params });
    const raw = res.data?.data || res.data || [];
    const list = Array.isArray(raw) ? raw : [];
    return list.map((d: any) => ({
      id: d.id,
      clinicId: d.clinicId,
      clinicName: d.clinicName,
      userId: d.userId || d.id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      specialization: d.specialization || 'General Dentistry',
      qualification: d.qualification,
      registrationNo: d.registrationNo,
      experienceYears: d.experienceYears || 0,
      consultationFee: d.consultationFee || 0,
      availabilityDays: d.availabilityDays || [],
      availabilityHours: d.availabilityHours || '',
      isActive: d.isActive !== false,
      servicesCount: d.services?.length || 0,
      appointmentsCount: d.stats?.totalAppointments || 0,
      services: (d.services || []).map((s: any) => ({
        serviceId: s.id || s.serviceId,
        serviceName: s.name || s.serviceName,
        price: s.price || 0,
        durationMinutes: s.duration || s.durationMinutes || 30,
      })),
      schedules: d.schedules || [],
    }));
  },

  getDoctorById: async (id: string): Promise<DoctorRecord> => {
    const res = await cgs_api.get(`/doctors/${id}`);
    const d = res.data?.data || res.data;
    if (!d) throw new Error('Doctor not found');
    return {
      id: d.id,
      clinicId: d.clinicId,
      clinicName: d.clinicName || d.clinic?.name || 'Clinic',
      userId: d.userId || d.user?.id || d.id,
      name: d.name || `${d.user?.firstName || ''} ${d.user?.lastName || ''}`.trim(),
      email: d.email || d.user?.email || '',
      phone: d.phone || d.user?.phone || '',
      specialization: d.specialization || 'General Dentistry',
      qualification: d.qualification,
      registrationNo: d.registrationNo,
      experienceYears: d.experienceYears || 0,
      consultationFee: d.consultationFee ? Number(d.consultationFee) : 500,
      availabilityDays: d.availabilityDays || [],
      availabilityHours: d.availabilityHours || '',
      isActive: d.isActive !== false,
      servicesCount: d.services?.length || d.servicesCount || 0,
      appointmentsCount: d.stats?.totalAppointments || d.appointmentsCount || 0,
      services: (d.services || []).map((s: any) => ({
        serviceId: s.id || s.serviceId,
        serviceName: s.name || s.serviceName,
        price: s.price ? Number(s.price) : 0,
        durationMinutes: s.duration || s.durationMinutes || 30,
      })),
      schedules: (d.schedules || []).map((sch: any) => ({
        id: sch.id,
        dayOfWeek: sch.dayOfWeek,
        startTime: sch.startTime,
        endTime: sch.endTime,
        slotDurationMinutes: sch.slotDurationMinutes || 30,
        isAvailable: sch.isAvailable !== false,
      })),
    };
  },

  getDoctorAnalytics: async (id: string): Promise<any> => {
    const res = await cgs_api.get(`/doctors/${id}/analytics`);
    return res.data?.data || res.data;
  },

  updateDoctorAiConfig: async (id: string, payload: any): Promise<any> => {
    const res = await cgs_api.patch(`/doctors/${id}/ai-config`, payload);
    return res.data?.data || res.data;
  },
};
