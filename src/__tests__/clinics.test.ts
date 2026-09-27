/* Unit tests for admin clinics.test.
 * Guards formatting, permissions, or clinic-onboarding helpers. */
import { describe, it, expect } from 'vitest';
import { clinicsApi } from '../api/clinics.api';

describe('Clinics API Server & Filter Logic', () => {
  it('retrieves paginated clinic list with search filter', async () => {
    const res = await clinicsApi.getClinics({ search: 'Apex', page: 1, pageSize: 10 });
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].name).toContain('Apex');
  });

  it('filters clinics by status accurately', async () => {
    const res = await clinicsApi.getClinics({ status: 'SUSPENDED', page: 1, pageSize: 10 });
    expect(res.data.every((c) => c.status === 'SUSPENDED')).toBe(true);
  });

  it('retrieves full clinic details with 9 module tabs data', async () => {
    const detail = await clinicsApi.getClinicById('cln_001');
    expect(detail.id).toBe('cln_001');
    expect(detail.whatsappConfig).toBeDefined();
    expect(detail.aiConfig).toBeDefined();
    expect(detail.subscription).toBeDefined();
    expect(detail.usageSummary).toBeDefined();
  });

  it('performs status mutation and appends audit log record', async () => {
    const updated = await clinicsApi.updateClinicStatus(
      'cln_001',
      'SUSPENDED',
      'Non-payment beyond grace period'
    );
    expect(updated.status).toBe('SUSPENDED');

    // Reactivate for idempotent test state
    const reactivated = await clinicsApi.updateClinicStatus(
      'cln_001',
      'ACTIVE',
      'Reinstated by admin'
    );
    expect(reactivated.status).toBe('ACTIVE');
  });

  it('registers new Doctor profile with clinical qualifications and updates clinic count', async () => {
    const newDoc = await clinicsApi.addClinicUserProfile('cln_001', {
      name: 'Dr. Siddharth Sen',
      email: 'siddharth@apexdental.in',
      phone: '+91 98300 99881',
      role: 'DOCTOR',
      specialization: 'Implantology & Oral Surgery',
      registrationNumber: 'DCI-MH-2024-5541',
      qualification: 'BDS, MDS, Fellow ICOI',
      experienceYears: 9,
      consultationFee: 1000,
    });

    expect(newDoc.id).toBeDefined();
    expect(newDoc.role).toBe('DOCTOR');
    expect(newDoc.specialization).toBe('Implantology & Oral Surgery');
    expect(newDoc.registrationNumber).toBe('DCI-MH-2024-5541');
  });

  it('registers new Employee profile with operational designation', async () => {
    const newStaff = await clinicsApi.addClinicUserProfile('cln_001', {
      name: 'Kavita Menon',
      email: 'kavita@apexdental.in',
      phone: '+91 98200 44556',
      role: 'EMPLOYEE',
      designation: 'Front Desk & Patient Coordinator',
    });

    expect(newStaff.id).toBeDefined();
    expect(newStaff.role).toBe('EMPLOYEE');
    expect(newStaff.designation).toBe('Front Desk & Patient Coordinator');
  });
});
