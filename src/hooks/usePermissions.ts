/* React hook for the admin console: usePermissions.
 * Shared state or debounce/permission helper for operator pages. */
import { useAuth } from '../context/AuthContext';
import { AdminPermission } from '../types';

export function usePermissions() {
  const { user, hasPermission, hasAnyPermission } = useAuth();

  return {
    userRole: user?.role,
    permissions: user?.permissions || [],
    can: (permission: AdminPermission) => hasPermission(permission),
    canAny: (permissions: AdminPermission[]) => hasAnyPermission(permissions),
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isPlatformAdmin: user?.role === 'PLATFORM_ADMIN',
    isSupportAdmin: user?.role === 'SUPPORT_ADMIN',
    isBillingAdmin: user?.role === 'BILLING_ADMIN',
  };
}
