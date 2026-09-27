/* Admin modal for clinics workflows.
 * Collects operator input and posts it to the CGS admin API. */
import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { clinicsApi } from '../../api/clinics.api';
import { useToast } from '../../context/ToastContext';
import { PlatformUser, PlatformUserRole } from '../../types';
import { UserCheck, Stethoscope, User, Award, ShieldCheck } from 'lucide-react';

export interface AddClinicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicId: string;
  clinicName: string;
  onSuccess: (newUser: PlatformUser) => void;
}

export const AddClinicProfileModal: React.FC<AddClinicProfileModalProps> = ({
  isOpen,
  onClose,
  clinicId,
  clinicName,
  onSuccess,
}) => {
  const [profileType, setProfileType] = useState<'DOCTOR' | 'EMPLOYEE'>('DOCTOR');
  
  // Common Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Doctor Specific Fields
  const [specialization, setSpecialization] = useState('Orthodontics & Aligners');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [qualification, setQualification] = useState('BDS, MDS');
  const [experienceYears, setExperienceYears] = useState<number>(6);
  const [consultationFee, setConsultationFee] = useState<number>(800);

  // Employee Specific Fields
  const [designation, setDesignation] = useState('Front Desk & Patient Coordinator');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { success } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Please fill in all required demographic fields.');
      return;
    }

    if (profileType === 'DOCTOR' && !registrationNumber.trim()) {
      setError('Please provide the Dental Council Registration / License number for the Doctor.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const payload: Partial<PlatformUser> = {
        name: profileType === 'DOCTOR' && !name.toLowerCase().startsWith('dr.') ? `Dr. ${name}` : name,
        email,
        phone,
        role: profileType as PlatformUserRole,
        designation: profileType === 'EMPLOYEE' ? designation : `Specialist in ${specialization}`,
        ...(profileType === 'DOCTOR'
          ? {
              specialization,
              registrationNumber,
              qualification,
              experienceYears: Number(experienceYears),
              consultationFee: Number(consultationFee),
            }
          : {}),
      };

      const created = await clinicsApi.addClinicUserProfile(clinicId, payload);
      success(
        `${profileType === 'DOCTOR' ? 'Doctor' : 'Staff'} Profile Registered`,
        `${created.name} added to ${clinicName}.`
      );
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCheck size={20} color="var(--c-primary-600)" />
          <span>Add Profile to {clinicName}</span>
        </div>
      }
      subtitle="Register a new Doctor or Operational Staff account for this clinic tenant"
      maxWidth="640px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
            Save {profileType === 'DOCTOR' ? 'Doctor Profile' : 'Staff Profile'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--status-error-bg)',
              border: '1px solid var(--status-error-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--status-error)',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {/* Profile Type Selector Pills */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Select Profile Category:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setProfileType('DOCTOR');
                setError('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: `2px solid ${profileType === 'DOCTOR' ? 'var(--c-primary-600)' : 'var(--border-light)'}`,
                backgroundColor: profileType === 'DOCTOR' ? 'var(--c-primary-50)' : '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: profileType === 'DOCTOR' ? 'var(--c-primary-600)' : 'var(--c-slate-100)',
                  color: profileType === 'DOCTOR' ? '#ffffff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Stethoscope size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: profileType === 'DOCTOR' ? 'var(--c-primary-900)' : 'var(--text-primary)' }}>
                  Doctor / Dental Surgeon
                </strong>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Clinical privileges, consultations & treatments
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setProfileType('EMPLOYEE');
                setError('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: `2px solid ${profileType === 'EMPLOYEE' ? 'var(--c-primary-600)' : 'var(--border-light)'}`,
                backgroundColor: profileType === 'EMPLOYEE' ? 'var(--c-primary-50)' : '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: profileType === 'EMPLOYEE' ? 'var(--c-primary-600)' : 'var(--c-slate-100)',
                  color: profileType === 'EMPLOYEE' ? '#ffffff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: profileType === 'EMPLOYEE' ? 'var(--c-primary-900)' : 'var(--text-primary)' }}>
                  Operational Staff / Employee
                </strong>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Front desk, appointments & patient chat
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Common Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <Input
            label={profileType === 'DOCTOR' ? 'Doctor Full Name' : 'Staff Full Name'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={profileType === 'DOCTOR' ? 'Doctor name' : 'Full name'}
            required
          />
          <Input
            label="Work Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@clinicgrowth.com"
            required
          />
        </div>

        <Input
          label="Primary Phone / WhatsApp"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98200 11223"
          required
        />

        {/* DOCTOR SPECIFIC FIELDS */}
        {profileType === 'DOCTOR' && (
          <div
            className="animate-fade-in"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px',
              backgroundColor: 'var(--c-slate-50)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: 'var(--c-primary-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <Award size={15} />
              <span>Doctor Clinical Credentials & Details</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <Select
                label="Clinical Specialization"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              >
                <option value="Orthodontics & Aligners">Orthodontics & Invisible Aligners</option>
                <option value="Implantology & Oral Surgery">Implantology & Oral Surgery</option>
                <option value="Endodontics & Root Canal">Endodontics (Root Canal Specialist)</option>
                <option value="Prosthodontics & Crown/Bridge">Prosthodontics & Crown / Bridge</option>
                <option value="Periodontics & Gum Surgery">Periodontics & Gum Care</option>
                <option value="Pedodontics (Pediatric)">Pedodontics (Child Dental Specialist)</option>
                <option value="Aesthetic & Cosmetic Dentistry">Aesthetic & Cosmetic Dentistry</option>
                <option value="General Dental Surgeon">General Dental Surgeon</option>
              </Select>

              <Input
                label="Dental Council License # (DCI Reg)"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="e.g. DCI-MH-2024-88912"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <Input
                label="Degrees / Qualification"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="BDS, MDS"
              />

              <Input
                label="Experience (Years)"
                type="number"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                placeholder="6"
              />

              <Input
                label="Consultation Fee (INR)"
                type="number"
                value={consultationFee}
                onChange={(e) => setConsultationFee(Number(e.target.value))}
                placeholder="800"
              />
            </div>
          </div>
        )}

        {/* EMPLOYEE SPECIFIC FIELDS */}
        {profileType === 'EMPLOYEE' && (
          <div
            className="animate-fade-in"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px',
              backgroundColor: 'var(--c-slate-50)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: 'var(--c-primary-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <ShieldCheck size={15} />
              <span>Operational Role & Designation</span>
            </div>

            <Select
              label="Staff Operational Designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            >
              <option value="Front Desk & Patient Coordinator">Front Desk & Patient Coordinator</option>
              <option value="Clinic Operations Manager">Clinic Operations Manager</option>
              <option value="Dental Assistant / Nurse">Dental Assistant / Nurse</option>
              <option value="Receptionist & Chat Executive">Receptionist & Chat Executive</option>
              <option value="Treatment Counselor">Treatment Counselor</option>
              <option value="Accounts & Billing Executive">Accounts & Billing Executive</option>
            </Select>
          </div>
        )}
      </form>
    </Modal>
  );
};
