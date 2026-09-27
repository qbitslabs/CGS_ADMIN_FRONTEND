/* Reusable platform-admin UI piece: Badge.
 * Shared control used across operator screens. */
import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'ai'
  | 'neutral'
  | 'purple';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  icon,
  size = 'md',
  style,
  className = '',
}) => {
  return (
    <span
      className={`badge badge-${variant} ${className}`}
      style={{
        padding: size === 'sm' ? '2px 6px' : '4px 9px',
        fontSize: size === 'sm' ? '11px' : '12px',
        ...style,
      }}
    >
      {icon}
      {children}
    </span>
  );
};
