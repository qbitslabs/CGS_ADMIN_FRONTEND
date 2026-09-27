/* Platform-admin screen for billing.
 * Reads live CGS admin APIs so operators can manage clinics and usage. */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Layers,
  FileText,
  DollarSign,
  AlertTriangle,
  Download,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { billingApi } from '../../api/billing.api';
import {
  SaasInvoice,
  SaasPayment,
  FailedPaymentIncident,
} from '../../types';
import { Tabs } from '../../components/ui/Tabs';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/tables/DataTable';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { downloadSaasReceiptHtml } from './DownloadSaasReceipt';
import { useToast, usePermissions } from '../../hooks';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

export const BillingOverviewPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFailedIncident, setSelectedFailedIncident] = useState<FailedPaymentIncident | null>(null);

  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const { can } = usePermissions();

  const { data: plans = [] } = useQuery({
    queryKey: ['admin', 'billing', 'plans'],
    queryFn: () => billingApi.getPlans(),
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['admin', 'billing', 'subscriptions'],
    queryFn: () => billingApi.getSubscriptions(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['admin', 'billing', 'invoices'],
    queryFn: () => billingApi.getInvoices(),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['admin', 'billing', 'payments'],
    queryFn: () => billingApi.getPayments(),
  });

  const { data: failedPayments = [] } = useQuery({
    queryKey: ['admin', 'billing', 'failed_payments'],
    queryFn: () => billingApi.getFailedPayments(),
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => billingApi.retryFailedPayment(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'billing'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      success('Charge Retry Triggered', `Re-attempted recurring payment for ${res.clinicName}.`);
      setSelectedFailedIncident(null);
    },
    onError: (err: any) => {
      toastError('Retry Failed', err.message || 'Payment gateway declined transaction.');
    },
  });

  const totalMrr = subscriptions
    .filter((s) => s.status === 'ACTIVE')
    .reduce((sum, s) => sum + s.amount, 0);

  const tabs = [
    { id: 'overview', label: 'Revenue Overview', icon: <TrendingUp size={15} /> },
    { id: 'plans', label: 'Subscription Plans', icon: <Layers size={15} />, count: plans.length },
    { id: 'subscriptions', label: 'Active Subscriptions', icon: <CreditCard size={15} />, count: subscriptions.length },
    { id: 'invoices', label: 'CGS SaaS Invoices', icon: <FileText size={15} />, count: invoices.length },
    { id: 'payments', label: 'Payments Ledger', icon: <DollarSign size={15} /> },
    {
      id: 'failed',
      label: 'Failed Payments & Dunning',
      icon: <AlertTriangle size={15} />,
      count: failedPayments.filter((f) => f.status === 'OPEN').length,
    },
  ];

  // Invoices Table Columns
  const invoiceColumns: Column<SaasInvoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (row) => (
        <strong style={{ color: 'var(--c-primary-700)', fontFamily: 'var(--font-mono)' }}>
          {row.invoiceNumber}
        </strong>
      ),
    },
    {
      key: 'clinicName',
      header: 'Clinic Tenant',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.clinicName}</span>,
    },
    {
      key: 'planName',
      header: 'Plan Tier',
      render: (row) => <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{row.planName}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Total Amount (incl GST)',
      render: (row) => <strong>{formatCurrency(row.totalAmount)}</strong>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'PAID' ? 'success' : row.status === 'FAILED' ? 'error' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due / Paid Date',
      render: (row) => (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {row.paidAt ? formatDate(row.paidAt) : formatDate(row.dueDate)}
        </span>
      ),
    },
    {
      key: 'download',
      header: 'Download Bill',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download size={13} />}
          onClick={(e) => {
            e.stopPropagation();
            downloadSaasReceiptHtml(row);
          }}
        >
          Download PDF
        </Button>
      ),
    },
  ];

  // Payments Table Columns
  const paymentColumns: Column<SaasPayment>[] = [
    {
      key: 'transactionId',
      header: 'Transaction Reference',
      render: (row) => (
        <div>
          <strong style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{row.transactionId}</strong>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.gatewayReference}</div>
        </div>
      ),
    },
    {
      key: 'clinicName',
      header: 'Clinic',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.clinicName}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => <strong>{formatCurrency(row.amount)}</strong>,
    },
    {
      key: 'channel',
      header: 'Channel',
      render: (row) => <Badge variant="neutral">{row.channel}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'SUCCESS' ? 'success' : 'error'}>{row.status}</Badge>
      ),
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (row) => (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {formatDateTime(row.timestamp)}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Platform Subscriptions & Billing
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
          CGS multi-tenant subscription tiers, auto-debit invoices, payments ledger, and dunning retry management.
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Overview & MRR KPIs */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="grid-cards-4">
            <StatCard
              title="Platform Recurring MRR"
              value={formatCurrency(totalMrr)}
              subtitle="Monthly recurring CGS plan revenue"
              icon={<TrendingUp size={22} />}
              iconBg="var(--status-success-bg)"
              iconColor="var(--status-success)"
            />

            <StatCard
              title="Active Enterprise Tiers (₹25k)"
              value={subscriptions.filter((s) => s.tier === 'ENTERPRISE').length}
              subtitle="High-growth dental chains"
              icon={<Zap size={22} />}
              iconBg="var(--c-primary-50)"
              iconColor="var(--c-primary-600)"
            />

            <StatCard
              title="Collection Success Rate"
              value={
                payments.length
                  ? `${Math.round(
                      (payments.filter((p) => String(p.status || '').toUpperCase() === 'COMPLETED' || String(p.status || '').toUpperCase() === 'SUCCESS').length /
                        payments.length) *
                        100
                    )}%`
                  : '—'
              }
              subtitle={`${payments.length} gateway payments`}
              icon={<CheckCircle2 size={22} />}
              iconBg="var(--status-info-bg)"
              iconColor="var(--status-info)"
            />

            <StatCard
              title="Open Failed Incidents"
              value={failedPayments.filter((f) => f.status === 'OPEN').length}
              subtitle="Requires dunning retry or follow-up"
              badge={<Badge variant="error">Action Required</Badge>}
              icon={<AlertTriangle size={22} />}
              iconBg="var(--status-error-bg)"
              iconColor="var(--status-error)"
            />
          </div>

          {/* Quick SaaS Invoice Feed */}
          <Card
            title="Recent Platform SaaS Invoices"
            subtitle="Auto-generated monthly tax bills for enrolled dental clinics"
          >
            <DataTable
              columns={invoiceColumns}
              data={invoices.slice(0, 5)}
              total={invoices.length}
              pageSize={5}
            />
          </Card>
        </div>
      )}

      {/* Tab 2: Subscription Plans */}
      {activeTab === 'plans' && (
        <div className="grid-cards-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{plan.name}</span>
                  <Badge variant={plan.tier === 'ENTERPRISE' ? 'purple' : plan.tier === 'GROWTH' ? 'info' : 'neutral'}>
                    {plan.tier}
                  </Badge>
                </div>
              }
              subtitle={`${plan.activeSubscriptionsCount} Active Clinics Subscribed`}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formatCurrency(plan.priceMonthly)}{' '}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>/ month</span>
                </div>

                <div style={{ padding: '12px', backgroundColor: 'var(--c-slate-50)', borderRadius: 'var(--radius-md)', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>WhatsApp Included:</span>
                    <strong>{plan.whatsappConversationsIncluded} free chats</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>AI Tokens Included:</span>
                    <strong>{plan.aiTokensIncluded.toLocaleString()} tokens</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>WhatsApp Overage Rate:</span>
                    <strong>₹{plan.overageRateWhatsApp.toFixed(2)} / chat</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Included Features:
                  </span>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <CheckCircle2 size={14} color="var(--status-success)" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 3: Active Subscriptions */}
      {activeTab === 'subscriptions' && (
        <Card title="Active Clinic Subscriptions" subtitle="Live recurring billing status across dental tenants">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Clinic</th>
                  <th>Plan Tier</th>
                  <th>Monthly Price</th>
                  <th>Status</th>
                  <th>Current Period</th>
                  <th>Payment Method</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{sub.clinicName}</strong>
                    </td>
                    <td>
                      <Badge variant={sub.tier === 'ENTERPRISE' ? 'purple' : 'info'}>{sub.planName}</Badge>
                    </td>
                    <td>
                      <strong>{formatCurrency(sub.amount)}</strong>
                    </td>
                    <td>
                      <Badge variant={sub.status === 'ACTIVE' ? 'success' : 'error'}>{sub.status}</Badge>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      {formatDate(sub.currentPeriodStart)} – {formatDate(sub.currentPeriodEnd)}
                    </td>
                    <td style={{ fontSize: '13px', fontWeight: 500 }}>
                      {sub.paymentMethodBrand} •••• {sub.paymentMethodLast4}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 4: CGS SaaS Invoices */}
      {activeTab === 'invoices' && (
        <Card title="CGS Platform Invoices Ledger" subtitle="Official downloadable SaaS tax bills (strictly platform billing, not patient bills)">
          <DataTable
            columns={invoiceColumns}
            data={invoices}
            total={invoices.length}
            pageSize={10}
          />
        </Card>
      )}

      {/* Tab 5: Payments Ledger */}
      {activeTab === 'payments' && (
        <Card title="SaaS Gateway Payment Transactions" subtitle="Razorpay / Payment Gateway transaction ledger">
          <DataTable
            columns={paymentColumns}
            data={payments}
            total={payments.length}
            pageSize={10}
          />
        </Card>
      )}

      {/* Tab 6: Failed Payments & Dunning Tracker */}
      {activeTab === 'failed' && (
        <Card
          title="Failed Recurring Payment Incidents"
          subtitle="Triage failed auto-debit charges and trigger authorized payment gateway retries"
        >
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Clinic</th>
                  <th>Invoice Ref</th>
                  <th>Amount</th>
                  <th>Failed Attempts</th>
                  <th>Last Failed Attempt</th>
                  <th>Decline Reason</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Retry Action</th>
                </tr>
              </thead>
              <tbody>
                {failedPayments.map((inc) => (
                  <tr key={inc.id}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{inc.clinicName}</strong>
                    </td>
                    <td>
                      <code style={{ color: 'var(--c-primary-700)' }}>{inc.invoiceNumber}</code>
                    </td>
                    <td>
                      <strong>{formatCurrency(inc.amount)}</strong>
                    </td>
                    <td>{inc.failedAttempts} / 3 Attempts</td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      {formatDateTime(inc.lastAttemptAt)}
                    </td>
                    <td>
                      <Badge variant="error">{inc.errorCategory.replace('_', ' ')}</Badge>
                    </td>
                    <td>
                      <Badge variant={inc.status === 'RESOLVED' ? 'success' : 'warning'}>{inc.status}</Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {inc.status === 'OPEN' && can('billing.manage_subscriptions') && (
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<RotateCcw size={13} />}
                          onClick={() => setSelectedFailedIncident(inc)}
                        >
                          Retry Charge
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Confirmation Modal for Retrying Failed Charge */}
      {selectedFailedIncident && (
        <ConfirmationModal
          isOpen={!!selectedFailedIncident}
          onClose={() => setSelectedFailedIncident(null)}
          onConfirm={() => retryMutation.mutate(selectedFailedIncident.id)}
          title="Retry Recurring Payment Charge"
          description={`Attempt immediate off-session credit card auto-debit of ${formatCurrency(selectedFailedIncident.amount)} for "${selectedFailedIncident.clinicName}"?`}
          resourceName={`${selectedFailedIncident.clinicName} (${selectedFailedIncident.invoiceNumber})`}
          actionType="primary"
          confirmLabel="Execute Charge Retry"
        />
      )}
    </div>
  );
};
