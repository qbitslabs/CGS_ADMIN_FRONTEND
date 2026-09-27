/* Platform-admin screen for audit.
 * Reads live CGS admin APIs so operators can manage clinics and usage. */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { auditApi } from '../../api/audit.api';
import { AuditLog } from '../../types';
import { DataTable, Column } from '../../components/tables/DataTable';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useDebounce } from '../../hooks';
import { formatDateTime } from '../../utils/formatters';

export const AuditLogsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit', { debouncedSearch, actionFilter, page, pageSize }],
    queryFn: () =>
      auditApi.getLogs({
        search: debouncedSearch,
        action: actionFilter,
        page,
        pageSize,
      }),
  });

  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (row) => (
        <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
          {formatDateTime(row.timestamp)}
        </span>
      ),
    },
    {
      key: 'actorEmail',
      header: 'Actor & Type',
      render: (row) => (
        <div>
          <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{row.actorEmail}</strong>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.actorType}</div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Administrative Action',
      render: (row) => (
        <code style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--c-primary-700)', fontFamily: 'var(--font-mono)' }}>
          {row.action}
        </code>
      ),
    },
    {
      key: 'resource',
      header: 'Target Resource',
      render: (row) => (
        <div style={{ fontSize: '13px' }}>
          <span>{row.resource}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '11.5px', marginLeft: '6px' }}>
            ({row.resourceId})
          </span>
        </div>
      ),
    },
    {
      key: 'clinicName',
      header: 'Clinic Scope',
      render: (row) => (
        <span style={{ fontSize: '13px', fontWeight: 500 }}>{row.clinicName || 'Global'}</span>
      ),
    },
    {
      key: 'result',
      header: 'Result',
      render: (row) => (
        <Badge variant={row.result === 'SUCCESS' ? 'success' : 'error'}>{row.result}</Badge>
      ),
    },
    {
      key: 'ipAddress',
      header: 'Origin IP',
      render: (row) => (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {row.ipAddress}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Metadata',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLog(row);
          }}
        >
          Inspect
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Platform Audit Logs
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Immutable record of platform operations, privilege changes, and tenant mutations.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-toolbar-inputs">
          <div style={{ minWidth: '260px', flex: 1 }}>
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by actor email, action, resource, or clinic..."
              leftIcon={<Search size={16} />}
            />
          </div>

          <div style={{ width: '200px' }}>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="select-field"
              style={{ width: '100%' }}
            >
              <option value="ALL">All Actions</option>
              <option value="SETTINGS_UPDATE">SETTINGS_UPDATE</option>
              <option value="CLINIC_SUSPEND">CLINIC_SUSPEND</option>
              <option value="CLINIC_ACTIVE">CLINIC_ACTIVE</option>
              <option value="JOB_RETRY">JOB_RETRY</option>
              <option value="SECRET_ROTATION_TRIGGER">SECRET_ROTATION</option>
            </select>
          </div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        total={data?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onRowClick={(row) => setSelectedLog(row)}
        emptyTitle="No audit records found"
      />

      {/* Audit Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Record: ${selectedLog.action}`}
          subtitle={`Logged at ${formatDateTime(selectedLog.timestamp)}`}
          maxWidth="600px"
          footer={
            <Button variant="secondary" onClick={() => setSelectedLog(null)}>
              Close
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div style={{ padding: '10px 12px', backgroundColor: 'var(--c-slate-50)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Actor Identity</span>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedLog.actorEmail}</div>
              </div>
              <div style={{ padding: '10px 12px', backgroundColor: 'var(--c-slate-50)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Origin IP & Agent</span>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedLog.ipAddress}</div>
              </div>
            </div>

            {selectedLog.metadata && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Sanitized Audit Payload Diff / Parameters:
                </label>
                <pre
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#38bdf8',
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    overflowX: 'auto',
                  }}
                >
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
