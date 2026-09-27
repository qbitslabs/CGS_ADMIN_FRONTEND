/* Platform-admin screen for usage.
 * Reads live CGS admin APIs so operators can manage clinics and usage. */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, MessageSquare, Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { usageApi } from '../../api/usage.api';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Tabs } from '../../components/ui/Tabs';
import { formatCurrency, formatCompactNumber, formatTokens } from '../../utils/formatters';

export const UsageOverviewPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');

  const { data } = useQuery({
    queryKey: ['admin', 'usage'],
    queryFn: () => usageApi.getUsageOverview(),
  });

  const tabs = [
    { id: 'all', label: 'All Platform Usage', icon: <BarChart3 size={15} /> },
    { id: 'whatsapp', label: 'WhatsApp Conversations', icon: <MessageSquare size={15} /> },
    { id: 'ai', label: 'AI LLM Tokens', icon: <Sparkles size={15} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Platform Usage & Overage Analytics
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Realtime consumption of WhatsApp Cloud API messages and AI LLM tokens across all tenant clinics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid-cards-4">
        <StatCard
          title="Total WhatsApp Chats"
          value={formatCompactNumber(data?.totalWhatsAppConversations)}
          subtitle="Meta Business Platform Service Chats"
          icon={<MessageSquare size={22} />}
          iconBg="var(--status-success-bg)"
          iconColor="var(--status-success)"
        />

        <StatCard
          title="Total WhatsApp Cost"
          value={formatCurrency(data?.totalWhatsAppCost)}
          subtitle="Aggregated @ ₹0.40 overage rate"
          icon={<DollarSign size={22} />}
          iconBg="var(--c-primary-50)"
          iconColor="var(--c-primary-600)"
        />

        <StatCard
          title="Total AI Tokens Consumed"
          value={formatTokens(data?.totalAiTokens)}
          subtitle="Google: Gemma 4 31B"
          icon={<Sparkles size={22} />}
          iconBg="var(--status-ai-bg)"
          iconColor="var(--status-ai)"
        />

        <StatCard
          title="Total AI LLM Cost"
          value={formatCurrency(data?.totalAiCost)}
          subtitle="Aggregated @ ₹0.15 / 1k tokens"
          icon={<TrendingUp size={22} />}
          iconBg="var(--status-warning-bg)"
          iconColor="var(--status-warning)"
        />
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 7-Day Usage Trend */}
      <Card
        title="7-Day Platform Consumption Trend"
        subtitle="Daily volume across WhatsApp and AI Receptionist"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
          {data?.dailyUsageTrend.map((day, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--c-slate-50)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                {day.date}
              </span>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {day.whatsappCount} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>WA</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--status-ai)', fontWeight: 600, marginTop: '2px' }}>
                {formatTokens(day.aiTokens)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Est: {formatCurrency(day.estimatedCost)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Clinic Usage & Overage Breakdown Table */}
      <Card
        title={
          activeTab === 'whatsapp'
            ? 'August 2026 WhatsApp Cloud API Usage'
            : activeTab === 'ai'
            ? 'August 2026 AI Receptionist Token Usage'
            : 'August 2026 Clinic Usage & Billable Overage'
        }
        subtitle="Itemized breakdown of included quotas vs billable overage fees per clinic"
      >
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Clinic Tenant</th>
                {(activeTab === 'all' || activeTab === 'whatsapp') && (
                  <>
                    <th>WhatsApp Included</th>
                    <th>WhatsApp Used</th>
                    <th>WhatsApp Overage (₹0.40)</th>
                  </>
                )}
                {(activeTab === 'all' || activeTab === 'ai') && (
                  <>
                    <th>AI Included</th>
                    <th>AI Tokens Used</th>
                    <th>AI Overage (₹0.15/1k)</th>
                  </>
                )}
                <th style={{ textAlign: 'right' }}>Total Billable Overage</th>
              </tr>
            </thead>
            <tbody>
              {data?.clinicsUsage.map((c) => (
                <tr key={c.clinicId}>
                  <td>
                    <strong style={{ color: 'var(--text-primary)' }}>{c.clinicName}</strong>
                  </td>
                  {(activeTab === 'all' || activeTab === 'whatsapp') && (
                    <>
                      <td>{c.whatsappIncluded.toLocaleString()}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: c.whatsappConsumed > c.whatsappIncluded ? 'var(--status-warning)' : 'inherit' }}>
                          {c.whatsappConsumed.toLocaleString()}
                        </span>
                      </td>
                      <td>{formatCurrency(c.whatsappOverageCost)}</td>
                    </>
                  )}
                  {(activeTab === 'all' || activeTab === 'ai') && (
                    <>
                      <td>{formatTokens(c.aiTokensIncluded)}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: c.aiTokensConsumed > c.aiTokensIncluded ? 'var(--status-warning)' : 'inherit' }}>
                          {formatTokens(c.aiTokensConsumed)}
                        </span>
                      </td>
                      <td>{formatCurrency(c.aiOverageCost)}</td>
                    </>
                  )}
                  <td style={{ textAlign: 'right' }}>
                    <strong style={{ color: c.totalBillableOverage > 0 ? 'var(--status-warning)' : 'var(--status-success)' }}>
                      {formatCurrency(c.totalBillableOverage)}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
