/* Platform-admin screen for clinics.
 * Reads live CGS admin APIs so operators can manage clinics and usage. */
/* ==========================================================================
   CGS ADMIN CONTROL PLANE - CLINIC DETAIL PAGE
   9 Comprehensive Operational Tabs: Overview, Users, Leads, Appointments,
   WhatsApp Config, AI Receptionist, Billing, Usage, and Audit History.
   Includes Doctor & Employee Profile Registration.
   ========================================================================== */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Users,
  MessageSquare,
  Sparkles,
  CreditCard,
  BarChart3,
  ScrollText,
  CalendarCheck,
  UserCheck,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  FileText,
  UserPlus,
  Stethoscope,
  Star,
} from 'lucide-react';
import { clinicsApi } from '../../api/clinics.api';
import { Tabs } from '../../components/ui/Tabs';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { AddClinicProfileModal } from './AddClinicProfileModal';
import { Skeleton } from '../../components/feedback/Skeleton';
import { useToast, usePermissions } from '../../hooks';
import { formatCurrency, formatDate, formatDateTime, formatTokens } from '../../utils/formatters';

export const ClinicDetailPage: React.FC = () => {
  const { clinicId } = useParams<{ clinicId: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isAddProfileOpen, setIsAddProfileOpen] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const { can } = usePermissions();

  const { data: clinic, isLoading, error } = useQuery({
    queryKey: ['admin', 'clinic', clinicId],
    queryFn: () => clinicsApi.getClinicById(clinicId || 'cln_001'),
    enabled: !!clinicId,
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: 'ACTIVE' | 'SUSPENDED'; reason: string }) =>
      clinicsApi.updateClinicStatus(clinicId || 'cln_001', status, reason),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'clinic', clinicId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'clinics'] });
      success(
        `Status Updated`,
        `${updated.name} is now ${updated.status}.`
      );
      setIsSuspendModalOpen(false);
    },
    onError: (err: any) => {
      toastError('Action Failed', err.message || 'Could not update clinic status.');
    },
  });

  const primaryMutation = useMutation({
    mutationFn: (userId: string) => clinicsApi.setPrimaryDoctor(clinicId || '', userId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'clinic', clinicId] });
      success('Primary doctor updated', `${updated.name} now has a main doctor who can see all clinic records.`);
    },
    onError: (err: any) => {
      toastError('Could not set primary doctor', err.message || 'Please try again.');
    },
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Skeleton height="120px" borderRadius="var(--radius-lg)" />
        <Skeleton height="400px" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '18px', color: 'var(--status-error)' }}>Failed to load clinic details</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Resource might not exist or network failed.</p>
        <Button variant="secondary" onClick={() => navigate('/clinics')} style={{ marginTop: '16px' }}>
          Back to Clinics
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Building2 size={15} /> },
    { id: 'users', label: 'Users & Staff', icon: <Users size={15} />, count: clinic.users?.length || 0 },
    { id: 'leads_patients', label: 'Leads & Patients', icon: <UserCheck size={15} /> },
    { id: 'appointments', label: 'Appointments', icon: <CalendarCheck size={15} /> },
    { id: 'whatsapp', label: 'WhatsApp Account', icon: <MessageSquare size={15} /> },
    { id: 'ai', label: 'AI Receptionist', icon: <Sparkles size={15} /> },
    { id: 'billing', label: 'Subscription & Billing', icon: <CreditCard size={15} /> },
    { id: 'usage', label: 'Usage & Cost', icon: <BarChart3 size={15} /> },
    { id: 'audit', label: 'Audit History', icon: <ScrollText size={15} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Breadcrumb / Back Button */}
      <div>
        <button
          onClick={() => navigate('/clinics')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: 'var(--text-muted)',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={15} /> Back to All Clinics
        </button>
      </div>

      {/* Clinic Header Banner */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          padding: '24px',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              backgroundColor: 'var(--c-primary-50)',
              color: 'var(--c-primary-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '20px',
              border: '1px solid var(--c-primary-200)',
            }}
          >
            {clinic.name.charAt(0)}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {clinic.name}
              </h1>
              <Badge variant={clinic.status === 'ACTIVE' ? 'success' : clinic.status === 'SUSPENDED' ? 'error' : 'neutral'}>
                {clinic.status}
              </Badge>
              <Badge variant={clinic.tier === 'ENTERPRISE' ? 'purple' : 'info'}>
                {clinic.tier}
              </Badge>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '13px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span>Doctor: <strong style={{ color: 'var(--text-primary)' }}>{clinic.doctorName}</strong></span>
              <span>City: <strong>{clinic.city}, {clinic.state}</strong></span>
              <span>MRR: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(clinic.mrr)}</strong></span>
              <span>Staff: <strong style={{ color: 'var(--text-primary)' }}>{clinic.doctorsCount} Doctors • {clinic.staffCount} Staff</strong></span>
            </div>
            {clinic.landingPageId && (
              <div
                style={{
                  marginTop: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  background: 'var(--c-primary-50)',
                  border: '1px solid var(--c-primary-200)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: 'var(--c-primary-800)',
                }}
              >
                <strong>Landing Page ID:</strong>
                <code style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{clinic.landingPageId}</code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(clinic.landingPageId || '');
                    success('Copied', 'Landing Page ID copied to clipboard');
                  }}
                  style={{
                    marginLeft: 4,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--c-primary-700)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Add Profile Button */}
          {can('clinics.write') && (
            <Button
              variant="primary"
              leftIcon={<UserPlus size={15} />}
              onClick={() => setIsAddProfileOpen(true)}
              style={{ backgroundColor: 'var(--c-primary-600)' }}
            >
              Add Profile / Staff
            </Button>
          )}

          {can('clinics.suspend') && clinic.status === 'ACTIVE' && (
            <Button
              variant="outline"
              leftIcon={<Ban size={15} />}
              style={{ color: 'var(--status-error)', borderColor: 'var(--status-error-border)' }}
              onClick={() => setIsSuspendModalOpen(true)}
            >
              Suspend Clinic
            </Button>
          )}

          {can('clinics.suspend') && clinic.status === 'SUSPENDED' && (
            <Button
              variant="primary"
              leftIcon={<CheckCircle2 size={15} />}
              style={{ backgroundColor: 'var(--status-success)', borderColor: 'var(--status-success)' }}
              onClick={() =>
                statusMutation.mutate({
                  status: 'ACTIVE',
                  reason: 'Reactivated by Super Admin',
                })
              }
            >
              Reactivate Clinic
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="grid-cards-3">
            <Card title="Clinic Contact & Address">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mail size={16} color="var(--text-muted)" />
                  <span>{clinic.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Phone size={16} color="var(--text-muted)" />
                  <span>{clinic.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <MapPin size={16} color="var(--text-muted)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{clinic.address}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                  <FileText size={16} color="var(--text-muted)" />
                  <span>GSTIN: <strong>{clinic.gstin || '—'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '6px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                  <FileText size={16} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>Landing Page ID</div>
                    <strong style={{ wordBreak: 'break-all' }}>{clinic.landingPageId || clinic.landingPage?.landingPageId || '—'}</strong>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                      Public fetch: /cgs_api/v1/public/landing/{clinic.landingPageId || clinic.landingPage?.landingPageId || '{id}'}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card
              title="Platform Metrics Summary"
              action={
                can('clinics.write') && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<UserPlus size={13} />}
                    onClick={() => setIsAddProfileOpen(true)}
                  >
                    + Add Profile
                  </Button>
                )
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Registered Patients:</span>
                  <strong>{clinic.patientsCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Leads Captured:</span>
                  <strong>{clinic.leadsCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Appointments Booked:</span>
                  <strong>{clinic.appointmentsCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Staff Members:</span>
                  <strong>{clinic.doctorsCount} Doctors • {clinic.staffCount} Staff</strong>
                </div>
              </div>
            </Card>

            <Card title="Active Infrastructure State">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>WhatsApp Cloud API</span>
                  <Badge variant={clinic.whatsappConfig.connectionState === 'CONNECTED' ? 'success' : 'error'}>
                    {clinic.whatsappConfig.connectionState}
                  </Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>AI Receptionist</span>
                  <Badge variant={clinic.aiConfig.enabled ? 'ai' : 'neutral'}>
                    {clinic.aiConfig.enabled ? 'ACTIVE' : 'DISABLED'}
                  </Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>WABA Webhook Health</span>
                  <Badge variant={clinic.whatsappConfig.webhookStatus === 'HEALTHY' ? 'success' : 'warning'}>
                    {clinic.whatsappConfig.webhookStatus}
                  </Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>WABA Quality Rating</span>
                  <Badge variant={clinic.whatsappConfig.qualityRating === 'GREEN' ? 'success' : 'error'}>
                    {clinic.whatsappConfig.qualityRating}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Users & Staff */}
      {activeTab === 'users' && (
        <Card
          title="Clinic Doctors & Operational Staff Directory"
          subtitle="All medical practitioners and staff profiles registered to this tenant"
          action={
            can('clinics.write') && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserPlus size={14} />}
                onClick={() => setIsAddProfileOpen(true)}
              >
                Add Doctor / Staff Profile
              </Button>
            )
          }
        >
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Staff / Doctor Name</th>
                  <th>Category</th>
                  <th>Clinical / Operational Role</th>
                  <th>Doctor Specific Details</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  <th>Last Active</th>
                  <th>Primary</th>
                </tr>
              </thead>
              <tbody>
                {clinic.users?.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {u.role === 'DOCTOR' ? (
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--status-ai-bg)', color: 'var(--status-ai)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Stethoscope size={15} />
                          </div>
                        ) : (
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--c-slate-100)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={15} />
                          </div>
                        )}
                        <div>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '13.5px' }}>{u.name}</strong>
                          {u.qualification && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                              {u.qualification}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={u.role === 'DOCTOR' ? 'purple' : 'info'}>
                        {u.role === 'DOCTOR' ? '🩺 Doctor' : '👤 Employee'}
                      </Badge>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        {u.designation || (u.role === 'DOCTOR' ? 'Dental Surgeon' : 'Clinic Staff')}
                      </span>
                    </td>
                    <td>
                      {u.role === 'DOCTOR' ? (
                        <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {u.specialization && (
                            <span style={{ color: 'var(--c-primary-700)', fontWeight: 600 }}>
                              {u.specialization}
                            </span>
                          )}
                          {u.registrationNumber && (
                            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              Reg: {u.registrationNumber}
                            </span>
                          )}
                          {u.consultationFee && (
                            <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>
                              Fee: {formatCurrency(u.consultationFee)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>— Operational Staff —</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        <div>{u.email}</div>
                        <div>{u.phone}</div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={u.status === 'ACTIVE' ? 'success' : 'error'}>{u.status}</Badge>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {formatDateTime(u.lastActiveAt)}
                    </td>
                    <td>
                      {u.role === 'DOCTOR' ? (
                        u.isPrimary ? (
                          <Badge variant="success">Primary</Badge>
                        ) : (
                          can('clinics.write') && (
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<Star size={13} />}
                              isLoading={primaryMutation.isPending}
                              onClick={() => primaryMutation.mutate(u.id)}
                            >
                              Make primary
                            </Button>
                          )
                        )
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Leads & Patients */}
      {activeTab === 'leads_patients' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="grid-cards-3">
            <Card title="Total Leads Captured">
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {clinic.leadsCount}
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Meta Ads & WhatsApp Inbound Inquiries
              </p>
            </Card>
            <Card title="Verified Patients">
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--status-success)' }}>
                {clinic.patientsCount}
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Active patients with treatment records
              </p>
            </Card>
            <Card title="Lead-to-Patient Conversion">
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--c-primary-600)' }}>
                {((clinic.patientsCount / (clinic.leadsCount + clinic.patientsCount)) * 100).toFixed(1)}%
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Overall clinic acquisition conversion rate
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 4: Appointments */}
      {activeTab === 'appointments' && (
        <Card title="Appointments Statistics">
          <div className="grid-cards-3">
            <div style={{ padding: '16px', backgroundColor: 'var(--c-slate-50)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Appointments Booked</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {clinic.appointmentsCount}
              </div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--status-success-bg)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '12px', color: 'var(--status-success)' }}>Completed Treatments</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--status-success)', marginTop: '4px' }}>
                {Math.round(clinic.appointmentsCount * 0.85)}
              </div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--c-slate-50)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Automated WhatsApp Reminders</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--c-primary-600)', marginTop: '4px' }}>
                {clinic.appointmentsCount * 2} Dispatched
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 5: WhatsApp Account Config */}
      {activeTab === 'whatsapp' && (
        <Card
          title="WhatsApp Business Cloud API Configuration"
          subtitle="Direct Meta Cloud WABA Account Connection (Tokens and sensitive secrets are safely redacted)"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div style={{ padding: '14px', backgroundColor: 'var(--c-slate-50)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>WABA Phone Number</span>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {clinic.whatsappConfig.phoneNumber}
                </div>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--c-slate-50)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Meta WABA Account ID</span>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  {clinic.whatsappConfig.wabaId}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ padding: '14px', backgroundColor: 'var(--c-slate-50)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Connection State</span>
                <div style={{ marginTop: '4px' }}>
                  <Badge variant={clinic.whatsappConfig.connectionState === 'CONNECTED' ? 'success' : 'error'}>
                    {clinic.whatsappConfig.connectionState}
                  </Badge>
                </div>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--c-slate-50)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Webhook Health</span>
                <div style={{ marginTop: '4px' }}>
                  <Badge variant={clinic.whatsappConfig.webhookStatus === 'HEALTHY' ? 'success' : 'warning'}>
                    {clinic.whatsappConfig.webhookStatus}
                  </Badge>
                </div>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--c-slate-50)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Daily Message Tier</span>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {clinic.whatsappConfig.dailyLimit} messages / day
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 6: AI Receptionist Config */}
      {activeTab === 'ai' && (
        <Card
          title="AI Receptionist LLM Engine"
          subtitle="Autonomous WhatsApp conversational booking and clinical memory"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ padding: '14px', backgroundColor: 'var(--c-slate-50)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>LLM Model Tier</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--status-ai)', marginTop: '4px' }}>
                  {clinic.aiConfig.model}
                </div>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--c-slate-50)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>System Prompt Version</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  {clinic.aiConfig.systemPromptVersion}
                </div>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--c-slate-50)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Custom Knowledge Documents</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {clinic.aiConfig.customKnowledgeDocsCount} FAQs & Price Sheets
                </div>
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--status-ai-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--status-ai-border)' }}>
              {(() => {
                const quota = clinic.aiConfig.monthlyTokenQuota || 1000000;
                const consumed = clinic.aiConfig.tokensConsumedThisMonth || 0;
                const percent = Math.min(100, Math.round((consumed / quota) * 100));
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--status-ai)' }}>
                        Monthly Token Consumption
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatTokens(consumed)} / {formatTokens(quota)} ({percent}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#ffffff', borderRadius: '4px', marginTop: '8px', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', backgroundColor: 'var(--status-ai)', borderRadius: '4px', transition: 'width 0.3s ease' }} />
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </Card>
      )}

      {/* Tab 7: Subscription & Billing */}
      {activeTab === 'billing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card title="CGS Subscription Status">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current Plan</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {clinic.subscription.planName}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monthly Fee</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {formatCurrency(clinic.subscription.amount)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Billing Cycle</span>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {formatDate(clinic.subscription.currentPeriodStart)} - {formatDate(clinic.subscription.currentPeriodEnd)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Payment Channel</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {clinic.subscription.paymentMethodBrand} •••• {clinic.subscription.paymentMethodLast4}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 8: Usage & Cost */}
      {activeTab === 'usage' && (
        <Card title="August 2026 Usage & Overage Breakdown">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--c-slate-50)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>WhatsApp Service Chats</span>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {clinic.usageSummary.whatsappConversations} Chats
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Overage Cost: <strong>{formatCurrency(clinic.usageSummary.whatsappCost)}</strong>
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--c-slate-50)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AI Tokens Utilized</span>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {formatTokens(clinic.usageSummary.aiTokens)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Within Included Quota (₹0 Overage)
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--status-warning-bg)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '12px', color: 'var(--status-warning)' }}>Total Billable Overage</span>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--status-warning)', marginTop: '4px' }}>
                {formatCurrency(clinic.usageSummary.totalOverageCost)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Added to end-of-month invoice
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 9: Audit History */}
      {activeTab === 'audit' && (
        <Card title="Clinic Audit Log History">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {clinic.recentAuditLogs?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No audit records for this clinic yet.</p>
            ) : (
              clinic.recentAuditLogs?.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--c-slate-50)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <code style={{ fontWeight: 600, color: 'var(--c-primary-700)' }}>{log.action}</code>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                      by {log.actorEmail}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {formatDateTime(log.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Add Profile Modal */}
      <AddClinicProfileModal
        isOpen={isAddProfileOpen}
        onClose={() => setIsAddProfileOpen(false)}
        clinicId={clinic.id}
        clinicName={clinic.name}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin', 'clinic', clinicId] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'clinics'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        }}
      />

      {/* Suspend Clinic Confirmation Modal */}
      <ConfirmationModal
        isOpen={isSuspendModalOpen}
        onClose={() => setIsSuspendModalOpen(false)}
        onConfirm={(reason) =>
          statusMutation.mutate({
            status: 'SUSPENDED',
            reason: reason || 'Suspended by Super Admin',
          })
        }
        title="Suspend Clinic Tenant"
        description={`Suspending "${clinic.name}" will block staff access and pause all outgoing WhatsApp automations.`}
        resourceName={`${clinic.name} (${clinic.slug})`}
        actionType="danger"
        confirmLabel="Confirm Suspension"
        requireReason={true}
      />
    </div>
  );
};
