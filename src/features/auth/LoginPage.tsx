/* Platform-admin screen for auth.
 * Reads live CGS admin APIs so operators can manage clinics and usage. */
import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@clinicgrowth.com');
  const [password, setPassword] = useState('Admin123!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated, isRestoring } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  if (isRestoring) {
    return (
      <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0' }}>
        Checking admin session...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your admin email.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
      success('Admin Authenticated', `Welcome to the CGS Control Plane`);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Invalid admin credentials or unauthorized account.';
      setError(msg);
      toastError('Authentication Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setIsLoading(true);
    setError('');
    try {
      await login(quickEmail, quickPass);
      success('Session Established', `Logged in as ${quickEmail}`);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid #1e293b',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        padding: '36px 32px',
        color: '#ffffff',
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
            marginBottom: '16px',
          }}
        >
          <ShieldCheck size={28} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
          CGS Admin Control Plane
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
          Platform Management, Multi-Tenant Governance & Operations
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
          }}
        >
          <span style={{ flexShrink: 0, display: 'flex' }}>
            <AlertCircle size={16} />
          </span>
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
            Platform Admin Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@clinicgrowth.com"
            leftIcon={<Mail size={16} />}
            required
            style={{
              backgroundColor: '#1e293b',
              borderColor: '#334155',
              color: '#ffffff',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
            Password / Passkey
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            leftIcon={<Lock size={16} />}
            required
            style={{
              backgroundColor: '#1e293b',
              borderColor: '#334155',
              color: '#ffffff',
            }}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          rightIcon={<ArrowRight size={16} />}
          style={{
            marginTop: '8px',
            backgroundColor: '#2563eb',
            borderColor: '#1d4ed8',
            fontWeight: 700,
          }}
        >
          Sign In to Control Plane
        </Button>
      </form>

      {/* Quick Role Tester Bar */}
      <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
          <Zap size={13} color="#38bdf8" />
          <span>Quick Admin Personas (Demo/Evaluation):</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@clinicgrowth.com', 'Admin123!')}
            style={{
              padding: '8px 10px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 'var(--radius-md)',
              color: '#ffffff',
              fontSize: '11.5px',
              fontWeight: 600,
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <span style={{ color: '#c084fc' }}>👑 Super Admin</span>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Full platform access</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('platform@clinicgrowth.com', 'Platform123!')}
            style={{
              padding: '8px 10px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 'var(--radius-md)',
              color: '#ffffff',
              fontSize: '11.5px',
              fontWeight: 600,
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <span style={{ color: '#38bdf8' }}>🛠️ Platform Ops</span>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Clinics & infrastructure</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('support@clinicgrowth.com', 'Support123!')}
            style={{
              padding: '8px 10px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 'var(--radius-md)',
              color: '#ffffff',
              fontSize: '11.5px',
              fontWeight: 600,
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <span style={{ color: '#fde047' }}>🎧 Support Admin</span>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Triage & diagnostics</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('billing@clinicgrowth.com', 'Billing123!')}
            style={{
              padding: '8px 10px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 'var(--radius-md)',
              color: '#ffffff',
              fontSize: '11.5px',
              fontWeight: 600,
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <span style={{ color: '#4ade80' }}>💳 Billing Admin</span>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Revenue & subscriptions</span>
          </button>
        </div>
      </div>
    </div>
  );
};
