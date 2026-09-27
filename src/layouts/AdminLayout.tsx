/* Admin chrome layout: AdminLayout.
 * Shell around platform-admin routes (nav, auth, or content frame). */
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  LifeBuoy,
  CreditCard,
  BarChart3,
  MessageSquare,
  Sparkles,
  Cpu,
  ScrollText,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminRole, AdminPermission } from '../types';
import { hasPermission } from '../utils/permissions';
import { Badge } from '../components/ui/Badge';

interface NavItemConfig {
  label: string;
  path: string;
  icon: React.ReactNode;
  requiredPermission?: AdminPermission;
  badge?: string;
}

export const AdminLayout: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Scroll to top on route change
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // Close mobile nav on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  const navItems: NavItemConfig[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard size={18} />,
    },
    {
      label: 'Clinics',
      path: '/clinics',
      icon: <Building2 size={18} />,
      requiredPermission: 'clinics.read',
    },
    {
      label: 'Doctors',
      path: '/doctors',
      icon: <Users size={18} />,
      requiredPermission: 'users.read',
    },
    {
      label: 'Platform Users',
      path: '/users',
      icon: <Users size={18} />,
      requiredPermission: 'users.read',
    },
    {
      label: 'Support Console',
      path: '/support',
      icon: <LifeBuoy size={18} />,
      requiredPermission: 'support.read',
    },
    {
      label: 'Billing & Plans',
      path: '/billing',
      icon: <CreditCard size={18} />,
      requiredPermission: 'billing.read',
    },
    {
      label: 'Platform Usage',
      path: '/usage',
      icon: <BarChart3 size={18} />,
      requiredPermission: 'usage.read',
    },
    {
      label: 'WhatsApp WABA',
      path: '/whatsapp',
      icon: <MessageSquare size={18} />,
      requiredPermission: 'whatsapp.read',
    },
    {
      label: 'AI Infrastructure',
      path: '/ai',
      icon: <Sparkles size={18} />,
      requiredPermission: 'ai.read',
    },
    {
      label: 'Background Jobs',
      path: '/jobs',
      icon: <Cpu size={18} />,
      requiredPermission: 'jobs.read',
    },
    {
      label: 'Audit Logs',
      path: '/audit-logs',
      icon: <ScrollText size={18} />,
      requiredPermission: 'audit.read',
    },
    {
      label: 'Platform Settings',
      path: '/settings',
      icon: <Settings size={18} />,
      requiredPermission: 'settings.read',
    },
  ];

  // Filter navigation items by permission
  const accessibleNavItems = navItems.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(user?.permissions, item.requiredPermission);
  });

  const getRoleBadgeVariant = (role?: AdminRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'purple';
      case 'PLATFORM_ADMIN':
        return 'info';
      case 'BILLING_ADMIN':
        return 'success';
      case 'SUPPORT_ADMIN':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const getBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 0 || parts[0] === 'dashboard') return 'Platform Overview';
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' '))
      .join(' / ');
  };

  return (
    <div style={{ height: '100dvh', width: '100vw', display: 'flex', overflow: 'hidden', backgroundColor: 'var(--bg-app)' }}>
      {/* Pinned Desktop Sidebar */}
      <aside
        className="desktop-sidebar-container"
        style={{
          width: 'var(--sidebar-width)',
          height: '100%',
          backgroundColor: 'var(--bg-sidebar)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          borderRight: '1px solid #1e293b',
          zIndex: 40,
        }}
      >
        {/* Sidebar Brand Header */}
        <div
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 20px',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              CGS CONTROL
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--c-primary-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Platform Ops
            </div>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav
          className="dark-scroll"
          style={{
            flex: 1,
            padding: '16px 12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ padding: '0 10px 8px', fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Operations & Control
          </div>

          {accessibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : '#94a3b8',
                backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '10px', backgroundColor: '#334155', color: '#cbd5e1' }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer / Current Admin User */}
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid #1e293b',
            backgroundColor: 'var(--bg-sidebar-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt="Admin Avatar"
            style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #334155' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--c-primary-400)', fontWeight: 600, textTransform: 'uppercase' }}>
              {user?.role.replace('_', ' ')}
            </div>
          </div>
          <button
            onClick={() => logout().then(() => navigate('/login'))}
            style={{ color: '#94a3b8', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, overflow: 'hidden' }}>
        {/* Sticky Top Header */}
        <header
          style={{
            height: 'var(--header-height)',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            flexShrink: 0,
            zIndex: 30,
          }}
        >
          {/* Left: Mobile Nav Button + Breadcrumbs + Env Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              className="mobile-nav-trigger"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              style={{
                display: 'none',
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--c-slate-100)',
                color: 'var(--text-primary)',
              }}
              aria-label="Toggle navigation"
            >
              {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {getBreadcrumbs()}
              </span>
              {/* Environment Indicator (Rule #74) */}
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                STAGING (LOCAL)
              </span>
            </div>
          </div>

          {/* Right: Quick Persona Switcher & Profile Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Quick Role Persona Switcher for pair-programming & verification */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--c-slate-50)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
              }}
            >
              <Zap size={13} color="var(--c-primary-600)" />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Persona:</span>
              <select
                value={user?.role || 'SUPER_ADMIN'}
                onChange={(e) => switchRole(e.target.value as AdminRole)}
                className="select-field"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  backgroundColor: 'transparent',
                  padding: '2px 20px 2px 4px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                <option value="SUPER_ADMIN">👑 Super Admin</option>
                <option value="PLATFORM_ADMIN">🛠️ Platform Admin</option>
                <option value="SUPPORT_ADMIN">🎧 Support Admin</option>
                <option value="BILLING_ADMIN">💳 Billing Admin</option>
              </select>
            </div>

            {/* Role Badge */}
            <Badge variant={getRoleBadgeVariant(user?.role) as any} size="sm">
              {user?.role}
            </Badge>

            {/* Profile Dropdown Toggle */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                <img
                  src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt="Admin"
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <ChevronDown size={14} color="var(--text-muted)" />
              </button>

              {isUserMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '6px',
                    width: '210px',
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    boxShadow: 'var(--shadow-dropdown)',
                    padding: '6px 0',
                    zIndex: 50,
                  }}
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {user?.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {user?.email}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: 'var(--status-error)',
                      textAlign: 'left',
                    }}
                  >
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Independently Scrollable Main Content Body */}
        <main
          ref={mainContentRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            backgroundColor: 'var(--bg-app)',
          }}
        >
          <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Drawer Navigation (Tablet & Mobile) */}
      {isMobileNavOpen && (
        <div
          className="drawer-overlay"
          onClick={() => setIsMobileNavOpen(false)}
          style={{ zIndex: 100 }}
        >
          <div
            style={{
              width: '280px',
              height: '100%',
              backgroundColor: 'var(--bg-sidebar)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                height: 'var(--header-height)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                borderBottom: '1px solid #1e293b',
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                CGS Control
              </span>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                style={{ color: '#ffffff', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
              {accessibleNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#ffffff' : '#94a3b8',
                    backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                    marginBottom: '4px',
                  })}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};
