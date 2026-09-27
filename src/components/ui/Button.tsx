/* Reusable platform-admin UI piece: Button.
 * Shared control used across operator screens. */
import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  className = '',
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--c-primary-600)',
          color: '#ffffff',
          border: '1px solid var(--c-primary-700)',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--c-slate-100)',
          color: 'var(--c-slate-800)',
          border: '1px solid var(--border-light)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--status-error)',
          color: '#ffffff',
          border: '1px solid var(--status-error)',
        };
      case 'success':
        return {
          backgroundColor: 'var(--status-success)',
          color: '#ffffff',
          border: '1px solid var(--status-success)',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--c-slate-700)',
          border: '1px solid var(--border-medium)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--c-slate-700)',
          border: '1px solid transparent',
        };
      default:
        return {};
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return {
          padding: '6px 12px',
          fontSize: '12.5px',
          borderRadius: 'var(--radius-sm)',
          gap: '6px',
        };
      case 'lg':
        return {
          padding: '12px 24px',
          fontSize: '15px',
          borderRadius: 'var(--radius-lg)',
          gap: '10px',
        };
      case 'md':
      default:
        return {
          padding: '9px 16px',
          fontSize: '13.5px',
          borderRadius: 'var(--radius-md)',
          gap: '8px',
        };
    }
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.6 : 1,
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        boxShadow: variant === 'ghost' || variant === 'outline' ? 'none' : 'var(--shadow-xs)',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      className={className}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={size === 'sm' ? 14 : 16} className="pulse-indicator" style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
