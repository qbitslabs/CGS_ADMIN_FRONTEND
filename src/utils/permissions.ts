/* Admin frontend utility: permissions.
 * Formatting or permission helpers used by operator screens. */
import { AdminPermission, AdminRole } from '../types';

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  SUPER_ADMIN: [
    'clinics.read',
    'clinics.write',
    'clinics.suspend',
    'clinics.delete',
    'users.read',
    'users.write',
    'users.impersonate_view',
    'billing.read',
    'billing.manage_plans',
    'billing.manage_subscriptions',
    'billing.refund',
    'usage.read',
    'usage.manage_rates',
    'whatsapp.read',
    'whatsapp.manage',
    'ai.read',
    'ai.manage_models',
    'jobs.read',
    'jobs.retry',
    'jobs.cancel',
    'audit.read',
    'settings.read',
    'settings.write',
    'support.read',
    'support.diagnostics',
  ],
  PLATFORM_ADMIN: [
    'clinics.read',
    'clinics.write',
    'clinics.suspend',
    'users.read',
    'users.write',
    'usage.read',
    'whatsapp.read',
    'whatsapp.manage',
    'ai.read',
    'ai.manage_models',
    'jobs.read',
    'jobs.retry',
    'jobs.cancel',
    'audit.read',
    'support.read',
    'support.diagnostics',
  ],
  SUPPORT_ADMIN: [
    'clinics.read',
    'users.read',
    'jobs.read',
    'jobs.retry',
    'audit.read',
    'support.read',
    'support.diagnostics',
    'whatsapp.read',
    'ai.read',
  ],
  BILLING_ADMIN: [
    'clinics.read',
    'billing.read',
    'billing.manage_plans',
    'billing.manage_subscriptions',
    'billing.refund',
    'usage.read',
    'usage.manage_rates',
    'audit.read',
  ],
};

/**
 * Check if an admin user or role has the specified permission
 */
export function hasPermission(
  userPermissions: AdminPermission[] | undefined | null,
  requiredPermission: AdminPermission
): boolean {
  if (!userPermissions) return false;
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has ANY of the specified permissions
 */
export function hasAnyPermission(
  userPermissions: AdminPermission[] | undefined | null,
  requiredPermissions: AdminPermission[]
): boolean {
  if (!userPermissions || requiredPermissions.length === 0) return false;
  return requiredPermissions.some((p) => userPermissions.includes(p));
}

/**
 * Check if user has ALL of the specified permissions
 */
export function hasAllPermissions(
  userPermissions: AdminPermission[] | undefined | null,
  requiredPermissions: AdminPermission[]
): boolean {
  if (!userPermissions || requiredPermissions.length === 0) return false;
  return requiredPermissions.every((p) => userPermissions.includes(p));
}
