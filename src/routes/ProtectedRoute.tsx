/* Admin route wiring: ProtectedRoute.
 * Maps URLs to platform-admin pages and auth gates. */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminPermission } from '../types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: AdminPermission;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
}) => {
  const { isAuthenticated, hasPermission, user, isRestoring } = useAuth();
  const location = useLocation();

  if (isRestoring) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Restoring admin session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          padding: '40px 24px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--status-error-bg)',
            color: 'var(--status-error)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <ShieldAlert size={32} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          403 — Unauthorized Resource
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '460px', lineHeight: 1.5, marginBottom: '24px' }}>
          You do not have permission (<code style={{ color: 'var(--status-error)' }}>{requiredPermission}</code>) to access this administrative control plane resource with your current role (<strong>{user?.role}</strong>).
        </p>
        <Button
          variant="secondary"
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => window.history.back()}
        >
          Go Back to Permitted Views
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};
