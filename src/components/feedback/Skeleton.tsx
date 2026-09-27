/* Reusable platform-admin UI piece: Skeleton.
 * Shared control used across operator screens. */
import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '16px',
  borderRadius = 'var(--radius-sm)',
  style,
  className = '',
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--c-slate-200)',
        backgroundImage: 'linear-gradient(90deg, var(--c-slate-200) 0%, var(--c-slate-100) 50%, var(--c-slate-200) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonPulse 1.5s infinite linear',
        ...style,
      }}
      className={className}
    />
  );
};
