/* Platform-admin screen for whatsapp.
 * Reads live CGS admin APIs so operators can manage clinics and usage. */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Phone } from 'lucide-react';
import { whatsappApi } from '../../api/whatsapp.api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatDateTime } from '../../utils/formatters';

export const WhatsAppMonitorPage: React.FC = () => {
  const { data: items = [] } = useQuery({
    queryKey: ['admin', 'whatsapp'],
    queryFn: () => whatsappApi.getHealth(),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Meta WhatsApp Cloud API Infrastructure
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Platform WABA connection states, webhook latencies, quality ratings, and message throughput.
        </p>
      </div>

      {/* Security Banner */}
      <div
        style={{
          padding: '14px 18px',
          backgroundColor: 'var(--c-primary-50)',
          border: '1px solid var(--c-primary-100)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px',
          color: 'var(--c-primary-900)',
        }}
      >
        <span style={{ flexShrink: 0, display: 'flex' }}>
          <ShieldCheck size={20} color="var(--c-primary-700)" />
        </span>
        <div>
          <strong>Strict Security Masking:</strong> Sensitive Meta WhatsApp access tokens and webhook secrets are encrypted at the backend boundary and are never transmitted to or rendered in the Admin Frontend (Rule #16 & #47).
        </div>
      </div>

      {/* WhatsApp Health Table */}
      <Card title="Active Meta WABA Accounts" subtitle="Real-time Webhook health & Quality status">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Clinic Tenant</th>
                <th>Phone Number</th>
                <th>WABA Account ID</th>
                <th>Connection State</th>
                <th>Webhook Status</th>
                <th>Latency</th>
                <th>Quality Rating</th>
                <th>Messages Today</th>
                <th>Last Health Check</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong style={{ color: 'var(--text-primary)' }}>{item.clinicName}</strong>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <Phone size={13} color="var(--text-muted)" />
                      <span>{item.phoneNumber}</span>
                    </div>
                  </td>
                  <td>
                    <code style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {item.wabaId}
                    </code>
                  </td>
                  <td>
                    <Badge variant={item.connectionState === 'CONNECTED' ? 'success' : 'error'}>
                      {item.connectionState}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={item.webhookState === 'HEALTHY' ? 'success' : 'warning'}>
                      {item.webhookState}
                    </Badge>
                  </td>
                  <td style={{ fontSize: '13px', fontWeight: 600 }}>{item.latencyMs}ms</td>
                  <td>
                    <Badge variant={item.qualityRating === 'GREEN' ? 'success' : item.qualityRating === 'YELLOW' ? 'warning' : 'error'}>
                      {item.qualityRating}
                    </Badge>
                  </td>
                  <td style={{ fontSize: '12.5px' }}>
                    <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>↑{item.dailyMessagesSent}</span> /{' '}
                    <span style={{ color: 'var(--c-primary-600)', fontWeight: 600 }}>↓{item.dailyMessagesReceived}</span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {formatDateTime(item.lastVerifiedAt)}
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
