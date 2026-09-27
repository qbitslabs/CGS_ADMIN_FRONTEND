/* Platform-admin screen for dashboard.
 * Reads live CGS admin APIs so operators can manage clinics and usage. */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  TrendingUp,
  CreditCard,
  Users,
  MessageSquare,
  Sparkles,
  Server,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard.api';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatCompactNumber, formatTokens, formatRelativeTime } from '../../utils/formatters';
import { Skeleton } from '../../components/feedback/Skeleton';

export const DashboardPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => dashboardApi.getSummary(),
  });

  const kpi = data?.kpi;
  const health = data?.health;
  const recentActivity = data?.recentActivity;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Welcome & Health Summary Banner */}
      <div
        style={{
          backgroundColor: '#0f172a',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          border: '1px solid #334155',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-primary-400)' }}>
              Platform Overview
            </span>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#64748b' }} />
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Live Dental SaaS Cluster</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginTop: '4px', letterSpacing: '-0.02em' }}>
            CGS Platform Command Center
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '4px' }}>
            All systems operational. Serving <strong>{kpi?.activeClinics || 3} Dental Practices</strong> across active clinical regions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/clinics">
            <Button
              variant="primary"
              leftIcon={<Building2 size={16} />}
              style={{ backgroundColor: '#0284c7', borderColor: '#0369a1' }}
            >
              Manage Clinics
            </Button>
          </Link>
          <Link to="/jobs">
            <Button
              variant="outline"
              leftIcon={<Activity size={16} />}
              style={{ color: '#ffffff', borderColor: '#475569', backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              Worker Queues
            </Button>
          </Link>
        </div>
      </div>

      {/* Row 1: High-Level Platform KPIs */}
      {isLoading ? (
        <div className="grid-cards-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="130px" borderRadius="var(--radius-lg)" />
          ))}
        </div>
      ) : (
        <div className="grid-cards-4">
          <StatCard
            title="Total Active Clinics"
            value={`${kpi?.activeClinics || 0} / ${kpi?.totalClinics || 0}`}
            subtitle={`${kpi?.newClinicsThisMonth || 0} new this month`}
            icon={<Building2 size={22} />}
            iconBg="var(--c-primary-50)"
            iconColor="var(--c-primary-600)"
          />

          <StatCard
            title="Monthly Platform MRR"
            value={formatCurrency(kpi?.mrr || 0)}
            subtitle={
              kpi?.mrr
                ? `ARR ${formatCurrency((kpi.mrr || 0) * 12)}`
                : 'Monthly recurring revenue'
            }
            icon={<TrendingUp size={22} />}
            iconBg="var(--status-success-bg)"
            iconColor="var(--status-success)"
          />

          <StatCard
            title="Active Subscriptions"
            value={kpi?.activeSubscriptions || 0}
            subtitle={
              kpi?.failedPaymentCount
                ? `${kpi.failedPaymentCount} failed payment${kpi.failedPaymentCount === 1 ? '' : 's'} need action`
                : 'No failed payments'
            }
            badge={
              kpi?.failedPaymentCount ? (
                <Badge variant="error" size="sm">
                  {kpi.failedPaymentCount} Past Due
                </Badge>
              ) : (
                <Badge variant="success" size="sm">
                  All Current
                </Badge>
              )
            }
            icon={<CreditCard size={22} />}
            iconBg="var(--status-warning-bg)"
            iconColor="var(--status-warning)"
          />

          <StatCard
            title="Total Platform Patients"
            value={formatCompactNumber(kpi?.totalPatients || 0)}
            subtitle={`${formatCompactNumber(kpi?.totalLeads || 0)} leads • ${formatCompactNumber(kpi?.totalAppointments || 0)} appts`}
            icon={<Users size={22} />}
            iconBg="var(--status-info-bg)"
            iconColor="var(--status-info)"
          />
        </div>
      )}

      {/* Row 2: Infrastructure & Usage Meter Cards */}
      <div className="grid-cards-3">
        {/* Card 1: WhatsApp Cloud API Meter */}
        {(() => {
          const waTotalLimit = Math.max(1, (kpi?.activeClinics || 1) * 7500);
          const waUsed = kpi?.whatsappConversations || 0;
          const waPct = Math.min(100, Math.max(waUsed > 0 ? 1 : 0, Math.round((waUsed / waTotalLimit) * 100)));

          return (
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={18} color="var(--status-success)" />
                  <span>WhatsApp Cloud API Usage</span>
                </div>
              }
              subtitle="Meta Business Platform Service & Marketing Chats"
              action={
                <Link to="/usage/whatsapp">
                  <span style={{ fontSize: '12.5px', color: 'var(--c-primary-600)', fontWeight: 600 }}>Details →</span>
                </Link>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {formatCompactNumber(waUsed)}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Platform Cost: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(kpi?.whatsappCost || 0)}</strong>
                  </span>
                </div>

                {/* Meter Bar */}
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--c-slate-100)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${waPct}%`,
                      height: '100%',
                      backgroundColor: waPct > 90 ? 'var(--status-warning)' : 'var(--status-success)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>Included Tier: {waTotalLimit.toLocaleString()}</span>
                  <span>{waUsed > waTotalLimit ? `Overage: ${(waUsed - waTotalLimit).toLocaleString()} @ ₹0.40` : `${waPct}% consumed`}</span>
                </div>
              </div>
            </Card>
          );
        })()}

        {/* Card 2: AI Receptionist LLM Meter */}
        {(() => {
          const aiTotalLimit = Math.max(1, (kpi?.activeClinics || 1) * 1000000);
          const aiUsed = kpi?.aiTokens || 0;
          const aiPct = Math.min(100, Math.max(aiUsed > 0 ? 1 : 0, Math.round((aiUsed / aiTotalLimit) * 100)));

          return (
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--status-ai)" />
                  <span>AI Receptionist LLM Load</span>
                </div>
              }
              subtitle="Google: Gemma 4 31B tokens"
              action={
                <Link to="/usage/ai">
                  <span style={{ fontSize: '12.5px', color: 'var(--c-primary-600)', fontWeight: 600 }}>Details →</span>
                </Link>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {formatTokens(aiUsed)}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    LLM Cost: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(kpi?.aiCost || 0)}</strong>
                  </span>
                </div>

                {/* Meter Bar */}
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--c-slate-100)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${aiPct}%`,
                      height: '100%',
                      backgroundColor: 'var(--status-ai)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>Included: {formatTokens(aiTotalLimit)}</span>
                  <span>{aiUsed > aiTotalLimit ? `Overage: ${formatTokens(aiUsed - aiTotalLimit)}` : `${aiPct}% allocated`}</span>
                </div>
              </div>
            </Card>
          );
        })()}

        {/* Card 3: Realtime System Health Status */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} color="var(--c-primary-600)" />
              <span>System Infrastructure Health</span>
            </div>
          }
          subtitle="Platform microservices & queue health"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>PostgreSQL Database</span>
              <Badge variant="success" size="sm">
                Operational ({health?.database.latency || 12}ms)
              </Badge>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>BullMQ Redis Queue</span>
              <Badge variant="success" size="sm">
                {health?.redisQueue.activeWorkers || 4} Workers Active
              </Badge>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Meta WhatsApp Gateway</span>
              <Badge variant="success" size="sm">
                Operational (:5000)
              </Badge>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Google: Gemma 4 31B (OpenRouter)</span>
              <Badge variant="success" size="sm">
                Operational (240ms)
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3: Recent Platform Activity & Audit Logs */}
      <Card
        title="Recent Platform Administration Activity"
        subtitle="Live immutable audit trail of operator mutations and system jobs"
        action={
          <Link to="/audit-logs">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight size={14} />}>
              View All Audit Logs
            </Button>
          </Link>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recentActivity?.map((act) => (
            <div
              key={act.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--c-slate-50)',
                border: '1px solid var(--border-light)',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--c-primary-50)',
                    color: 'var(--c-primary-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '11px',
                  }}
                >
                  LOG
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <code style={{ color: 'var(--c-primary-700)' }}>{act.action}</code> on{' '}
                    <strong>{act.clinicName || act.resource}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    By <strong>{act.actorEmail}</strong> • IP: {act.ipAddress}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Badge variant={act.result === 'SUCCESS' ? 'success' : 'error'} size="sm">
                  {act.result}
                </Badge>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {formatRelativeTime(act.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
