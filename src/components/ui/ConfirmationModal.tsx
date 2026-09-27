/* Reusable platform-admin UI piece: ConfirmationModal.
 * Shared control used across operator screens. */
import React, { useState } from 'react';
import { AlertTriangle, AlertOctagon, ShieldAlert } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<any> | any;
  title: string;
  description: string;
  resourceName?: string;
  actionType?: 'danger' | 'warning' | 'primary';
  confirmLabel?: string;
  cancelLabel?: string;
  requireReason?: boolean;
  requireTypedConfirmation?: string; // e.g. "SUSPEND" or clinic slug
  isIrreversible?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  resourceName,
  actionType = 'danger',
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  requireReason = false,
  requireTypedConfirmation,
  isIrreversible = false,
}) => {
  const [reason, setReason] = useState('');
  const [typedConfirm, setTypedConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) {
      setError('Please provide a mandatory reason for this administrative action.');
      return;
    }

    if (requireTypedConfirmation && typedConfirm !== requireTypedConfirmation) {
      setError(`Please type exactly "${requireTypedConfirmation}" to confirm.`);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await onConfirm(reason);
      setReason('');
      setTypedConfirm('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Action failed to execute. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isConfirmDisabled =
    isLoading ||
    (requireReason && !reason.trim()) ||
    (requireTypedConfirmation ? typedConfirm !== requireTypedConfirmation : false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: actionType === 'danger' ? 'var(--status-error)' : 'var(--text-primary)' }}>
          {actionType === 'danger' ? (
            <AlertOctagon size={20} color="var(--status-error)" />
          ) : actionType === 'warning' ? (
            <AlertTriangle size={20} color="var(--status-warning)" />
          ) : (
            <ShieldAlert size={20} color="var(--c-primary-600)" />
          )}
          <span>{title}</span>
        </div>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={actionType === 'danger' ? 'danger' : actionType === 'warning' ? 'secondary' : 'primary'}
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={isConfirmDisabled}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {description}
        </p>

        {resourceName && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--c-slate-50)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Target Resource:</span>
            <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {resourceName}
            </strong>
          </div>
        )}

        {isIrreversible && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--status-error-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--status-error-border)',
              color: 'var(--status-error)',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={16} />
            <span>This action is high-impact and may disrupt active clinic communications or billing.</span>
          </div>
        )}

        {requireReason && (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Audit Log Reason <span style={{ color: 'var(--status-error)' }}>*</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Non-payment for over 15 days following dunning notice..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>
        )}

        {requireTypedConfirmation && (
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Type <strong style={{ color: 'var(--status-error)' }}>{requireTypedConfirmation}</strong> to proceed:
            </label>
            <Input
              value={typedConfirm}
              onChange={(e) => {
                setTypedConfirm(e.target.value);
                if (error) setError('');
              }}
              placeholder={requireTypedConfirmation}
            />
          </div>
        )}

        {error && (
          <div style={{ fontSize: '12.5px', color: 'var(--status-error)', fontWeight: 500 }}>
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
};
