/* Reusable platform-admin UI piece: Input.
 * Shared control used across operator screens. */
import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, style, className = '', ...props }, ref) => {
    return (
      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
        {label && (
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
            {label}
            {props.required && <span style={{ color: 'var(--status-error)', marginLeft: '3px' }}>*</span>}
          </label>
        )}
        <div className="input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
          {leftIcon && (
            <div
              className="input-icon-left"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 2,
                width: '18px',
                height: '18px',
              }}
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`form-input ${leftIcon ? 'has-left-icon' : ''} ${rightIcon ? 'has-right-icon' : ''} ${error ? 'has-error' : ''} ${className}`}
            style={{
              boxSizing: 'border-box',
              ...style,
            }}
            {...props}
          />
          {rightIcon && (
            <div
              className="input-icon-right"
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                width: '18px',
                height: '18px',
              }}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <span style={{ fontSize: '12px', color: 'var(--status-error)', marginTop: '2px', fontWeight: 500 }}>
            {error}
          </span>
        )}
        {hint && !error && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
