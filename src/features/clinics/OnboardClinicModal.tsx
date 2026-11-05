/* Admin modal for clinics workflows.
 * Collects operator input and posts it to the CGS admin API. */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Wifi,
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
  'Add-ons',
  'Landing Page',
  'WhatsApp Setup',
  'AI Configuration',
  'Review & Submit',
] as const;

const ADDON_CHOICES = [
  { type: 'EXTRA_DOCTOR', label: 'Extra doctor', price: '₹1,000 / month', tiers: ['STARTER', 'GROWTH', 'ENTERPRISE'] },
  { type: 'EXTRA_STAFF', label: 'Extra staff member', price: '₹500 / month', tiers: ['STARTER', 'GROWTH', 'ENTERPRISE'] },
  { type: 'EXTRA_AI_REPLIES', label: 'Extra 300 AI replies', price: '₹500 this period', tiers: ['STARTER', 'GROWTH', 'ENTERPRISE'] },
  { type: 'EXTRA_WHATSAPP_NUMBER', label: 'Extra WhatsApp number', price: '₹1,500 / month', tiers: ['STARTER', 'GROWTH', 'ENTERPRISE'] },
  { type: 'PRIORITY_SUPPORT', label: 'Priority support', price: '₹2,000 / month', tiers: ['STARTER', 'GROWTH'] },
];
const EXTRA_AUTOMATIONS = [
  { key: 'MISSED_APPOINTMENT', label: 'Missed appointment' },
  { key: 'COMPLETED_VISIT', label: 'Completed-visit follow-up' },
  { key: 'PATIENT_REACTIVATION', label: 'Patient reactivation' },
];
const INCLUDED_AUTOMATIONS: Record<string, string[]> = {
  STARTER: ['New enquiry', 'Invoice', 'Appointment reminder'],
  GROWTH: ['New enquiry', 'Invoice', 'Appointment reminder', 'Missed appointment', 'Completed-visit follow-up'],
  ENTERPRISE: ['New enquiry', 'Invoice', 'Appointment reminder', 'Missed appointment', 'Completed-visit follow-up', 'Patient reactivation'],
};

interface SelectedAddon {
  type: string;
  quantity: number;
  automationKey?: string;
}

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
  earlyBird: boolean;
  addons: SelectedAddon[];
  landingTitle: string;
  landingShortDescription: string;
  primaryCta: string;
  landingWhatsapp: string;
  enquiryFormEnabled: boolean;
  waBusinessAccountId: string;
  waPhoneNumberId: string;
  waDisplayPhone: string;
  waAccessToken: string;
  waApiVersion: string;
  webhookUrl: string;
  verifyToken: string;
  webhookStatus: string;
  waConnectionStatus: 'Connected' | 'Not Connected' | 'Testing';
  clinicInformation: string;
  faqs: string;
  receptionistName: string;
  aiTone: string;
  conversationInstructions: string;
  greetingMessage: string;
  confirmed: boolean;
}

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
  earlyBird: false,
  addons: [],
  landingTitle: '',
  landingShortDescription: '',
  primaryCta: 'Book Appointment on WhatsApp',
  landingWhatsapp: '',
  enquiryFormEnabled: true,
  waBusinessAccountId: '',
  waPhoneNumberId: '',
  waDisplayPhone: '',
  waAccessToken: '',
  waApiVersion: 'v19.0',
  webhookUrl: '',
  verifyToken: '',
  webhookStatus: 'PENDING',
  waConnectionStatus: 'Not Connected',
  clinicInformation: '',
  faqs: '',
  receptionistName: 'Asha',
  aiTone: 'professional',
  conversationInstructions: 'Be helpful, concise, and guide patients toward booking.',
  greetingMessage: 'Hello! Welcome to our clinic. How can I help you today?',
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successClinic, setSuccessClinic] = useState<Clinic | null>(null);
  const [reviewOpen, setReviewOpen] = useState<Record<string, boolean>>({
    clinic: true,
    addons: false,
    landing: false,
    whatsapp: false,
    ai: false,
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
    setErrors({});
    setSubmitError('');
    setSuccessClinic(null);
    onClose();
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
    if (index === 2) {
      if (!form.landingTitle.trim()) nextErrors.landingTitle = 'Landing page title is required';
      if (!form.landingShortDescription.trim()) {
        nextErrors.landingShortDescription = 'Short description is required';
      }
      if (!form.primaryCta.trim()) nextErrors.primaryCta = 'Primary CTA is required';
    }
    if (index === 4) {
      if (!form.receptionistName.trim()) nextErrors.receptionistName = 'AI receptionist name is required';
      if (!form.greetingMessage.trim()) nextErrors.greetingMessage = 'Greeting message is required';
    }
    if (index === 5) {
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
      earlyBird: form.earlyBird,
      addons: form.addons.filter((addon) => addon.quantity > 0),
      landingPage: {
        title: form.landingTitle.trim(),
        shortDescription: form.landingShortDescription.trim(),
        primaryCta: form.primaryCta.trim(),
        whatsappNumber: form.landingWhatsapp.trim() || form.phone.trim(),
        enquiryFormEnabled: form.enquiryFormEnabled,
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
            }
          : undefined,
      ai: {
        receptionistName: form.receptionistName,
        tone: form.aiTone,
        greetingMessage: form.greetingMessage,
        conversationInstructions: form.conversationInstructions,
        clinicInformation: form.clinicInformation,
        faqs: form.faqs,
        isAiEnabled: true,
      },
    };
  };

  const handleSubmit = async () => {
    if (!validateStep(STEPS.length - 1)) return;
    setIsLoading(true);
    setSubmitError('');
    try {
      const created = await clinicsApi.createClinic(buildPayload() as any);
      setSuccessClinic(created);
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

  const addonSelected = (type: string, automationKey?: string) =>
    form.addons.some((addon) => addon.type === type && addon.automationKey === automationKey);

  const toggleAddon = (type: string, automationKey?: string) => {
    setForm((prev) => {
      const exists = prev.addons.some((addon) => addon.type === type && addon.automationKey === automationKey);
      return {
        ...prev,
        addons: exists
          ? prev.addons.filter((addon) => !(addon.type === type && addon.automationKey === automationKey))
          : [...prev.addons, { type, quantity: 1, automationKey }],
      };
    });
  };

  const setAddonQuantity = (type: string, automationKey: string | undefined, quantity: number) => {
    const next = Math.min(20, Math.max(1, quantity || 1));
    setForm((prev) => ({
      ...prev,
      addons: prev.addons.map((addon) =>
        addon.type === type && addon.automationKey === automationKey ? { ...addon, quantity: next } : addon
      ),
    }));
  };

  const changePackage = (tier: SubscriptionTier) => {
    setForm((prev) => ({
      ...prev,
      tier,
      addons: prev.addons.filter((addon) => {
        if (addon.type === 'EXTRA_AUTOMATION') {
          if (tier === 'STARTER') return true;
          return tier === 'GROWTH' && addon.automationKey === 'PATIENT_REACTIVATION';
        }
        return ADDON_CHOICES.some((choice) => choice.type === addon.type && choice.tiers.includes(tier));
      }),
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
                    label="Package"
                    value={form.tier}
                    onChange={(e) => changePackage(e.target.value as SubscriptionTier)}
                    options={[
                      { value: 'STARTER', label: 'Essential · ₹10,000 / month' },
                      { value: 'GROWTH', label: 'Growth · ₹12,000 / month' },
                      { value: 'ENTERPRISE', label: 'Scale · ₹18,000 / month' },
                    ]}
                  />
                </div>
                <ToggleRow
                  label="Early Bird"
                  checked={form.earlyBird}
                  onChange={(v) => patch('earlyBird', v)}
                  hint="Essential ₹8,000, Growth ₹10,000, Scale ₹15,000. Limited to five clinics."
                />
              </div>
            )}

            {step === 1 && (
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>Add-ons</div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                  Optional extras for {form.tier === 'STARTER' ? 'Essential' : form.tier === 'ENTERPRISE' ? 'Scale' : 'Growth'}.
                  They are saved as pending until payment is confirmed on the clinic package page.
                </p>
                {ADDON_CHOICES.filter((choice) => choice.tiers.includes(form.tier)).map((choice) => {
                  const selected = addonSelected(choice.type);
                  const quantity = form.addons.find((addon) => addon.type === choice.type)?.quantity || 1;
                  return (
                    <label key={choice.type} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                      <input type="checkbox" checked={selected} onChange={() => toggleAddon(choice.type)} />
                      <span style={{ flex: 1 }}>{choice.label} · {choice.price}</span>
                      {selected && (
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={quantity}
                          onClick={(event) => event.preventDefault()}
                          onChange={(event) => setAddonQuantity(choice.type, undefined, Number(event.target.value))}
                          style={{ width: 72, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border-light)' }}
                        />
                      )}
                    </label>
                  );
                })}
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                  WhatsApp automations on this package: {(INCLUDED_AUTOMATIONS[form.tier] || []).join(', ')}.
                  {form.tier === 'STARTER'
                    ? ' The three below can be added at ₹500 / month.'
                    : form.tier === 'GROWTH'
                      ? ' Patient reactivation can be added at ₹500 / month.'
                      : ' All six WhatsApp automations are included.'}
                </p>
                {(form.tier === 'STARTER'
                  ? EXTRA_AUTOMATIONS
                  : form.tier === 'GROWTH'
                    ? EXTRA_AUTOMATIONS.filter((automation) => automation.key === 'PATIENT_REACTIVATION')
                    : []
                ).map((automation) => {
                  const selected = addonSelected('EXTRA_AUTOMATION', automation.key);
                  const quantity = form.addons.find((addon) => addon.automationKey === automation.key)?.quantity || 1;
                  return (
                    <label key={automation.key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                      <input type="checkbox" checked={selected} onChange={() => toggleAddon('EXTRA_AUTOMATION', automation.key)} />
                      <span style={{ flex: 1 }}>{automation.label} · ₹500 / month</span>
                      {selected && (
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={quantity}
                          onClick={(event) => event.preventDefault()}
                          onChange={(event) => setAddonQuantity('EXTRA_AUTOMATION', automation.key, Number(event.target.value))}
                          style={{ width: 72, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border-light)' }}
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>Landing Page Configuration</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input label="Landing Page Title" required value={form.landingTitle} error={errors.landingTitle} onChange={(e) => patch('landingTitle', e.target.value)} />
                  <Input label="Primary CTA" required value={form.primaryCta} error={errors.primaryCta} onChange={(e) => patch('primaryCta', e.target.value)} />
                  <Input label="WhatsApp Number" value={form.landingWhatsapp} onChange={(e) => patch('landingWhatsapp', e.target.value)} />
                  <ToggleRow label="Enquiry Form" checked={form.enquiryFormEnabled} onChange={(v) => patch('enquiryFormEnabled', v)} hint="Enable enquiry form on landing page" />
                </div>
                <TextAreaField label="Short Description" required value={form.landingShortDescription} error={errors.landingShortDescription} onChange={(v) => patch('landingShortDescription', v)} />
              </div>
            )}

            {step === 3 && (
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
              </div>
            )}

            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={sectionStyle}>
                  <div style={sectionTitleStyle}>Clinic Knowledge</div>
                  <TextAreaField label="Clinic Information" value={form.clinicInformation} onChange={(v) => patch('clinicInformation', v)} />
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

            {step === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reviewSection('clinic', 'Clinic Details', 0, (
                  <>
                    <div>{form.name} · {form.city}</div>
                    <div>{form.email} · {form.phone}</div>
                    <div>{form.address}</div>
                    <div>{form.workingDays.join(', ')} · {form.openingTime}-{form.closingTime}</div>
                    <div>
                      Package: {form.tier === 'STARTER' ? 'Essential' : form.tier === 'ENTERPRISE' ? 'Scale' : 'Growth'}
                      {form.earlyBird ? ' · Early Bird' : ''}
                    </div>
                  </>
                ))}
                {reviewSection('addons', 'Add-ons', 1, (
                  <>
                    {form.addons.length === 0 ? <div>None selected</div> : form.addons.map((addon) => (
                      <div key={`${addon.type}-${addon.automationKey || ''}`}>
                        {(addon.automationKey || addon.type).split('_').join(' ')} × {addon.quantity}
                      </div>
                    ))}
                  </>
                ))}
                {reviewSection('landing', 'Landing Page', 2, (
                  <>
                    <div>{form.landingTitle}</div>
                    <div>{form.landingShortDescription}</div>
                    <div>CTA: {form.primaryCta}</div>
                    <div>Enquiry form: {form.enquiryFormEnabled ? 'Enabled' : 'Disabled'}</div>
                  </>
                ))}
                {reviewSection('whatsapp', 'WhatsApp', 3, (
                  <>
                    <div>Phone Number ID: {form.waPhoneNumberId || 'Not configured'}</div>
                    <div>Status: {form.waConnectionStatus}</div>
                  </>
                ))}
                {reviewSection('ai', 'AI Configuration', 4, (
                  <>
                    <div>{form.receptionistName} · {form.aiTone}</div>
                    <div>{form.greetingMessage}</div>
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
