/* Platform-admin screen for settings.
 * Reads live CGS admin APIs so operators can manage clinics and usage. */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RotateCw,
  Save,
  DollarSign,
  Sliders,
  Key,
} from 'lucide-react';
import { settingsApi } from '../../api/settings.api';
import { PlatformSettings } from '../../types';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { useToast, usePermissions } from '../../hooks';
import { formatDateTime } from '../../utils/formatters';

export const PlatformSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const { can } = usePermissions();

  const [selectedSecretToRotate, setSelectedSecretToRotate] = useState<string | null>(null);

  const { data: settings } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => settingsApi.getSettings(),
  });

  const [waRate, setWaRate] = useState<number>(0.40);
  const [aiRate, setAiRate] = useState<number>(0.15);
  const [concurrency, setConcurrency] = useState<number>(25);

  React.useEffect(() => {
    if (settings) {
      setWaRate(settings.whatsappRatePerConversation);
      setAiRate(settings.aiRatePer1kTokens);
      setConcurrency(settings.bullMqConcurrency);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<PlatformSettings>) => settingsApi.updateSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      success('Settings Saved', 'Platform rates and worker configuration updated.');
    },
    onError: (err: any) => {
      toastError('Update Failed', err.message || 'Could not save settings.');
    },
  });

  const rotateSecretMutation = useMutation({
    mutationFn: (key: string) => settingsApi.rotateSecret(key),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
      success('Secret Rotated', `Generated key fingerprint: ${res.newFingerprint}`);
      setSelectedSecretToRotate(null);
    },
    onError: (err: any) => {
      toastError('Rotation Failed', err.message || 'Could not rotate secret.');
    },
  });

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      whatsappRatePerConversation: Number(waRate),
      aiRatePer1kTokens: Number(aiRate),
      bullMqConcurrency: Number(concurrency),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Platform Settings & Governance
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Configure default usage rate cards, queue concurrency, and trigger secure platform credential rotation.
        </p>
      </div>

      <div className="grid-cards-2">
        {/* Rate Cards Form */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color="var(--c-primary-600)" />
              <span>Platform Usage Rate Cards</span>
            </div>
          }
          subtitle="Default overage unit prices applied to billing invoices"
        >
          <form onSubmit={handleSaveRates} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input
              label="WhatsApp Conversation Overage Rate (INR)"
              type="number"
              step="0.01"
              value={waRate}
              onChange={(e) => setWaRate(Number(e.target.value))}
              hint="Standard Meta Cloud API pricing benchmark: ₹0.40 / conversation"
              required
            />

            <Input
              label="AI LLM Token Unit Rate (INR per 1,000 tokens)"
              type="number"
              step="0.01"
              value={aiRate}
              onChange={(e) => setAiRate(Number(e.target.value))}
              hint="Google: Gemma 4 31B blended rate on OpenRouter"
              required
            />

            <Input
              label="BullMQ Worker Task Concurrency"
              type="number"
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
              hint="Concurrent jobs handled across background worker containers"
              required
            />

            {can('settings.write') && (
              <Button
                type="submit"
                variant="primary"
                isLoading={updateMutation.isPending}
                leftIcon={<Save size={15} />}
                style={{ alignSelf: 'flex-start', marginTop: '6px' }}
              >
                Save Rate Configuration
              </Button>
            )}
          </form>
        </Card>

        {/* Feature Flags */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="var(--status-ai)" />
              <span>Platform Feature Toggles</span>
            </div>
          }
          subtitle="Global capability switches across dental clinic tenants"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <strong style={{ fontSize: '13.5px' }}>Multi-Location Clinic Chains</strong>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Allow clinics to link multiple branches to one login</p>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <strong style={{ fontSize: '13.5px' }}>Automated Dunning Suspension</strong>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Auto-suspend tenants past 15 days unpaid dues</p>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
              <div>
                <strong style={{ fontSize: '13.5px' }}>AI Realtime Voice Receptionist</strong>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Twilio / SIP autonomous voice booking</p>
              </div>
              <Badge variant="neutral">Beta (Disabled)</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Secret Rotation Panel (Rule #47: Never render plain secrets) */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} color="var(--status-warning)" />
            <span>Platform Credentials & Secret Rotation</span>
          </div>
        }
        subtitle="Zero-plain-text security model: Safe rotation workflow for production credentials"
      >
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Secret Identifier</th>
                <th>Stored Fingerprint (Masked)</th>
                <th>Last Rotated</th>
                <th style={{ textAlign: 'right' }}>Rotation Trigger</th>
              </tr>
            </thead>
            <tbody>
              {settings?.secretsMetadata &&
                Object.entries(settings.secretsMetadata).map(([key, meta]: [string, any]) => (
                  <tr key={key}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{key}</strong>
                    </td>
                    <td>
                      <code style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {meta.keyFingerprint}
                      </code>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {formatDateTime(meta.lastRotated)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {can('settings.write') && (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<RotateCw size={13} />}
                          onClick={() => setSelectedSecretToRotate(key)}
                        >
                          Rotate Secret
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirmation Dialog for Secret Rotation */}
      {selectedSecretToRotate && (
        <ConfirmationModal
          isOpen={!!selectedSecretToRotate}
          onClose={() => setSelectedSecretToRotate(null)}
          onConfirm={() => rotateSecretMutation.mutate(selectedSecretToRotate)}
          title="Rotate Platform Secret Credential"
          description={`Rotating "${selectedSecretToRotate}" will trigger immediate zero-downtime key rotation on AWS KMS / Vault. The old key will remain valid for a 15-minute transition window.`}
          resourceName={`Secret: ${selectedSecretToRotate}`}
          actionType="warning"
          confirmLabel="Authorize Key Rotation"
        />
      )}
    </div>
  );
};
