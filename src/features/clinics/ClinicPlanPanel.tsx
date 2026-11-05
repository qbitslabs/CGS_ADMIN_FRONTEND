/* Assign a brochure plan and confirm paid add-ons for one clinic. */
import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../../api/billing.api';
import { clinicsApi } from '../../api/clinics.api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../hooks';
import { ClinicDetail } from '../../types';
import { formatCurrency } from '../../utils/formatters';

const STATUSES = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'];
const ADDONS = [
  { type: 'EXTRA_DOCTOR', label: 'Extra doctor · ₹1,000 / month', tiers: ['STARTER', 'GROWTH', 'ENTERPRISE'] },
  { type: 'EXTRA_STAFF', label: 'Extra staff member · ₹500 / month', tiers: ['STARTER', 'GROWTH', 'ENTERPRISE'] },
  { type: 'EXTRA_AI_REPLIES', label: 'Extra 300 AI replies · ₹500 this period', tiers: ['STARTER', 'GROWTH', 'ENTERPRISE'] },
  { type: 'EXTRA_WHATSAPP_NUMBER', label: 'Extra WhatsApp number · ₹1,500 / month', tiers: ['STARTER', 'GROWTH', 'ENTERPRISE'] },
  { type: 'PRIORITY_SUPPORT', label: 'Priority support · ₹2,000 / month', tiers: ['STARTER', 'GROWTH'] },
];
const EXTRA_AUTOMATIONS = [
  { key: 'MISSED_APPOINTMENT', label: 'Missed appointment' },
  { key: 'COMPLETED_VISIT', label: 'Completed-visit follow-up' },
  { key: 'PATIENT_REACTIVATION', label: 'Patient reactivation' },
];
const INCLUDED_AUTOMATIONS: Record<string, string[]> = {
  STARTER: ['New enquiry', 'Invoice', 'Appointment reminder'],
  GROWTH: ['New enquiry', 'Invoice', 'Appointment reminder', 'Missed appointment', 'Completed-visit follow-up'],
  ENTERPRISE: ['New enquiry', 'Invoice', 'Appointment reminder', 'Missed appointment', 'Completed-visit follow-up', 'Patient reactivation'],
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--border-color, #e2e8f0)',
  background: '#fff',
  fontSize: 13,
};

function usageText(label: string, row?: { used: number; allowed: number | null }) {
  if (!row) return `${label}: 0`;
  return row.allowed == null ? `${label} in use: ${row.used}` : `${label} ${row.used} of ${row.allowed}`;
}

export const ClinicPlanPanel: React.FC<{ clinicId: string; clinic: ClinicDetail; canEdit: boolean }> = ({
  clinicId,
  clinic,
  canEdit,
}) => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const usage = clinic.packageUsage;
  const subscription = clinic.subscription;
  const tier = subscription.assigned ? subscription.tier : '';
  const [planId, setPlanId] = useState(subscription.planId || '');
  const [status, setStatus] = useState<string>(subscription.assigned ? subscription.status : 'ACTIVE');
  const [earlyBird, setEarlyBird] = useState(Boolean(subscription.earlyBird));
  const [addonType, setAddonType] = useState('EXTRA_DOCTOR');
  const [quantity, setQuantity] = useState(1);

  const { data: plans = [] } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => billingApi.getPlans(),
  });
  const brochurePlans = plans.filter((plan) => ['STARTER', 'GROWTH', 'ENTERPRISE'].includes(plan.tier));

  useEffect(() => {
    setPlanId(subscription.planId || brochurePlans[0]?.id || '');
    setStatus(subscription.assigned ? subscription.status : 'ACTIVE');
    setEarlyBird(Boolean(subscription.earlyBird));
  }, [subscription.planId, subscription.status, subscription.earlyBird, subscription.assigned, brochurePlans[0]?.id]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'clinic', clinicId] });
  };
  const assign = useMutation({
    mutationFn: () => clinicsApi.assignPlan(clinicId, { planId, status, earlyBird }),
    onSuccess: async () => {
      await refresh();
      success('Plan saved. Package limits are on for this clinic.');
    },
    onError: (err: Error) => toastError(err.message || 'Could not save the plan'),
  });
  const record = useMutation({
    mutationFn: () => {
      const [type, automationKey] = addonType.startsWith('EXTRA_AUTOMATION:')
        ? ['EXTRA_AUTOMATION', addonType.slice('EXTRA_AUTOMATION:'.length)]
        : [addonType, undefined];
      return clinicsApi.recordAddon(clinicId, { type, quantity, automationKey });
    },
    onSuccess: async () => {
      await refresh();
      success('Add-on recorded. Confirm it after payment.');
    },
    onError: (err: Error) => toastError(err.message || 'Could not record the add-on'),
  });
  const confirm = useMutation({
    mutationFn: (addonId: string) => clinicsApi.confirmAddon(clinicId, addonId),
    onSuccess: async () => {
      await refresh();
      success('Add-on is active.');
    },
    onError: (err: Error) => toastError(err.message || 'Could not confirm the add-on'),
  });
  const remove = useMutation({
    mutationFn: (addonId: string) => clinicsApi.removeAddon(clinicId, addonId),
    onSuccess: async () => {
      await refresh();
      success('Add-on removed.');
    },
    onError: (err: Error) => toastError(err.message || 'Could not remove the add-on'),
  });

  const notes = [usage?.doctors.note, usage?.staff.note, usage?.whatsappNumbers.note, usage?.aiReplies.note].filter(Boolean);
  const addonChoices = [
    ...ADDONS.filter((item) => !tier || item.tiers.includes(tier)).map((item) => ({ value: item.type, label: item.label })),
    ...(tier === 'ENTERPRISE'
      ? []
      : EXTRA_AUTOMATIONS.filter((item) => tier !== 'GROWTH' || item.key === 'PATIENT_REACTIVATION').map((item) => ({
          value: `EXTRA_AUTOMATION:${item.key}`,
          label: `${item.label} · ₹500 / month`,
        }))),
  ];
  const includedAutomations = INCLUDED_AUTOMATIONS[tier] || [];

  return (
    <Card title="Package">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, fontSize: 13 }}>
          <div>{usageText('Doctors', usage?.doctors)}</div>
          <div>{usageText('Staff', usage?.staff)}</div>
          <div>{usageText('WhatsApp numbers', usage?.whatsappNumbers)}</div>
          <div>{usageText('AI conversations', usage?.aiReplies)}</div>
        </div>
        {!usage?.enforced && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            Limits start when this clinic is placed on Essential, Growth, or Scale.
          </p>
        )}
        {notes.map((note) => (
          <p key={note} style={{ margin: 0, fontSize: 13, color: 'var(--status-warning, #b45309)' }}>
            {note}
          </p>
        ))}
        {usage?.enforced && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Automations:{' '}
            {usage.automations.filter((item) => item.running).map((item) => item.label).join(', ') || 'None'}
          </div>
        )}

        {canEdit && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Plan
                <select style={fieldStyle} value={planId} onChange={(event) => setPlanId(event.target.value)}>
                  {brochurePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} · {formatCurrency(plan.regularMonthlyPrice)} / month
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Status
                <select style={fieldStyle} value={status} onChange={(event) => setStatus(event.target.value)}>
                  {STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {item.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
              <input type="checkbox" checked={earlyBird} onChange={(event) => setEarlyBird(event.target.checked)} />
              Early Bird monthly price. Limited to five clinics.
            </label>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
              Saving places this clinic on the selected package and turns package limits on. Existing bills stay at the amount already stored.
              Monthly fee {formatCurrency(subscription.packageMonthly || 0)} / month.
            </p>
            <div>
              <Button onClick={() => assign.mutate()} disabled={assign.isPending || !planId}>
                Save plan
              </Button>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color, #e2e8f0)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Add-ons</div>
              {includedAutomations.length > 0 && (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                  WhatsApp automations on this package: {includedAutomations.join(', ')}.
                  {tier === 'STARTER'
                    ? ' Missed appointment, completed-visit follow-up, and patient reactivation can be added at ₹500 / month.'
                    : tier === 'GROWTH'
                      ? ' Patient reactivation can be added at ₹500 / month.'
                      : ' All six WhatsApp automations are included.'}
                </p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                <select style={fieldStyle} value={addonType} onChange={(event) => setAddonType(event.target.value)}>
                  {addonChoices.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <input
                  style={fieldStyle}
                  type="number"
                  min={1}
                  max={20}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value) || 1)}
                />
              </div>
              <div>
                <Button variant="outline" onClick={() => record.mutate()} disabled={record.isPending || !subscription.assigned}>
                  Record add-on
                </Button>
              </div>
              {(clinic.addons || []).length === 0 && (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>No add-ons yet.</p>
              )}
              {(clinic.addons || []).map((addon) => (
                <div key={addon.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                  <Button variant="outline" onClick={() => remove.mutate(addon.id)} disabled={remove.isPending}>
                    Delete
                  </Button>
                  <span style={{ flex: 1 }}>
                    {addon.type.split('_').join(' ')} × {addon.quantity}
                    {addon.automationKey ? ` · ${addon.automationKey.split('_').join(' ')}` : ''} · {formatCurrency(addon.price)} · {addon.status}
                  </span>
                  {addon.status === 'PENDING' && (
                    <Button variant="outline" onClick={() => confirm.mutate(addon.id)} disabled={confirm.isPending}>
                      Confirm payment
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
