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
  Eye,
  Plus,
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
import { Input } from '../../components/ui/Input';
import { DataTable, Column } from '../../components/tables/DataTable';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { Modal } from '../../components/ui/Modal';
import { useToast, usePermissions } from '../../hooks';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { ExportExcelButton } from '../../components/ui/ExportExcelButton';

export const BillingOverviewPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFailedIncident, setSelectedFailedIncident] = useState<FailedPaymentIncident | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<SaasInvoice | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [oneTime, setOneTime] = useState({ clinicId: '', description: '', amount: '', dueDate: '' });

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

  const createInvoiceMutation = useMutation({
    mutationFn: () =>
      billingApi.createOneTimeInvoice({
        clinicId: oneTime.clinicId,
        description: oneTime.description.trim(),
        amount: Number(oneTime.amount),
        dueDate: oneTime.dueDate || undefined,
      }),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'invoices'] });
      success('Invoice created', `${invoice.invoiceNumber} for ${invoice.clinicName}`);
      setCreateOpen(false);
      setOneTime({ clinicId: '', description: '', amount: '', dueDate: '' });
      setActiveTab('invoices');
    },
    onError: (err: Error) => {
      toastError('Invoice not created', err.message);
    },
  });

  const taxable = Number(oneTime.amount);
  const gstAmount = Number.isFinite(taxable) && taxable > 0 ? Math.round(taxable * 0.18 * 100) / 100 : 0;
  const payable = Number.isFinite(taxable) && taxable > 0 ? Math.round((taxable + gstAmount) * 100) / 100 : 0;
  const clinicOptions = subscriptions.filter(
    (sub, index, list) => list.findIndex((item) => item.clinicId === sub.clinicId) === index
  );

  const totalMrr = subscriptions
    .filter((s) => s.status === 'ACTIVE')
    .reduce((sum, s) => sum + s.amount, 0);

  const tabs = [
    { id: 'overview', label: 'Revenue Overview', icon: <TrendingUp size={15} /> },
    { id: 'plans', label: 'Packages', icon: <Layers size={15} />, count: plans.length },
    { id: 'subscriptions', label: 'Active Packages', icon: <CreditCard size={15} />, count: subscriptions.length },
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
      width: '15%',
      render: (row) => (
        <strong style={{ color: 'var(--c-primary-700)', fontFamily: 'var(--font-mono)' }}>
          {row.invoiceNumber}
        </strong>
      ),
    },
    {
      key: 'clinicName',
      header: 'Clinic',
      width: '18%',
      wrap: true,
      render: (row) => <span style={{ fontWeight: 600 }}>{row.clinicName}</span>,
    },
    {
      key: 'planName',
      header: 'Plan',
      width: '18%',
      wrap: true,
      render: (row) => <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{row.planName}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Total',
      width: '12%',
      render: (row) => <strong>{formatCurrency(row.totalAmount)}</strong>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '12%',
      render: (row) => (
        <Badge variant={row.status === 'PAID' ? 'success' : row.status === 'FAILED' || row.status === 'OVERDUE' ? 'error' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due',
      width: '13%',
      render: (row) => (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {row.paidAt ? formatDate(row.paidAt) : formatDate(row.dueDate)}
        </span>
      ),
    },
    {
      key: 'download',
      header: '',
      width: '12%',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2px' }}>
          <Button
            variant="ghost"
            size="sm"
            title="Overview"
            aria-label="Overview"
            style={{ padding: 2, width: 26, height: 26 }}
            onClick={(e) => {
              e.stopPropagation();
              setPreviewInvoice(row);
            }}
          >
            <Eye size={15} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Download PDF"
            aria-label="Download PDF"
            style={{ padding: 2, width: 26, height: 26 }}
            onClick={(e) => {
              e.stopPropagation();
              billingApi.downloadInvoicePdf(row.id, row.invoiceNumber).catch((err) => {
                toastError(err instanceof Error ? err.message : 'Could not download the invoice.');
              });
            }}
          >
            <Download size={15} />
          </Button>
        </div>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Packages & Billing
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Clinic packages, monthly bills, payments ledger, and dunning retry management.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => setCreateOpen(true)}
        >
          Create invoice
        </Button>
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
              title="Active Scale packages"
              value={subscriptions.filter((s) => s.tier === 'ENTERPRISE').length}
              subtitle="₹18,000 / month"
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
              exportName="recent-saas-invoices"
              fit
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
                    {plan.tier === 'STARTER' ? 'Essential' : plan.tier === 'GROWTH' ? 'Growth' : plan.tier === 'ENTERPRISE' ? 'Scale' : 'Custom'}
                  </Badge>
                </div>
              }
              subtitle={`${plan.activeSubscriptionsCount} clinics on this package`}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formatCurrency(plan.regularMonthlyPrice || plan.priceMonthly)}{' '}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>/ month</span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '-8px' }}>
                  Early Bird {formatCurrency(plan.earlyBirdMonthlyPrice || 0)} / month · Setup {formatCurrency(plan.regularSetupFee || 0)}
                </div>

                <div style={{ padding: '12px', backgroundColor: 'var(--c-slate-50)', borderRadius: 'var(--radius-md)', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Doctors</span>
                    <strong>{plan.doctorsIncluded}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Staff</span>
                    <strong>{plan.staffIncluded}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>WhatsApp numbers</span>
                    <strong>{plan.whatsappNumbersIncluded}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>AI replies / month</span>
                    <strong>{Number(plan.aiRepliesMonthly || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Model / memory</span>
                    <strong>{plan.modelLevel === 'HIGH_END' ? 'High-end' : 'Normal'} · {plan.conversationMemory === 'FULL' ? 'Full' : 'None'}</strong>
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
        <Card
          title="Active packages"
          subtitle="Live package status across clinics"
          action={
            <ExportExcelButton
              filename="clinic-subscriptions"
              headers={['Clinic', 'Plan', 'Monthly price', 'Status', 'Period start', 'Period end', 'Payment method']}
              rows={subscriptions.map((sub) => [
                sub.clinicName,
                sub.planName,
                sub.amount,
                sub.status,
                formatDate(sub.currentPeriodStart),
                formatDate(sub.currentPeriodEnd),
                `${sub.paymentMethodBrand} ${sub.paymentMethodLast4}`,
              ])}
            />
          }
        >
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Clinic</th>
                  <th>Package</th>
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
            exportName="saas-invoices"
            fit
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
            exportName="saas-payments"
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
          action={
            <ExportExcelButton
              filename="failed-payments"
              headers={['Clinic', 'Invoice', 'Amount', 'Failed attempts', 'Last attempt', 'Reason', 'Status']}
              rows={failedPayments.map((inc) => [
                inc.clinicName,
                inc.invoiceNumber,
                inc.amount,
                inc.failedAttempts,
                formatDateTime(inc.lastAttemptAt),
                inc.errorCategory,
                inc.status,
              ])}
            />
          }
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

      <Modal
        isOpen={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        title={previewInvoice ? previewInvoice.invoiceNumber : 'Invoice'}
        subtitle={previewInvoice?.clinicName}
        footer={
          previewInvoice ? (
            <Button
              variant="primary"
              leftIcon={<Download size={14} />}
              onClick={() => {
                billingApi.downloadInvoicePdf(previewInvoice.id, previewInvoice.invoiceNumber).catch((err) => {
                  toastError(err instanceof Error ? err.message : 'Could not download the invoice.');
                });
              }}
            >
              Download PDF
            </Button>
          ) : null
        }
      >
        {previewInvoice && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13.5px' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Description</div>
              <strong>{previewInvoice.description || previewInvoice.planName}</strong>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Status</div>
              <strong>{previewInvoice.status}</strong>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Period</div>
              <strong>{formatDate(previewInvoice.billingPeriodStart)} – {formatDate(previewInvoice.billingPeriodEnd)}</strong>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Due</div>
              <strong>{formatDate(previewInvoice.dueDate)}</strong>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Taxable value</div>
              <strong>{formatCurrency(previewInvoice.amount)}</strong>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>GST 18%</div>
              <strong>{formatCurrency(previewInvoice.taxAmount)}</strong>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Total payable</div>
              <strong>{formatCurrency(previewInvoice.totalAmount)}</strong>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create invoice"
        subtitle="One-time payment. GST at 18% is added to the amount you enter."
        footer={
          <Button
            variant="primary"
            isLoading={createInvoiceMutation.isPending}
            onClick={() => createInvoiceMutation.mutate()}
          >
            Create invoice
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', fontWeight: 600 }}>
            Clinic
            <select
              value={oneTime.clinicId}
              onChange={(e) => setOneTime((current) => ({ ...current, clinicId: e.target.value }))}
              style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '14px' }}
            >
              <option value="">Select a clinic</option>
              {clinicOptions.map((sub) => (
                <option key={sub.clinicId} value={sub.clinicId}>{sub.clinicName}</option>
              ))}
            </select>
          </label>
          <Input
            label="What is this payment for?"
            required
            value={oneTime.description}
            onChange={(e) => setOneTime((current) => ({ ...current, description: e.target.value }))}
            placeholder="Setup fee, extra number, on-site visit"
          />
          <Input
            label="Amount before GST"
            required
            type="number"
            min="1"
            value={oneTime.amount}
            onChange={(e) => setOneTime((current) => ({ ...current, amount: e.target.value }))}
            placeholder="10000"
          />
          <Input
            label="Due date"
            type="date"
            value={oneTime.dueDate}
            onChange={(e) => setOneTime((current) => ({ ...current, dueDate: e.target.value }))}
          />
          <div style={{ padding: '12px', background: 'var(--c-slate-50)', borderRadius: '8px', fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Taxable value</span><strong>{formatCurrency(taxable || 0)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>GST 18%</span><strong>{formatCurrency(gstAmount)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total payable</span><strong>{formatCurrency(payable)}</strong></div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
