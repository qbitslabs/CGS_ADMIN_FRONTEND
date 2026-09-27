/* Admin modal for clinics workflows.
 * Collects operator input and posts it to the CGS admin API. */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Wifi,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { clinicsApi } from '../../api/clinics.api';
import { useToast } from '../../context/ToastContext';
import { Clinic, SubscriptionTier } from '../../types';

export interface OnboardClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newClinic: Clinic) => void;
}

const STEPS = [
  'Clinic Details',
  'Landing Page',
  'WhatsApp Setup',
  'AI Configuration',
  'Clinic Workflow',
  'Admin & Staff',
  'Review & Submit',
] as const;

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_PERMISSIONS = [
  'Manage Leads',
  'Manage Appointments',
  'Manage Doctors',
  'Manage Services',
  'Manage WhatsApp',
  'Manage AI Configuration',
  'View Reports',
  'Manage Staff',
];

const WORKFLOW_STEPS = [
  'New Lead',
  'AI Conversation',
  'Lead Qualification',
  'Appointment Booking',
  'Confirmation',
  'Reminder',
  'Follow-up',
];

type StaffRole = 'CLINIC_ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'STAFF';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  roleLabel: StaffRole;
  permissions: string[];
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  description: string;
  workingDays: string[];
  openingTime: string;
  closingTime: string;
  tier: SubscriptionTier;
  landingTitle: string;
  landingShortDescription: string;
  primaryCta: string;
  landingWhatsapp: string;
  enquiryFormEnabled: boolean;
  landingAddress: string;
  landingAdditionalInfo: string;
  selectedServices: string[];
  selectedDoctors: string[];
  waBusinessAccountId: string;
  waPhoneNumberId: string;
  waDisplayPhone: string;
  waAccessToken: string;
  waApiVersion: string;
  webhookUrl: string;
  verifyToken: string;
  webhookStatus: string;
  tplWelcome: string;
  tplLeadQualification: string;
  tplAppointmentConfirmation: string;
  tplAppointmentReminder: string;
  tplFollowUp: string;
  tplNoResponse: string;
  waConnectionStatus: 'Connected' | 'Not Connected' | 'Testing';
  clinicInformation: string;
  servicesTreatments: string;
  doctorsInfo: string;
  consultationDetails: string;
  timings: string;
  faqs: string;
  receptionistName: string;
  aiTone: string;
  conversationInstructions: string;
  greetingMessage: string;
  qualificationEnabled: boolean;
  appointmentEnabled: boolean;
  reminderEnabled: boolean;
  followUpEnabled: boolean;
  noResponseEnabled: boolean;
  staffHandoffEnabled: boolean;
  followUpHours: number;
  reminderHoursBefore: number;
  staff: StaffMember[];
  confirmed: boolean;
}

const emptyStaff = (): StaffMember => ({
  id: `staff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  roleLabel: 'STAFF',
  permissions: ['Manage Leads', 'Manage Appointments'],
});

const initialForm = (): FormState => ({
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  description: '',
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  openingTime: '09:00',
  closingTime: '19:00',
  tier: 'GROWTH',
  landingTitle: '',
  landingShortDescription: '',
  primaryCta: 'Book Appointment on WhatsApp',
  landingWhatsapp: '',
  enquiryFormEnabled: true,
  landingAddress: '',
  landingAdditionalInfo: '',
  selectedServices: [],
  selectedDoctors: [],
  waBusinessAccountId: '',
  waPhoneNumberId: '',
  waDisplayPhone: '',
  waAccessToken: '',
  waApiVersion: 'v19.0',
  webhookUrl: '',
  verifyToken: '',
  webhookStatus: 'PENDING',
  tplWelcome: 'Welcome to our clinic! How can we help you today?',
  tplLeadQualification: 'To assist you better, may I know which service you need?',
  tplAppointmentConfirmation: 'Your appointment is confirmed. We look forward to seeing you!',
  tplAppointmentReminder: 'Reminder: You have an appointment tomorrow. Reply YES to confirm.',
  tplFollowUp: 'How was your visit? We would love your feedback.',
  tplNoResponse: 'We tried reaching you. Reply anytime and we will help.',
  waConnectionStatus: 'Not Connected',
  clinicInformation: '',
  servicesTreatments: '',
  doctorsInfo: '',
  consultationDetails: '',
  timings: '',
  faqs: '',
  receptionistName: 'Asha',
  aiTone: 'professional',
  conversationInstructions: 'Be helpful, concise, and guide patients toward booking.',
  greetingMessage: 'Hello! Welcome to our clinic. How can I help you today?',
  qualificationEnabled: true,
  appointmentEnabled: true,
  reminderEnabled: true,
  followUpEnabled: true,
  noResponseEnabled: true,
  staffHandoffEnabled: true,
  followUpHours: 24,
  reminderHoursBefore: 24,
  staff: [
    {
      id: 'staff_primary',
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      roleLabel: 'CLINIC_ADMIN',
      permissions: [...DEFAULT_PERMISSIONS],
    },
  ],
  confirmed: false,
});

const sectionStyle: React.CSSProperties = {
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-lg)',
  padding: '16px',
  background: '#fff',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: '2px',
};

const labelMuted: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--text-muted)',
};

function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
  required,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  required?: boolean;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
        {label}
        {required && <span style={{ color: 'var(--status-error)', marginLeft: 3 }}>*</span>}
      </label>
      <textarea
        className={`form-input ${error ? 'has-error' : ''}`}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ resize: 'vertical', minHeight: rows * 22 }}
      />
      {error && <span style={{ fontSize: 12, color: 'var(--status-error)' }}>{error}</span>}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)',
        cursor: 'pointer',
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{hint}</div>}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export const OnboardClinicModal: React.FC<OnboardClinicModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [serviceDraft, setServiceDraft] = useState('');
  const [doctorDraft, setDoctorDraft] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successClinic, setSuccessClinic] = useState<Clinic | null>(null);
  const [successLoginEmail, setSuccessLoginEmail] = useState('');
  const [reviewOpen, setReviewOpen] = useState<Record<string, boolean>>({
    clinic: true,
    landing: false,
    whatsapp: false,
    ai: false,
    workflow: false,
    staff: false,
  });

  const { success } = useToast();
  const navigate = useNavigate();

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const resetAndClose = () => {
    setStep(0);
    setForm(initialForm());
    setServiceDraft('');
    setDoctorDraft('');
    setErrors({});
    setSubmitError('');
    setSuccessClinic(null);
    setSuccessLoginEmail('');
    onClose();
  };

  const addService = () => {
    const name = serviceDraft.trim();
    if (!name) return;
    if (form.selectedServices.some((s) => s.toLowerCase() === name.toLowerCase())) {
      setServiceDraft('');
      return;
    }
    patch('selectedServices', [...form.selectedServices, name]);
    setServiceDraft('');
  };

  const addDoctor = () => {
    const name = doctorDraft.trim();
    if (!name) return;
    if (form.selectedDoctors.some((d) => d.toLowerCase() === name.toLowerCase())) {
      setDoctorDraft('');
      return;
    }
    patch('selectedDoctors', [...form.selectedDoctors, name]);
    setDoctorDraft('');
  };

  const validateStep = (index: number): boolean => {
    const nextErrors: Record<string, string> = {};
    if (index === 0) {
      if (!form.name.trim()) nextErrors.name = 'Clinic name is required';
      if (!form.phone.trim()) nextErrors.phone = 'Phone is required';
      if (!form.email.trim()) nextErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Enter a valid email';
      if (!form.address.trim()) nextErrors.address = 'Address is required';
      if (!form.city.trim()) nextErrors.city = 'City is required';
      if (!form.workingDays.length) nextErrors.workingDays = 'Select at least one working day';
      if (!form.openingTime) nextErrors.openingTime = 'Opening time is required';
      if (!form.closingTime) nextErrors.closingTime = 'Closing time is required';
    }
    if (index === 1) {
      if (!form.landingTitle.trim()) nextErrors.landingTitle = 'Landing page title is required';
      if (!form.landingShortDescription.trim()) {
        nextErrors.landingShortDescription = 'Short description is required';
      }
      if (!form.primaryCta.trim()) nextErrors.primaryCta = 'Primary CTA is required';
    }
    if (index === 3) {
      if (!form.receptionistName.trim()) nextErrors.receptionistName = 'AI receptionist name is required';
      if (!form.greetingMessage.trim()) nextErrors.greetingMessage = 'Greeting message is required';
    }
    if (index === 5) {
      form.staff.forEach((s, i) => {
        if (!s.name.trim()) nextErrors[`staff_${i}_name`] = 'Name is required';
        if (!s.email.trim()) nextErrors[`staff_${i}_email`] = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) {
          nextErrors[`staff_${i}_email`] = 'Invalid email';
        }
        if (!s.password.trim()) nextErrors[`staff_${i}_password`] = 'Password is required';
        else if (s.password.length < 6) nextErrors[`staff_${i}_password`] = 'Minimum 6 characters';
        if (!s.confirmPassword.trim()) nextErrors[`staff_${i}_confirm`] = 'Confirm password';
        else if (s.password !== s.confirmPassword) {
          nextErrors[`staff_${i}_confirm`] = 'Passwords do not match';
        }
      });
    }
    if (index === 6) {
      if (!form.confirmed) nextErrors.confirmed = 'Please confirm before submitting';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  React.useEffect(() => {
    const body = document.querySelector('.modal-content .modal-body-scroll');
    if (body) body.scrollTop = 0;
  }, [step, successClinic]);

  const testWhatsApp = async () => {
    patch('waConnectionStatus', 'Testing');
    await new Promise((r) => setTimeout(r, 800));
    const ok = Boolean(form.waPhoneNumberId && form.waAccessToken);
    patch('waConnectionStatus', ok ? 'Connected' : 'Not Connected');
    patch('webhookStatus', ok ? 'HEALTHY' : 'PENDING');
  };

  const testAi = async () => {
    success('AI Test', `${form.receptionistName}: "${form.greetingMessage}"`);
  };

  const buildPayload = () => {
    const services = form.selectedServices.map((name) => ({ name }));
    const doctors = form.selectedDoctors.map((name) => ({ name }));

    return {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      description: form.description.trim() || undefined,
      workingDays: form.workingDays,
      openingTime: form.openingTime,
      closingTime: form.closingTime,
      tier: form.tier,
      doctorName: form.staff.find((s) => s.roleLabel === 'DOCTOR' || s.roleLabel === 'CLINIC_ADMIN')
        ?.name,
      landingPage: {
        title: form.landingTitle.trim(),
        shortDescription: form.landingShortDescription.trim(),
        primaryCta: form.primaryCta.trim(),
        whatsappNumber: form.landingWhatsapp.trim() || form.phone.trim(),
        enquiryFormEnabled: form.enquiryFormEnabled,
        services,
        doctors,
        address: form.landingAddress.trim() || form.address.trim(),
        additionalInfo: form.landingAdditionalInfo.trim() || undefined,
      },
      whatsapp:
        form.waPhoneNumberId && form.waAccessToken
          ? {
              businessAccountId: form.waBusinessAccountId || undefined,
              phoneNumberId: form.waPhoneNumberId,
              displayPhoneNumber: form.waDisplayPhone || form.phone,
              accessToken: form.waAccessToken,
              apiVersion: form.waApiVersion || 'v19.0',
              webhookUrl: form.webhookUrl || undefined,
              verifyToken: form.verifyToken || undefined,
              webhookStatus: form.webhookStatus || 'PENDING',
              messageTemplates: {
                welcome: form.tplWelcome,
                leadQualification: form.tplLeadQualification,
                appointmentConfirmation: form.tplAppointmentConfirmation,
                appointmentReminder: form.tplAppointmentReminder,
                followUp: form.tplFollowUp,
                noResponse: form.tplNoResponse,
              },
            }
          : undefined,
      ai: {
        receptionistName: form.receptionistName,
        tone: form.aiTone,
        greetingMessage: form.greetingMessage,
        conversationInstructions: form.conversationInstructions,
        clinicInformation: form.clinicInformation,
        servicesTreatments: form.servicesTreatments || form.selectedServices.join(', '),
        doctorsInfo: form.doctorsInfo || form.selectedDoctors.join(', '),
        consultationDetails: form.consultationDetails,
        timings: form.timings,
        faqs: form.faqs,
        isAiEnabled: true,
      },
      workflow: {
        qualificationEnabled: form.qualificationEnabled,
        appointmentEnabled: form.appointmentEnabled,
        reminderEnabled: form.reminderEnabled,
        followUpEnabled: form.followUpEnabled,
        noResponseEnabled: form.noResponseEnabled,
        staffHandoffEnabled: form.staffHandoffEnabled,
        followUpHours: form.followUpHours,
        reminderHoursBefore: form.reminderHoursBefore,
      },
      staff: form.staff.map((s) => ({
        name: s.name.trim(),
        email: s.email.trim(),
        phone: s.phone.trim() || undefined,
        password: s.password,
        roleLabel: s.roleLabel,
        permissions: s.permissions,
      })),
      services,
    };
  };

  const handleSubmit = async () => {
    if (!validateStep(6)) return;
    setIsLoading(true);
    setSubmitError('');
    try {
      const created = await clinicsApi.createClinic(buildPayload() as any);
      setSuccessClinic(created);
      setSuccessLoginEmail(form.staff[0]?.email?.trim() || form.email.trim());
      success('Clinic created successfully.', `${created.name} is ready on the platform.`);
      onSuccess(created);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to create clinic');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleArrayValue = (key: 'workingDays', id: string) => {
    setForm((prev) => {
      const list = prev[key] as string[];
      return {
        ...prev,
        [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
      };
    });
  };

  const updateStaff = (id: string, patchStaff: Partial<StaffMember>) => {
    setForm((prev) => ({
      ...prev,
      staff: prev.staff.map((s) => (s.id === id ? { ...s, ...patchStaff } : s)),
    }));
  };

  const renderStepper = () => (
    <div
      style={{
        display: 'flex',
        gap: 4,
        overflowX: 'auto',
        paddingBottom: 2,
      }}
    >
      {STEPS.map((label, i) => {
        const active = i === step;
        const done = i < step || !!successClinic;
        return (
          <button
            key={label}
            type="button"
            onClick={() => {
              if (successClinic) return;
              if (i < step) setStep(i);
            }}
            style={{
              flex: '1 0 auto',
              minWidth: 110,
              border: '1px solid',
              borderColor: active ? 'var(--c-primary-400)' : 'var(--border-light)',
              background: done && !active ? 'var(--c-primary-50)' : active ? '#fff' : '#fafafa',
              borderRadius: 10,
              padding: '8px 10px',
              cursor: i <= step && !successClinic ? 'pointer' : 'default',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: active ? 'var(--c-primary-700)' : 'var(--text-muted)',
                letterSpacing: 0.3,
              }}
            >
              STEP {i + 1}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                marginTop: 2,
              }}
            >
              {label}
            </div>
          </button>
        );
      })}
    </div>
  );

  const reviewSection = (
    key: string,
    title: string,
    stepIndex: number,
    content: React.ReactNode
  ) => {
    const open = reviewOpen[key];
    return (
      <div style={{ ...sectionStyle, padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderBottom: open ? '1px solid var(--border-light)' : 'none',
            background: '#fafbfc',
          }}
        >
          <button
            type="button"
            onClick={() => setReviewOpen((p) => ({ ...p, [key]: !p[key] }))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {title}
          </button>
          <Button variant="outline" size="sm" onClick={() => setStep(stepIndex)}>
            Edit
          </Button>
        </div>
        {open && <div style={{ padding: 14, fontSize: 13, color: 'var(--text-secondary)' }}>{content}</div>}
      </div>
    );
  };

  const footer = successClinic ? (
    <>
      <Button variant="secondary" onClick={resetAndClose}>
        Close
      </Button>
      <Button
        variant="primary"
        onClick={() => {
          const id = successClinic.id;
          resetAndClose();
          navigate(`/clinics/${id}`);
        }}
      >
        Open Clinic Dashboard
      </Button>
    </>
  ) : (
    <>
      {step === 0 ? (
        <Button variant="secondary" onClick={resetAndClose} disabled={isLoading}>
          Cancel
        </Button>
      ) : (
        <Button variant="secondary" onClick={goBack} disabled={isLoading}>
          Back
        </Button>
      )}
      {step < STEPS.length - 1 ? (
        <Button variant="primary" onClick={goNext}>
          Next
        </Button>
      ) : (
        <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
          Submit & Create Clinic
        </Button>
      )}
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => undefined : resetAndClose}
      title={successClinic ? 'Clinic Created' : 'Onboard New Clinic'}
      subtitle={
        successClinic
          ? 'Clinic created successfully.'
          : `${STEPS[step]} (${step + 1} of ${STEPS.length})`
      }
      maxWidth="920px"
      maxHeight="92vh"
      closeOnOverlayClick={false}
      closeOnEscape={false}
      bodyHeader={!successClinic ? renderStepper() : undefined}
      footer={footer}
    >
      <div key={successClinic ? 'success' : `step-${step}`} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {successClinic ? (
          <div style={{ ...sectionStyle, alignItems: 'center', textAlign: 'center', padding: 28 }}>
            <CheckCircle2 size={42} color="var(--status-success)" />
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Clinic created successfully.</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {successClinic.name} is live. Landing Page ID:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {(successClinic as any).landingPageId || '—'}
              </strong>
            </p>
            {successLoginEmail && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
                Clinic login: use <strong style={{ color: 'var(--text-primary)' }}>{successLoginEmail}</strong> and the
                password set in Admin &amp; Staff at{' '}
                <strong style={{ color: 'var(--text-primary)' }}>http://localhost:3000/login</strong>
              </p>
            )}
          </div>
        ) : (
          <>
            {submitError && (
              <div
                style={{
                  color: 'var(--status-error)',
                  fontSize: 13,
                  backgroundColor: 'var(--status-error-bg)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                {submitError}
              </div>
            )}

            {step === 0 && (
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>Clinic Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input label="Clinic Name" required value={form.name} error={errors.name} onChange={(e) => patch('name', e.target.value)} placeholder="e.g. CarePlus Dental" />
                  <Input label="City" required value={form.city} error={errors.city} onChange={(e) => patch('city', e.target.value)} />
                  <Input label="Clinic Phone Number" required value={form.phone} error={errors.phone} onChange={(e) => patch('phone', e.target.value)} placeholder="+91..." />
                  <Input label="Email Address" required type="email" value={form.email} error={errors.email} onChange={(e) => patch('email', e.target.value)} />
                </div>
                <Input label="Address" required value={form.address} error={errors.address} onChange={(e) => patch('address', e.target.value)} />
                <TextAreaField label="Clinic Description" value={form.description} onChange={(v) => patch('description', v)} placeholder="Brief about the clinic" />
                <div>
                  <div style={labelMuted}>Clinic Working Days {errors.workingDays && <span style={{ color: 'var(--status-error)' }}>— {errors.workingDays}</span>}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {WEEK_DAYS.map((d) => (
                      <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 10px', border: '1px solid var(--border-light)', borderRadius: 999 }}>
                        <input type="checkbox" checked={form.workingDays.includes(d)} onChange={() => toggleArrayValue('workingDays', d)} />
                        {d.slice(0, 3)}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <Input label="Opening Time" required type="time" value={form.openingTime} error={errors.openingTime} onChange={(e) => patch('openingTime', e.target.value)} />
                  <Input label="Closing Time" required type="time" value={form.closingTime} error={errors.closingTime} onChange={(e) => patch('closingTime', e.target.value)} />
                  <Select
                    label="Subscription Tier"
                    value={form.tier}
                    onChange={(e) => patch('tier', e.target.value as SubscriptionTier)}
                    options={[
                      { value: 'STARTER', label: 'Starter' },
                      { value: 'GROWTH', label: 'Growth' },
                      { value: 'ENTERPRISE', label: 'Enterprise' },
                      { value: 'CUSTOM', label: 'Custom' },
                    ]}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>Landing Page Configuration</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input label="Landing Page Title" required value={form.landingTitle} error={errors.landingTitle} onChange={(e) => patch('landingTitle', e.target.value)} />
                  <Input label="Primary CTA" required value={form.primaryCta} error={errors.primaryCta} onChange={(e) => patch('primaryCta', e.target.value)} />
                  <Input label="WhatsApp Number" value={form.landingWhatsapp} onChange={(e) => patch('landingWhatsapp', e.target.value)} />
                  <ToggleRow label="Enquiry Form" checked={form.enquiryFormEnabled} onChange={(v) => patch('enquiryFormEnabled', v)} hint="Enable enquiry form on landing page" />
                </div>
                <TextAreaField label="Short Description" required value={form.landingShortDescription} error={errors.landingShortDescription} onChange={(v) => patch('landingShortDescription', v)} />

                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Services</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <Input
                      label=""
                      value={serviceDraft}
                      onChange={(e) => setServiceDraft(e.target.value)}
                      placeholder="e.g. Root Canal"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addService();
                        }
                      }}
                    />
                    <Button variant="primary" onClick={addService} style={{ flexShrink: 0, height: 40 }}>
                      Add
                    </Button>
                  </div>
                  {form.selectedServices.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                      {form.selectedServices.map((s) => (
                        <div
                          key={s}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            border: '1px solid var(--border-light)',
                            borderRadius: 8,
                            fontSize: 13,
                            background: '#fafbfc',
                          }}
                        >
                          <span>{s}</span>
                          <button
                            type="button"
                            onClick={() =>
                              patch(
                                'selectedServices',
                                form.selectedServices.filter((x) => x !== s)
                              )
                            }
                            style={{ border: 'none', background: 'none', color: 'var(--status-error)', cursor: 'pointer', display: 'flex' }}
                            aria-label={`Remove ${s}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Doctors</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <Input
                      label=""
                      value={doctorDraft}
                      onChange={(e) => setDoctorDraft(e.target.value)}
                      placeholder="Doctor name"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addDoctor();
                        }
                      }}
                    />
                    <Button variant="primary" onClick={addDoctor} style={{ flexShrink: 0, height: 40 }}>
                      Add
                    </Button>
                  </div>
                  {form.selectedDoctors.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                      {form.selectedDoctors.map((d) => (
                        <div
                          key={d}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            border: '1px solid var(--border-light)',
                            borderRadius: 8,
                            fontSize: 13,
                            background: '#fafbfc',
                          }}
                        >
                          <span>{d}</span>
                          <button
                            type="button"
                            onClick={() =>
                              patch(
                                'selectedDoctors',
                                form.selectedDoctors.filter((x) => x !== d)
                              )
                            }
                            style={{ border: 'none', background: 'none', color: 'var(--status-error)', cursor: 'pointer', display: 'flex' }}
                            aria-label={`Remove ${d}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Input label="Clinic Address" value={form.landingAddress} onChange={(e) => patch('landingAddress', e.target.value)} />
                <TextAreaField label="Additional Information" value={form.landingAdditionalInfo} onChange={(v) => patch('landingAdditionalInfo', v)} />
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={sectionStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={sectionTitleStyle}>WhatsApp Business Configuration</div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 999,
                        background:
                          form.waConnectionStatus === 'Connected'
                            ? 'var(--status-success-bg)'
                            : form.waConnectionStatus === 'Testing'
                              ? 'var(--c-primary-50)'
                              : 'var(--status-error-bg)',
                        color:
                          form.waConnectionStatus === 'Connected'
                            ? 'var(--status-success)'
                            : form.waConnectionStatus === 'Testing'
                              ? 'var(--c-primary-700)'
                              : 'var(--status-error)',
                      }}
                    >
                      {form.waConnectionStatus}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Input label="WhatsApp Business Account ID" value={form.waBusinessAccountId} onChange={(e) => patch('waBusinessAccountId', e.target.value)} />
                    <Input
                      label="Meta Phone Number ID"
                      hint="From Meta Developer → WhatsApp → API Setup (digits only, e.g. 1282084788326885)"
                      value={form.waPhoneNumberId}
                      onChange={(e) => patch('waPhoneNumberId', e.target.value)}
                    />
                    <Input label="WhatsApp Business Phone Number" value={form.waDisplayPhone} onChange={(e) => patch('waDisplayPhone', e.target.value)} />
                    <Input label="API Version" value={form.waApiVersion} onChange={(e) => patch('waApiVersion', e.target.value)} />
                  </div>
                  <Input label="Access Token" type="password" value={form.waAccessToken} onChange={(e) => patch('waAccessToken', e.target.value)} />
                  <Button variant="outline" leftIcon={<Wifi size={14} />} onClick={testWhatsApp}>
                    Test WhatsApp Connection
                  </Button>
                </div>
                <div style={sectionStyle}>
                  <div style={sectionTitleStyle}>Webhook Configuration</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Input label="Webhook URL" value={form.webhookUrl} onChange={(e) => patch('webhookUrl', e.target.value)} placeholder="https://api.../webhook" />
                    <Input label="Verify Token" value={form.verifyToken} onChange={(e) => patch('verifyToken', e.target.value)} />
                    <Select
                      label="Webhook Status"
                      value={form.webhookStatus}
                      onChange={(e) => patch('webhookStatus', e.target.value)}
                      options={[
                        { value: 'PENDING', label: 'Pending' },
                        { value: 'HEALTHY', label: 'Healthy' },
                        { value: 'FAILING', label: 'Failing' },
                      ]}
                    />
                  </div>
                </div>
                <div style={sectionStyle}>
                  <div style={sectionTitleStyle}>Message Templates</div>
                  <TextAreaField label="Welcome Message" value={form.tplWelcome} onChange={(v) => patch('tplWelcome', v)} rows={2} />
                  <TextAreaField label="Lead Qualification Message" value={form.tplLeadQualification} onChange={(v) => patch('tplLeadQualification', v)} rows={2} />
                  <TextAreaField label="Appointment Confirmation" value={form.tplAppointmentConfirmation} onChange={(v) => patch('tplAppointmentConfirmation', v)} rows={2} />
                  <TextAreaField label="Appointment Reminder" value={form.tplAppointmentReminder} onChange={(v) => patch('tplAppointmentReminder', v)} rows={2} />
                  <TextAreaField label="Follow-up Message" value={form.tplFollowUp} onChange={(v) => patch('tplFollowUp', v)} rows={2} />
                  <TextAreaField label="No Response Message" value={form.tplNoResponse} onChange={(v) => patch('tplNoResponse', v)} rows={2} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={sectionStyle}>
                  <div style={sectionTitleStyle}>Clinic Knowledge</div>
                  <TextAreaField label="Clinic Information" value={form.clinicInformation} onChange={(v) => patch('clinicInformation', v)} />
                  <TextAreaField label="Services & Treatments" value={form.servicesTreatments} onChange={(v) => patch('servicesTreatments', v)} />
                  <TextAreaField label="Doctors" value={form.doctorsInfo} onChange={(v) => patch('doctorsInfo', v)} />
                  <TextAreaField label="Consultation Details" value={form.consultationDetails} onChange={(v) => patch('consultationDetails', v)} />
                  <TextAreaField label="Timings" value={form.timings} onChange={(v) => patch('timings', v)} rows={2} />
                  <TextAreaField label="FAQs" value={form.faqs} onChange={(v) => patch('faqs', v)} />
                </div>
                <div style={sectionStyle}>
                  <div style={sectionTitleStyle}>Conversation Configuration</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Input label="AI Receptionist Name" required value={form.receptionistName} error={errors.receptionistName} onChange={(e) => patch('receptionistName', e.target.value)} />
                    <Select
                      label="AI Personality / Tone"
                      value={form.aiTone}
                      onChange={(e) => patch('aiTone', e.target.value)}
                      options={[
                        { value: 'professional', label: 'Professional' },
                        { value: 'warm', label: 'Warm' },
                        { value: 'concise', label: 'Concise' },
                      ]}
                    />
                  </div>
                  <TextAreaField label="Conversation Instructions" value={form.conversationInstructions} onChange={(v) => patch('conversationInstructions', v)} />
                  <TextAreaField label="Greeting Message" required value={form.greetingMessage} error={errors.greetingMessage} onChange={(v) => patch('greetingMessage', v)} rows={2} />
                  <Button variant="outline" leftIcon={<Sparkles size={14} />} onClick={testAi}>
                    Test AI Conversation
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>Clinic Workflow Configuration</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  {WORKFLOW_STEPS.map((w, i) => (
                    <React.Fragment key={w}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: '8px 12px',
                          borderRadius: 10,
                          background: 'var(--c-primary-50)',
                          color: 'var(--c-primary-800)',
                          border: '1px solid var(--c-primary-200)',
                        }}
                      >
                        {w}
                      </span>
                      {i < WORKFLOW_STEPS.length - 1 && <ChevronRight size={14} color="var(--text-muted)" />}
                    </React.Fragment>
                  ))}
                </div>
                <ToggleRow label="Qualification workflow" checked={form.qualificationEnabled} onChange={(v) => patch('qualificationEnabled', v)} />
                <ToggleRow label="Appointment workflow" checked={form.appointmentEnabled} onChange={(v) => patch('appointmentEnabled', v)} />
                <ToggleRow label="Appointment reminders" checked={form.reminderEnabled} onChange={(v) => patch('reminderEnabled', v)} />
                <ToggleRow label="Follow-up automation" checked={form.followUpEnabled} onChange={(v) => patch('followUpEnabled', v)} />
                <ToggleRow label="No-response handling" checked={form.noResponseEnabled} onChange={(v) => patch('noResponseEnabled', v)} />
                <ToggleRow label="Staff handoff" checked={form.staffHandoffEnabled} onChange={(v) => patch('staffHandoffEnabled', v)} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input label="Follow-up timing (hours)" type="number" value={String(form.followUpHours)} onChange={(e) => patch('followUpHours', Number(e.target.value) || 24)} />
                  <Input label="Reminder hours before appointment" type="number" value={String(form.reminderHoursBefore)} onChange={(e) => patch('reminderHoursBefore', Number(e.target.value) || 24)} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Lead status transitions: New → Qualified → Booked → Confirmed → Completed / No-show
                </div>
              </div>
            )}

            {step === 5 && (
              <div style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={sectionTitleStyle}>Clinic Users</div>
                  <Button variant="outline" size="sm" leftIcon={<Plus size={14} />} onClick={() => patch('staff', [...form.staff, emptyStaff()])}>
                    Add Staff
                  </Button>
                </div>
                {form.staff.map((member, index) => (
                  <div
                    key={member.id}
                    style={{
                      border: '1px solid var(--border-light)',
                      borderRadius: 12,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 13 }}>Staff #{index + 1}</strong>
                      {form.staff.length > 1 && (
                        <button
                          type="button"
                          onClick={() => patch('staff', form.staff.filter((s) => s.id !== member.id))}
                          style={{ border: 'none', background: 'none', color: 'var(--status-error)', cursor: 'pointer' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <Input label="Full Name" required value={member.name} error={errors[`staff_${index}_name`]} onChange={(e) => updateStaff(member.id, { name: e.target.value })} />
                      <Input label="Email" required type="email" value={member.email} error={errors[`staff_${index}_email`]} onChange={(e) => updateStaff(member.id, { email: e.target.value })} />
                      <Input label="Phone" value={member.phone} onChange={(e) => updateStaff(member.id, { phone: e.target.value })} />
                      <Select
                        label="Role"
                        value={member.roleLabel}
                        onChange={(e) => updateStaff(member.id, { roleLabel: e.target.value as StaffRole })}
                        options={[
                          { value: 'CLINIC_ADMIN', label: 'Clinic Admin' },
                          { value: 'DOCTOR', label: 'Doctor' },
                          { value: 'RECEPTIONIST', label: 'Receptionist' },
                          { value: 'STAFF', label: 'Staff' },
                        ]}
                      />
                      <Input
                        label="Password"
                        required
                        type="password"
                        value={member.password}
                        error={errors[`staff_${index}_password`]}
                        onChange={(e) => updateStaff(member.id, { password: e.target.value })}
                        placeholder="Min. 6 characters"
                        autoComplete="new-password"
                      />
                      <Input
                        label="Confirm Password"
                        required
                        type="password"
                        value={member.confirmPassword}
                        error={errors[`staff_${index}_confirm`]}
                        onChange={(e) => updateStaff(member.id, { confirmPassword: e.target.value })}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                      />
                    </div>
                    <div>
                      <div style={labelMuted}>Permissions</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
                        {DEFAULT_PERMISSIONS.map((p) => (
                          <label key={p} style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input
                              type="checkbox"
                              checked={member.permissions.includes(p)}
                              onChange={() =>
                                updateStaff(member.id, {
                                  permissions: member.permissions.includes(p)
                                    ? member.permissions.filter((x) => x !== p)
                                    : [...member.permissions, p],
                                })
                              }
                            />
                            {p}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 6 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reviewSection('clinic', 'Clinic Details', 0, (
                  <>
                    <div>{form.name} · {form.city}</div>
                    <div>{form.email} · {form.phone}</div>
                    <div>{form.address}</div>
                    <div>{form.workingDays.join(', ')} · {form.openingTime}-{form.closingTime}</div>
                    <div>Tier: {form.tier}</div>
                  </>
                ))}
                {reviewSection('landing', 'Landing Page', 1, (
                  <>
                    <div>{form.landingTitle}</div>
                    <div>{form.landingShortDescription}</div>
                    <div>CTA: {form.primaryCta}</div>
                    <div>Enquiry form: {form.enquiryFormEnabled ? 'Enabled' : 'Disabled'}</div>
                  </>
                ))}
                {reviewSection('whatsapp', 'WhatsApp', 2, (
                  <>
                    <div>Phone Number ID: {form.waPhoneNumberId || 'Not configured'}</div>
                    <div>Status: {form.waConnectionStatus}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MessageSquare size={14} /> Templates configured
                    </div>
                  </>
                ))}
                {reviewSection('ai', 'AI Configuration', 3, (
                  <>
                    <div>{form.receptionistName} · {form.aiTone}</div>
                    <div>{form.greetingMessage}</div>
                  </>
                ))}
                {reviewSection('workflow', 'Clinic Workflow', 4, (
                  <>
                    <div>Qualification: {form.qualificationEnabled ? 'On' : 'Off'}</div>
                    <div>Appointments: {form.appointmentEnabled ? 'On' : 'Off'}</div>
                    <div>Reminders: {form.reminderHoursBefore}h before · Follow-up: {form.followUpHours}h</div>
                  </>
                ))}
                {reviewSection('staff', 'Admin & Staff', 5, (
                  <>
                    {form.staff.map((s) => (
                      <div key={s.id}>{s.name} · {s.email} · {s.roleLabel}</div>
                    ))}
                  </>
                ))}

                <div style={{ ...sectionStyle, background: 'var(--c-primary-50)', borderColor: 'var(--c-primary-200)' }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Ready to Create Clinic?</div>
                  <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13 }}>
                    <input type="checkbox" checked={form.confirmed} onChange={(e) => patch('confirmed', e.target.checked)} style={{ marginTop: 3 }} />
                    <span>
                      I have reviewed and confirmed all clinic configuration details.
                      {errors.confirmed && (
                        <div style={{ color: 'var(--status-error)', marginTop: 4 }}>{errors.confirmed}</div>
                      )}
                    </span>
                  </label>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
