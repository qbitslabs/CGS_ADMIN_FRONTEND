/* Admin route wiring: AppRoutes.
 * Maps URLs to platform-admin pages and auth gates. */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';

import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ClinicListPage } from '../features/clinics/ClinicListPage';
import { ClinicDetailPage } from '../features/clinics/ClinicDetailPage';
import { UserDirectoryPage } from '../features/users/UserDirectoryPage';
import { DoctorsPage } from '../features/doctors/DoctorsPage';
import { SupportConsolePage } from '../features/support/SupportConsolePage';
import { BillingOverviewPage } from '../features/billing/BillingOverviewPage';
import { UsageOverviewPage } from '../features/usage/UsageOverviewPage';
import { WhatsAppMonitorPage } from '../features/whatsapp/WhatsAppMonitorPage';
import { AiManagerPage } from '../features/ai/AiManagerPage';
import { JobMonitoringPage } from '../features/jobs/JobMonitoringPage';
import { AuditLogsPage } from '../features/audit/AuditLogsPage';
import { PlatformSettingsPage } from '../features/settings/PlatformSettingsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth Public Route */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected Admin Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Clinics */}
        <Route
          path="/clinics"
          element={
            <ProtectedRoute requiredPermission="clinics.read">
              <ClinicListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clinics/:clinicId"
          element={
            <ProtectedRoute requiredPermission="clinics.read">
              <ClinicDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Doctors */}
        <Route
          path="/doctors"
          element={
            <ProtectedRoute requiredPermission="users.read">
              <DoctorsPage />
            </ProtectedRoute>
          }
        />

        {/* Users */}
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredPermission="users.read">
              <UserDirectoryPage />
            </ProtectedRoute>
          }
        />

        {/* Support */}
        <Route
          path="/support"
          element={
            <ProtectedRoute requiredPermission="support.read">
              <SupportConsolePage />
            </ProtectedRoute>
          }
        />

        {/* Billing */}
        <Route
          path="/billing"
          element={
            <ProtectedRoute requiredPermission="billing.read">
              <BillingOverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/*"
          element={
            <ProtectedRoute requiredPermission="billing.read">
              <BillingOverviewPage />
            </ProtectedRoute>
          }
        />

        {/* Usage */}
        <Route
          path="/usage"
          element={
            <ProtectedRoute requiredPermission="usage.read">
              <UsageOverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usage/*"
          element={
            <ProtectedRoute requiredPermission="usage.read">
              <UsageOverviewPage />
            </ProtectedRoute>
          }
        />

        {/* WhatsApp Monitor */}
        <Route
          path="/whatsapp"
          element={
            <ProtectedRoute requiredPermission="whatsapp.read">
              <WhatsAppMonitorPage />
            </ProtectedRoute>
          }
        />

        {/* AI Infrastructure */}
        <Route
          path="/ai"
          element={
            <ProtectedRoute requiredPermission="ai.read">
              <AiManagerPage />
            </ProtectedRoute>
          }
        />

        {/* Background Jobs */}
        <Route
          path="/jobs"
          element={
            <ProtectedRoute requiredPermission="jobs.read">
              <JobMonitoringPage />
            </ProtectedRoute>
          }
        />

        {/* Audit Logs */}
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute requiredPermission="audit.read">
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />

        {/* Platform Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute requiredPermission="settings.read">
              <PlatformSettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
