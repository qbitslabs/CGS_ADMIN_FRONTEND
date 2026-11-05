/* Admin modal for clinics workflows.
 * Collects operator input and posts it to the CGS admin API. */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { clinicsApi } from '../../api/clinics.api';
import { useToast } from '../../context/ToastContext';
import { PlatformUser, PlatformUserRole } from '../../types';
import { UserCheck, Stethoscope, User, Award, ShieldCheck } from 'lucide-react';

const DOCTOR_SPECIALTIES: Record<string, string[]> = {
  Dentist: [
    'General Dentistry',
    'Orthodontics & Invisible Aligners',
    'Implantology & Oral Surgery',
    'Endodontics (Root Canal)',
    'Prosthodontics & Crown / Bridge',
    'Periodontics & Gum Care',
    'Pedodontics (Child Dental)',
    'Aesthetic & Cosmetic Dentistry',
    'Oral & Maxillofacial Surgery',
  ],
  Dermatologist: [
    'General Dermatology',
    'Acne & Pigmentation',
    'Hair & Scalp (Trichology)',
    'Cosmetic Dermatology',
    'Pediatric Dermatology',
    'Dermatosurgery',
    'Psoriasis & Eczema',
    'Vitiligo',
    'Laser & Aesthetic Dermatology',
    'Nail Disorders',
    'Allergy & Contact Dermatitis',
    'Sexually Transmitted Infections',
  ],
  Neurologist: [
    'General Neurology',
    'Stroke & Vascular Neurology',
    'Epilepsy',
    'Headache & Migraine',
    'Pediatric Neurology',
    'Neuromuscular Disorders',
    'Movement Disorders & Parkinson’s',
    'Memory & Dementia',
    'Multiple Sclerosis',
    'Sleep Neurology',
    'Neurocritical Care',
    'Spine & Nerve Pain',
  ],
  Physiotherapist: [
    'Musculoskeletal Physiotherapy',
    'Sports Physiotherapy',
    'Neuro Physiotherapy',
    'Pediatric Physiotherapy',
    'Cardiopulmonary Physiotherapy',
    'Orthopedic Rehabilitation',
    'Post-surgical Rehabilitation',
    'Women’s Health Physiotherapy',
    'Geriatric Physiotherapy',
    'Vestibular & Balance',
    'Hand Therapy',
    'Pain Management',
  ],
  'General Physician': [
    'General Medicine',
    'Family Medicine',
    'Internal Medicine',
    'Diabetes Care',
    'Hypertension & Lifestyle Disease',
    'Infectious Disease',
    'Thyroid & Endocrine Care',
    'Geriatric Medicine',
    'Fever & Acute Care',
    'Preventive Health Check',
  ],
  Gynecologist: [
    'Obstetrics & Gynecology',
    'Infertility & IVF',
    'High-risk Pregnancy',
    'Gynecologic Surgery',
    'PCOS & Hormonal Disorders',
    'Menopause Care',
    'Adolescent Gynecology',
    'Laparoscopy & Minimally Invasive Surgery',
    'Fetal Medicine',
    'Family Planning',
  ],
  Orthopedic: [
    'General Orthopedics',
    'Joint Replacement',
    'Sports Injury',
    'Spine',
    'Pediatric Orthopedics',
    'Trauma & Fracture',
    'Arthroscopy',
    'Hand & Wrist',
    'Foot & Ankle',
    'Shoulder & Elbow',
  ],
  'ENT Specialist': [
    'General ENT',
    'Otology (Ear)',
    'Rhinology (Nose)',
    'Head & Neck',
    'Pediatric ENT',
    'Cochlear Implant & Hearing',
    'Sinus & Allergy',
    'Voice & Laryngology',
    'Sleep Apnea & Snoring',
  ],
  Ophthalmologist: [
    'General Ophthalmology',
    'Cataract',
    'Retina',
    'Glaucoma',
    'Pediatric Ophthalmology',
    'Cornea',
    'Refractive Surgery (LASIK)',
    'Oculoplasty',
    'Neuro-ophthalmology',
    'Squint',
  ],
  Pediatrician: [
    'General Pediatrics',
    'Neonatology',
    'Pediatric Allergy',
    'Adolescent Medicine',
    'Pediatric Pulmonology',
    'Pediatric Gastroenterology',
    'Pediatric Endocrinology',
    'Developmental Pediatrics',
    'Vaccination & Well-child Care',
  ],
  Psychiatrist: [
    'General Psychiatry',
    'Child & Adolescent Psychiatry',
    'Addiction Psychiatry',
    'Anxiety & Mood Disorders',
    'Geriatric Psychiatry',
    'Women’s Mental Health',
    'Psychosomatic Medicine',
    'Sleep Disorders',
  ],
  Cardiologist: [
    'General Cardiology',
    'Interventional Cardiology',
    'Preventive Cardiology',
    'Heart Failure',
    'Electrophysiology & Arrhythmia',
    'Pediatric Cardiology',
    'Hypertension',
    'Cardiac Rehabilitation',
  ],
  Other: [],
};

const DOCTOR_TYPES = Object.keys(DOCTOR_SPECIALTIES);

function ScrollSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setBox({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    place();
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener('mousedown', onDoc);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('mousedown', onDoc);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
      <button
        ref={buttonRef}
        type="button"
        className="select-field"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        style={{ textAlign: 'left', cursor: 'pointer' }}
      >
        {value}
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: 'fixed',
              top: box.top,
              left: box.left,
              width: box.width,
              zIndex: 1100,
              maxHeight: 168,
              overflowY: 'auto',
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-dropdown)',
            }}
          >
            {options.map((item) => (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={item === value}
                onClick={() => {
                  onChange(item);
                  setOpen(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 12px',
                  border: 'none',
                  background: item === value ? '#eff6ff' : 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {item}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

export interface AddClinicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicId: string;
  clinicName: string;
  seats?: {
    enforced: boolean;
    doctors: { used: number; allowed: number | null };
    staff: { used: number; allowed: number | null };
  };
  onSuccess: (newUser: PlatformUser) => void;
}

export const AddClinicProfileModal: React.FC<AddClinicProfileModalProps> = ({
  isOpen,
  onClose,
  clinicId,
  clinicName,
  seats,
  onSuccess,
}) => {
  const [profileType, setProfileType] = useState<'DOCTOR' | 'EMPLOYEE'>('DOCTOR');
  
  // Common Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Doctor Specific Fields
  const [doctorType, setDoctorType] = useState('Dentist');
  const [specialization, setSpecialization] = useState(DOCTOR_SPECIALTIES.Dentist[0]);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [qualification, setQualification] = useState('');
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
      setError('Please provide the registration or license number for the doctor.');
      return;
    }
    if (profileType === 'DOCTOR' && !specialization.trim()) {
      setError('Please enter the clinical specialization.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError('Enter a password of at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and confirm password do not match.');
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
        designation: profileType === 'EMPLOYEE' ? designation : doctorType,
        ...(profileType === 'DOCTOR'
          ? {
              specialization: `${doctorType} — ${specialization.trim()}`,
              registrationNumber,
              qualification,
              experienceYears: Number(experienceYears),
              consultationFee: Number(consultationFee),
            }
          : {}),
      };

      const created = await clinicsApi.addClinicUserProfile(clinicId, {
        ...payload,
        password,
      } as Partial<PlatformUser> & { password: string });
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

  const seat = profileType === 'DOCTOR' ? seats?.doctors : seats?.staff;
  const atLimit = Boolean(seats?.enforced && seat && seat.allowed != null && seat.used >= seat.allowed);
  const seatLabel = profileType === 'DOCTOR' ? 'Doctors' : 'Staff';
  const seatLine = !seat
    ? ''
    : seats?.enforced && seat.allowed != null
      ? `${seatLabel} ${seat.used} of ${seat.allowed}`
      : `${seatLabel} in use: ${seat.used}. Limits start when this clinic is placed on Essential, Growth, or Scale.`;

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
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading} disabled={atLimit}>
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

        {seatLine && (
          <div style={{ padding: '10px 12px', background: 'var(--c-slate-50)', borderRadius: '8px', fontSize: '13px', color: atLimit ? 'var(--status-error)' : 'var(--text-secondary)' }}>
            {atLimit ? `This clinic is at its ${profileType === 'DOCTOR' ? 'doctor' : 'staff'} limit (${seat?.used} of ${seat?.allowed}).` : seatLine}
          </div>
        )}

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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            autoComplete="new-password"
            required
          />
        </div>

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
              <ScrollSelect
                label="Doctor type"
                value={doctorType}
                options={DOCTOR_TYPES}
                onChange={(nextType) => {
                  setDoctorType(nextType);
                  setSpecialization(DOCTOR_SPECIALTIES[nextType]?.[0] || '');
                }}
              />

              {doctorType === 'Other' ? (
                <Input
                  label="Clinical Specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="Enter the specialization"
                  required
                />
              ) : (
                <ScrollSelect
                  label="Clinical Specialization"
                  value={specialization}
                  options={DOCTOR_SPECIALTIES[doctorType] || []}
                  onChange={setSpecialization}
                />
              )}
            </div>

            <Input
              label={doctorType === 'Dentist' ? 'Dental Council License # (DCI Reg)' : 'Registration / License number'}
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder={doctorType === 'Dentist' ? 'e.g. DCI-MH-2024-88912' : 'Council registration number'}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <Input
                label="Degrees / Qualification"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder={doctorType === 'Dentist' ? 'BDS, MDS' : 'MBBS, MD'}
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
