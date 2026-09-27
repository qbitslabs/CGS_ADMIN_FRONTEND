/* Platform-admin screen for doctors.
 * Reads live CGS admin APIs so operators can manage clinics and usage. */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Stethoscope, Clock, Calendar, Search, Mail, Phone, Award, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { doctorsApi } from '../../api/doctors.api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const DoctorsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: doctors = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'doctors', debouncedSearch, statusFilter],
    queryFn: () =>
      doctorsApi.getDoctors({
        search: debouncedSearch || undefined,
        isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
      }),
  });

  const { data: selectedDoctor, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['admin', 'doctor', selectedDoctorId],
    queryFn: () => (selectedDoctorId ? doctorsApi.getDoctorById(selectedDoctorId) : null),
    enabled: !!selectedDoctorId,
  });

  const { data: doctorAnalytics } = useQuery({
    queryKey: ['admin', 'doctor-analytics', selectedDoctorId],
    queryFn: () => (selectedDoctorId ? doctorsApi.getDoctorAnalytics(selectedDoctorId) : null),
    enabled: !!selectedDoctorId,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Doctor & Clinical Staff Directory
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Manage doctor profiles, consultation fees, procedure assignments, and weekly schedule rosters.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-toolbar-inputs">
          <div style={{ minWidth: '280px', flex: 1 }}>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by doctor name, specialization, or email..."
              leftIcon={<Search size={16} />}
            />
          </div>

          <div style={{ width: '160px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="select-field"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          Loading doctor directory...
        </div>
      )}

      {isError && (
        <div style={{ padding: '20px', backgroundColor: '#fff1f2', borderRadius: '8px', border: '1px solid #fecdd3', color: '#e11d48', fontSize: '13px' }}>
          Failed to load doctor roster. Please try refreshing.
        </div>
      )}

      {!isLoading && !isError && doctors.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
          <Stethoscope size={32} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>No doctors found</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>No doctor profiles match your current search or status filter.</p>
        </div>
      )}

      {/* Doctors List & Detail Layout */}
      {!isLoading && !isError && doctors.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedDoctorId ? '1.2fr 1fr' : '1fr', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: selectedDoctorId ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {doctors.map((doc) => (
              <Card
                key={doc.id}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Stethoscope size={18} color="var(--c-primary-700, #0f766e)" />
                      <span style={{ fontWeight: 700 }}>{doc.name}</span>
                    </div>
                    <Badge variant={doc.isActive ? 'success' : 'neutral'}>
                      {doc.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </div>
                }
                subtitle={`${doc.specialization} • ${doc.clinicName}`}
              >
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Consultation Fee:</span>
                    <span style={{ fontWeight: 700, color: 'var(--c-primary-700, #0f766e)' }}>₹{doc.consultationFee}</span>
                  </div>

                  {doc.experienceYears > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Experience:</span>
                      <span>{doc.experienceYears} Years</span>
                    </div>
                  )}

                  {doc.email && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                      <span style={{ color: 'var(--c-slate-700)' }}>{doc.email}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Assigned Services:</span>
                    <Badge variant="info">{doc.servicesCount} Procedures</Badge>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Appointments:</span>
                    <span style={{ fontWeight: 600 }}>{doc.appointmentsCount}</span>
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    <Button
                      size="sm"
                      variant={selectedDoctorId === doc.id ? 'primary' : 'outline'}
                      style={{ width: '100%' }}
                      onClick={() => setSelectedDoctorId(doc.id)}
                    >
                      {selectedDoctorId === doc.id ? 'Viewing Roster & Schedules' : 'View Roster & Procedures'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Selected Doctor Detailed Drawer */}
          {selectedDoctorId && (
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span>{selectedDoctor ? selectedDoctor.name : 'Loading Roster...'}</span>
                  <button
                    onClick={() => setSelectedDoctorId(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-muted)' }}
                  >
                    ✕
                  </button>
                </div>
              }
              subtitle={selectedDoctor ? `${selectedDoctor.specialization} • ${selectedDoctor.clinicName}` : 'Doctor Details'}
            >
              {isLoadingDetail || !selectedDoctor ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading schedule details...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
                  {/* Doctor Metadata */}
                  <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {selectedDoctor.registrationNo && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <ShieldCheck size={14} color="#0f766e" />
                        <span>Reg No: <strong>{selectedDoctor.registrationNo}</strong></span>
                      </div>
                    )}
                    {selectedDoctor.qualification && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <Award size={14} color="#0f766e" />
                        <span>Qualification: <strong>{selectedDoctor.qualification}</strong></span>
                      </div>
                    )}
                    {selectedDoctor.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <Phone size={14} color="#64748b" />
                        <span>Phone: {selectedDoctor.phone}</span>
                      </div>
                    )}
                    {selectedDoctor.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <Mail size={14} color="#64748b" />
                        <span>Email: {selectedDoctor.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Working Days */}
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={15} color="var(--c-primary-700)" /> Operating Days & Hours:
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                      {selectedDoctor.availabilityDays.length > 0 ? (
                        selectedDoctor.availabilityDays.map((day, idx) => (
                          <Badge key={idx} variant="info">{day}</Badge>
                        ))
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Monday to Saturday</span>
                      )}
                    </div>
                    {selectedDoctor.availabilityHours && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Daily Window: {selectedDoctor.availabilityHours}
                      </div>
                    )}
                  </div>

                  {/* Linked Procedures */}
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Stethoscope size={15} color="var(--c-primary-700)" /> Assigned Services & Pricing ({selectedDoctor.services.length}):
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                      {selectedDoctor.services.length > 0 ? (
                        selectedDoctor.services.map((s, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 10px',
                              backgroundColor: '#f8fafc',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>{s.serviceName}</span>
                            <span style={{ fontWeight: 700, color: 'var(--c-primary-700)' }}>
                              ₹{s.price} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>({s.durationMinutes}m)</span>
                            </span>
                          </div>
                        ))
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No procedure assignments configured.</span>
                      )}
                    </div>
                  </div>

                  {/* Analytics */}
                  {doctorAnalytics && (
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Award size={15} color="var(--c-primary-700)" /> Performance Analytics
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Completed Apts</div>
                          <div style={{ fontSize: '18px', fontWeight: 800 }}>{doctorAnalytics.appointments?.completedCount ?? 0}</div>
                        </div>
                        <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Est. Revenue</div>
                          <div style={{ fontSize: '18px', fontWeight: 800 }}>₹{Number(doctorAnalytics.appointments?.estimatedRevenue || 0).toLocaleString()}</div>
                        </div>
                        <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AI Requests</div>
                          <div style={{ fontSize: '18px', fontWeight: 800 }}>{doctorAnalytics.aiUsage?.totalRequests ?? 0}</div>
                        </div>
                        <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AI Tokens</div>
                          <div style={{ fontSize: '18px', fontWeight: 800 }}>{Number(doctorAnalytics.aiUsage?.totalTokens || 0).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Weekly Shift Schedules */}
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={15} color="var(--c-primary-700)" /> Weekly Schedules ({selectedDoctor.schedules.length}):
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                      {selectedDoctor.schedules.length > 0 ? (
                        selectedDoctor.schedules.map((sch, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 10px',
                              backgroundColor: '#f1f5f9',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {sch.isAvailable !== false ? (
                                <CheckCircle2 size={13} color="#16a34a" />
                              ) : (
                                <XCircle size={13} color="#94a3b8" />
                              )}
                              <span style={{ fontWeight: 600 }}>{sch.dayOfWeek}</span>
                            </div>
                            <span style={{ fontWeight: 600, color: '#334155' }}>
                              {sch.startTime} - {sch.endTime}{' '}
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>({sch.slotDurationMinutes}m slots)</span>
                            </span>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
                          Standard clinic hours applied (09:00 AM - 06:00 PM).
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
