/* Reusable platform-admin UI piece: StatCard.
 * Shared control used across operator screens. */
import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: string;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  badge?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  icon,
  iconBg = 'var(--c-primary-50)',
  iconColor = 'var(--c-primary-600)',
  badge,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        boxShadow: 'var(--shadow-xs)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </span>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', letterSpacing: '-0.02em' }}>
            {value}
          </div>
        </div>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
        {change ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
              color: change.isPositive ? 'var(--status-success)' : 'var(--status-error)',
            }}
          >
            {change.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{change.value}</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>vs last month</span>
          </div>
        ) : subtitle ? (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{subtitle}</span>
        ) : (
          <div />
        )}
        {badge && <div>{badge}</div>}
      </div>
    </div>
  );
};
