/* Admin React context: AuthContext.
 * Holds operator session or toast state for the platform console. */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminPermission, AdminRole, AdminUser } from '../types';
import { authApi } from '../api/auth.api';
import { ROLE_PERMISSIONS, hasPermission as checkHasPermission, hasAnyPermission as checkHasAnyPermission } from '../utils/permissions';

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRestoring: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: AdminRole) => void;
  hasPermission: (permission: AdminPermission) => boolean;
  hasAnyPermission: (permissions: AdminPermission[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'cgs_admin_token';
const USER_KEY = 'cgs_admin_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(true);

  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (!savedToken) {
        setUser(null);
        setToken(null);
        setIsRestoring(false);
        return;
      }

      try {
        const current = await authApi.getCurrentUser();
        setUser(current);
        setToken(savedToken);
        localStorage.setItem(USER_KEY, JSON.stringify(current));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setToken(null);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    };

    window.addEventListener('cgs:admin:session_expired', handleSessionExpired);
    return () => window.removeEventListener('cgs:admin:session_expired', handleSessionExpired);
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
      setUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (role: AdminRole) => {
    if (!user) return;
    const updated: AdminUser = {
      ...user,
      role,
      permissions: ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.SUPER_ADMIN,
    };
    setUser(updated);
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  };

  const hasPermission = (permission: AdminPermission): boolean => {
    if (!user) return false;
    return checkHasPermission(user.permissions, permission);
  };

  const hasAnyPermission = (permissions: AdminPermission[]): boolean => {
    if (!user) return false;
    return checkHasAnyPermission(user.permissions, permissions);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        isRestoring,
        login,
        logout,
        switchRole,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
