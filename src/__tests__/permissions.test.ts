/* Unit tests for admin permissions.test.
 * Guards formatting, permissions, or clinic-onboarding helpers. */
import { describe, it, expect } from 'vitest';
import { ROLE_PERMISSIONS, hasPermission, hasAnyPermission, hasAllPermissions } from '../utils/permissions';
import { AdminPermission } from '../types';

describe('Role Permission Matrix & Guard Rules', () => {
  it('SUPER_ADMIN must have all platform permissions including settings & billing', () => {
    const perms = ROLE_PERMISSIONS.SUPER_ADMIN;
    expect(hasPermission(perms, 'clinics.read')).toBe(true);
    expect(hasPermission(perms, 'clinics.suspend')).toBe(true);
    expect(hasPermission(perms, 'billing.read')).toBe(true);
    expect(hasPermission(perms, 'settings.write')).toBe(true);
    expect(hasPermission(perms, 'jobs.retry')).toBe(true);
  });

  it('SUPPORT_ADMIN must have support & diagnostics access, but NEVER billing or settings write', () => {
    const perms = ROLE_PERMISSIONS.SUPPORT_ADMIN;
    expect(hasPermission(perms, 'support.read')).toBe(true);
    expect(hasPermission(perms, 'clinics.read')).toBe(true);
    expect(hasPermission(perms, 'jobs.read')).toBe(true);

    // Forbidden for Support Admin
    expect(hasPermission(perms, 'billing.read')).toBe(false);
    expect(hasPermission(perms, 'billing.manage_plans')).toBe(false);
    expect(hasPermission(perms, 'settings.read')).toBe(false);
    expect(hasPermission(perms, 'settings.write')).toBe(false);
    expect(hasPermission(perms, 'clinics.suspend')).toBe(false);
  });

  it('BILLING_ADMIN must have billing and subscription management, but not system settings or jobs', () => {
    const perms = ROLE_PERMISSIONS.BILLING_ADMIN;
    expect(hasPermission(perms, 'billing.read')).toBe(true);
    expect(hasPermission(perms, 'billing.manage_subscriptions')).toBe(true);
    expect(hasPermission(perms, 'billing.manage_plans')).toBe(true);

    // Forbidden for Billing Admin
    expect(hasPermission(perms, 'settings.write')).toBe(false);
    expect(hasPermission(perms, 'jobs.retry')).toBe(false);
    expect(hasPermission(perms, 'clinics.suspend')).toBe(false);
  });

  it('hasAnyPermission returns true when at least one permission matches', () => {
    const perms: AdminPermission[] = ['clinics.read', 'support.read'];
    expect(hasAnyPermission(perms, ['billing.read', 'support.read'])).toBe(true);
    expect(hasAnyPermission(perms, ['settings.write', 'billing.manage_plans'])).toBe(false);
  });

  it('hasAllPermissions returns true only when every permission matches', () => {
    const perms: AdminPermission[] = ['clinics.read', 'support.read', 'jobs.read'];
    expect(hasAllPermissions(perms, ['clinics.read', 'support.read'])).toBe(true);
    expect(hasAllPermissions(perms, ['clinics.read', 'settings.write'])).toBe(false);
  });
});
