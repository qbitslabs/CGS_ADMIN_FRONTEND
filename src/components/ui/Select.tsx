/* Reusable platform-admin UI piece: Select.
 * Shared control used across operator screens. */
import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, children, style, className = '', ...props }, ref) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
        {label && (
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {label}
            {props.required && <span style={{ color: 'var(--status-error)', marginLeft: '3px' }}>*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`select-field ${className}`}
          style={{
            width: '100%',
            borderColor: error ? 'var(--status-error)' : undefined,
            ...style,
          }}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && (
          <span style={{ fontSize: '12px', color: 'var(--status-error)', marginTop: '2px' }}>
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

Select.displayName = 'Select';
