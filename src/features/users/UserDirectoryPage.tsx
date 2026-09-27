/* Platform-admin screen for users.
 * Reads live CGS admin APIs so operators can manage clinics and usage. */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, UserCheck, Shield, Mail, Phone, Calendar, X } from 'lucide-react';
import { usersApi } from '../../api/users.api';
import { PlatformUser, PlatformUserRole } from '../../types';
import { DataTable, Column } from '../../components/tables/DataTable';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useDebounce } from '../../hooks';
import { formatDateTime, formatDate } from '../../utils/formatters';

export const UserDirectoryPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { debouncedSearch, roleFilter, statusFilter, page, pageSize }],
    queryFn: () =>
      usersApi.getUsers({
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
        page,
        pageSize,
      }),
  });

  const getRoleBadge = (role: PlatformUserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge variant="purple">👑 Super Admin</Badge>;
      case 'PLATFORM_ADMIN':
        return <Badge variant="info">🛠️ Platform Admin</Badge>;
      case 'SUPPORT_ADMIN':
        return <Badge variant="warning">🎧 Support Admin</Badge>;
      case 'BILLING_ADMIN':
        return <Badge variant="success">💳 Billing Admin</Badge>;
      case 'DOCTOR':
        return <Badge variant="purple">🩺 Doctor</Badge>;
      case 'EMPLOYEE':
        return <Badge variant="neutral">Staff / Employee</Badge>;
    }
  };

  const columns: Column<PlatformUser>[] = [
    {
      key: 'name',
      header: 'User Identity',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>{row.name}</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.email}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Platform / Clinic Role',
      render: (row) => getRoleBadge(row.role),
    },
    {
      key: 'clinicName',
      header: 'Assigned Clinic Tenant',
      render: (row) =>
        row.clinicName ? (
          <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
            {row.clinicName}
          </span>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Platform Level (No Clinic)
          </span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'ACTIVE' ? 'success' : row.status === 'SUSPENDED' ? 'error' : 'neutral'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'lastActiveAt',
      header: 'Last Active Session',
      render: (row) => (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {formatDateTime(row.lastActiveAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Details',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedUser(row);
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
          Platform Users Directory
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Inspect access levels, roles, and session states across all tenant practices and administrators.
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
              placeholder="Search user name, email, or clinic..."
              leftIcon={<Search size={16} />}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="select-field"
              style={{ width: '100%' }}
            >
              <option value="ALL">All Roles</option>
              <option value="DOCTOR">Doctor</option>
              <option value="EMPLOYEE">Staff / Employee</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="PLATFORM_ADMIN">Platform Admin</option>
              <option value="SUPPORT_ADMIN">Support Admin</option>
              <option value="BILLING_ADMIN">Billing Admin</option>
            </select>
          </div>

          <div style={{ width: '150px' }}>
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
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
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
        onRowClick={(row) => setSelectedUser(row)}
        emptyTitle="No platform users found"
        emptyDescription="Try broadening your search query or role filter."
      />

      {/* User Details Drawer */}
      {selectedUser && (
        <div className="drawer-overlay" onClick={() => setSelectedUser(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                padding: '20px',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={20} color="var(--c-primary-600)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  User Account Inspector
                </h3>
              </div>
              <button onClick={() => setSelectedUser(null)} style={{ color: 'var(--text-muted)', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--c-slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedUser.name}</h4>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {getRoleBadge(selectedUser.role)}
                  <Badge variant={selectedUser.status === 'ACTIVE' ? 'success' : 'error'}>{selectedUser.status}</Badge>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mail size={16} color="var(--text-muted)" />
                  <span>{selectedUser.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Phone size={16} color="var(--text-muted)" />
                  <span>{selectedUser.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={16} color="var(--text-muted)" />
                  <span>Created: {formatDate(selectedUser.createdAt)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <UserCheck size={16} color="var(--text-muted)" />
                  <span>Last Active: {formatDateTime(selectedUser.lastActiveAt)}</span>
                </div>
              </div>

              {selectedUser.clinicName && (
                <div style={{ padding: '14px', backgroundColor: 'var(--c-primary-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--c-primary-100)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--c-primary-700)', fontWeight: 600 }}>Assigned Clinic:</span>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedUser.clinicName}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
