/* Platform-admin screen for clinics.
 * Reads live CGS admin APIs so operators can manage clinics and usage. */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Ban,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { clinicsApi } from '../../api/clinics.api';
import { Clinic, ClinicStatus } from '../../types';
import { DataTable, Column } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { OnboardClinicModal } from './OnboardClinicModal';
import { useDebounce, useToast, usePermissions } from '../../hooks';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const ClinicListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Confirmation Modals State
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [actionType, setActionType] = useState<'SUSPEND' | 'REACTIVATE' | null>(null);
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { can } = usePermissions();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'clinics', { debouncedSearch, statusFilter, tierFilter, page, pageSize, sortBy, sortOrder }],
    queryFn: () =>
      clinicsApi.getClinics({
        search: debouncedSearch,
        status: statusFilter,
        tier: tierFilter,
        page,
        pageSize,
        sortBy,
        sortOrder,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: ClinicStatus; reason: string }) =>
      clinicsApi.updateClinicStatus(id, status, reason),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'clinics'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      success(
        `Clinic ${updated.status === 'SUSPENDED' ? 'Suspended' : 'Reactivated'}`,
        `${updated.name} status updated to ${updated.status}.`
      );
      setSelectedClinic(null);
      setActionType(null);
    },
    onError: (err: any) => {
      toastError('Action Failed', err.message || 'Could not update clinic status.');
    },
  });

  const handleStatusChangeConfirm = async (reason?: string) => {
    if (!selectedClinic || !actionType) return;
    const newStatus: ClinicStatus = actionType === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE';
    await statusMutation.mutateAsync({
      id: selectedClinic.id,
      status: newStatus,
      reason: reason || `Admin action: ${actionType}`,
    });
  };

  const getStatusBadge = (status: ClinicStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'TRIAL':
        return <Badge variant="info">Trial</Badge>;
      case 'SUSPENDED':
        return <Badge variant="error">Suspended</Badge>;
      case 'INACTIVE':
        return <Badge variant="neutral">Inactive</Badge>;
    }
  };

  const getTierBadge = (tier: Clinic['tier']) => {
    switch (tier) {
      case 'ENTERPRISE':
        return <Badge variant="purple">₹25k Enterprise</Badge>;
      case 'GROWTH':
        return <Badge variant="info">Growth</Badge>;
      case 'STARTER':
        return <Badge variant="neutral">Starter</Badge>;
      default:
        return <Badge variant="neutral">{tier}</Badge>;
    }
  };

  const columns: Column<Clinic>[] = [
    {
      key: 'name',
      header: 'Clinic & Doctor',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>{row.name}</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {row.doctorName} • {row.city}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: 'tier',
      header: 'Subscription Tier',
      render: (row) => getTierBadge(row.tier),
    },
    {
      key: 'mrr',
      header: 'Monthly MRR',
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {formatCurrency(row.mrr)}
        </span>
      ),
    },
    {
      key: 'stats',
      header: 'Patients / Leads',
      render: (row) => (
        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
          <strong>{row.patientsCount}</strong> patients • <strong>{row.leadsCount}</strong> leads
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Onboarded',
      render: (row) => (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {formatDate(row.createdAt)}
        </span>
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
            leftIcon={<Eye size={13} />}
            onClick={() => navigate(`/clinics/${row.id}`)}
          >
            Inspect
          </Button>

          {can('clinics.suspend') && row.status === 'ACTIVE' && (
            <Button
              variant="outline"
              size="sm"
              style={{ color: 'var(--status-error)', borderColor: 'var(--status-error-border)' }}
              leftIcon={<Ban size={13} />}
              onClick={() => {
                setSelectedClinic(row);
                setActionType('SUSPEND');
              }}
            >
              Suspend
            </Button>
          )}

          {can('clinics.suspend') && row.status === 'SUSPENDED' && (
            <Button
              variant="outline"
              size="sm"
              style={{ color: 'var(--status-success)', borderColor: 'var(--status-success-border)' }}
              leftIcon={<CheckCircle2 size={13} />}
              onClick={() => {
                setSelectedClinic(row);
                setActionType('REACTIVATE');
              }}
            >
              Reactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with Title and Onboard Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Clinics Management
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Search, inspect tenants, configure AI receptionists, and manage platform clinic access.
          </p>
        </div>

        {can('clinics.write') && (
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsOnboardOpen(true)}
          >
            Onboard New Clinic
          </Button>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-toolbar-inputs">
          <div style={{ minWidth: '260px', flex: 1 }}>
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by clinic name, doctor, city, or email..."
              leftIcon={<Search size={16} />}
            />
          </div>

          <div style={{ width: '160px' }}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="select-field"
              style={{ width: '100%' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="TRIAL">Trial</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setPage(1);
              }}
              className="select-field"
              style={{ width: '100%' }}
            >
              <option value="ALL">All Subscription Tiers</option>
              <option value="ENTERPRISE">Enterprise (₹25,000)</option>
              <option value="GROWTH">Growth (₹16,999)</option>
              <option value="STARTER">Starter (₹9,999)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clinics Table */}
      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        total={data?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(key) => {
          if (sortBy === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          } else {
            setSortBy(key);
            setSortOrder('asc');
          }
        }}
        onRowClick={(row) => navigate(`/clinics/${row.id}`)}
        emptyTitle="No clinics found"
        emptyDescription="Try adjusting your search query or status filter."
      />

      {/* Confirmation Modal for Suspending / Reactivating */}
      {selectedClinic && actionType && (
        <ConfirmationModal
          isOpen={!!selectedClinic}
          onClose={() => {
            setSelectedClinic(null);
            setActionType(null);
          }}
          onConfirm={handleStatusChangeConfirm}
          title={actionType === 'SUSPEND' ? 'Suspend Clinic Access' : 'Reactivate Clinic Access'}
          description={
            actionType === 'SUSPEND'
              ? `Are you sure you want to suspend access for "${selectedClinic.name}"? Active WhatsApp automation and clinic staff logins will be halted immediately.`
              : `Reactivate platform access for "${selectedClinic.name}"? Staff will regain dashboard access and WhatsApp message dispatch will resume.`
          }
          resourceName={`${selectedClinic.name} (${selectedClinic.slug})`}
          actionType={actionType === 'SUSPEND' ? 'danger' : 'primary'}
          confirmLabel={actionType === 'SUSPEND' ? 'Suspend Clinic' : 'Reactivate Clinic'}
          requireReason={actionType === 'SUSPEND'}
          isIrreversible={false}
        />
      )}

      {/* Onboard New Clinic Modal */}
      <OnboardClinicModal
        isOpen={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin', 'clinics'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
        }}
      />
    </div>
  );
};
