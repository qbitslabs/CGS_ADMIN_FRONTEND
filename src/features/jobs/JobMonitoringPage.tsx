/* Platform-admin screen for jobs.
 * Reads live CGS admin APIs so operators can manage clinics and usage. */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { jobsApi } from '../../api/jobs.api';
import { BackgroundJob, JobStatus } from '../../types';
import { DataTable, Column } from '../../components/tables/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { Modal } from '../../components/ui/Modal';
import { useToast, usePermissions } from '../../hooks';
import { formatDateTime } from '../../utils/formatters';

export const JobMonitoringPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [queueFilter, setQueueFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedJobToRetry, setSelectedJobToRetry] = useState<BackgroundJob | null>(null);
  const [selectedJobToInspect, setSelectedJobToInspect] = useState<BackgroundJob | null>(null);

  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const { can } = usePermissions();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'jobs', { statusFilter, queueFilter, page, pageSize }],
    queryFn: () =>
      jobsApi.getJobs({
        status: statusFilter,
        queue: queueFilter,
        page,
        pageSize,
      }),
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => jobsApi.retryJob(id),
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      success('Job Requeued', `Re-added job ${job.id} to queue ${job.queue}.`);
      setSelectedJobToRetry(null);
    },
    onError: (err: any) => {
      toastError('Requeue Failed', err.message || 'Could not retry background job.');
    },
  });

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'PROCESSING':
        return <Badge variant="info">Processing</Badge>;
      case 'FAILED':
        return <Badge variant="error">Failed</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'STALE':
        return <Badge variant="neutral">Stale</Badge>;
    }
  };

  const columns: Column<BackgroundJob>[] = [
    {
      key: 'jobType',
      header: 'Job Identifier & Type',
      render: (row) => (
        <div>
          <strong style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {row.jobType}
          </strong>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {row.id}</div>
        </div>
      ),
    },
    {
      key: 'queue',
      header: 'Target Queue',
      render: (row) => <Badge variant="neutral">{row.queue}</Badge>,
    },
    {
      key: 'clinicName',
      header: 'Clinic Scope',
      render: (row) => (
        <span style={{ fontSize: '13px', fontWeight: 500 }}>{row.clinicName || 'Platform Global'}</span>
      ),
    },
    {
      key: 'status',
      header: 'State',
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: 'attempts',
      header: 'Attempts',
      render: (row) => (
        <span style={{ fontSize: '13px', fontWeight: 600 }}>
          {row.attempts} / {row.maxAttempts}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Timestamps',
      render: (row) => (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Created: {formatDateTime(row.createdAt)}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedJobToInspect(row)}
          >
            Trace
          </Button>

          {can('jobs.retry') && (row.status === 'FAILED' || row.status === 'STALE') && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<RotateCcw size={13} />}
              onClick={() => setSelectedJobToRetry(row)}
            >
              Requeue
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Background Job Queues & Worker Health
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Operational control over asynchronous BullMQ task queues, failure diagnostics, and safe retries.
        </p>
      </div>

      {/* Filters */}
      <div className="filter-toolbar">
        <div className="filter-toolbar-inputs">
          <div style={{ width: '180px' }}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="select-field"
              style={{ width: '100%' }}
            >
              <option value="ALL">All Job States</option>
              <option value="FAILED">Failed</option>
              <option value="PROCESSING">Processing</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <select
              value={queueFilter}
              onChange={(e) => {
                setQueueFilter(e.target.value);
                setPage(1);
              }}
              className="select-field"
              style={{ width: '100%' }}
            >
              <option value="ALL">All Queues</option>
              <option value="WHATSAPP">WHATSAPP Queue</option>
              <option value="AI">AI Queue</option>
              <option value="BILLING">BILLING Queue</option>
              <option value="NOTIFICATIONS">NOTIFICATIONS</option>
              <option value="DEFAULT">DEFAULT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        total={data?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onRowClick={(row) => setSelectedJobToInspect(row)}
        emptyTitle="No background jobs found"
      />

      {/* Job Trace Inspection Modal */}
      {selectedJobToInspect && (
        <Modal
          isOpen={!!selectedJobToInspect}
          onClose={() => setSelectedJobToInspect(null)}
          title={`Job Trace: ${selectedJobToInspect.jobType}`}
          subtitle={`ID: ${selectedJobToInspect.id} • Queue: ${selectedJobToInspect.queue}`}
          maxWidth="680px"
          footer={
            <Button variant="secondary" onClick={() => setSelectedJobToInspect(null)}>
              Close Trace
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {getStatusBadge(selectedJobToInspect.status)}
              <Badge variant="neutral">Attempts: {selectedJobToInspect.attempts}/{selectedJobToInspect.maxAttempts}</Badge>
            </div>

            {selectedJobToInspect.failureReason && (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--status-error-bg)',
                  border: '1px solid var(--status-error-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--status-error)',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {selectedJobToInspect.failureReason}
              </div>
            )}

            {selectedJobToInspect.stackTrace && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Sanitized Error Stack Trace:
                </label>
                <pre
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#f87171',
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    overflowX: 'auto',
                    lineHeight: 1.5,
                  }}
                >
                  {selectedJobToInspect.stackTrace}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Confirmation Modal for Requeuing Job */}
      {selectedJobToRetry && (
        <ConfirmationModal
          isOpen={!!selectedJobToRetry}
          onClose={() => setSelectedJobToRetry(null)}
          onConfirm={() => retryMutation.mutate(selectedJobToRetry.id)}
          title="Requeue Background Worker Job"
          description={`Are you sure you want to requeue job "${selectedJobToRetry.jobType}" for processing in queue "${selectedJobToRetry.queue}"?`}
          resourceName={`Job: ${selectedJobToRetry.id}`}
          actionType="primary"
          confirmLabel="Requeue Job Now"
        />
      )}
    </div>
  );
};
