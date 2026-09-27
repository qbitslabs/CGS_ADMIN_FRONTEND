/* Admin frontend client for settings endpoints.
 * Talks to CGS admin routes with the operator bearer token. */
import { cgs_api } from './client';
import { PlatformSettings } from '../types';

export const settingsApi = {
  getSettings: async (): Promise<PlatformSettings> => {
    const res = await cgs_api.get('/settings');
    return res.data?.data || res.data;
  },

  updateSettings: async (updates: Partial<PlatformSettings>): Promise<PlatformSettings> => {
    const res = await cgs_api.patch('/settings', updates);
    return res.data?.data || res.data;
  },

  rotateSecret: async (secretKey: string): Promise<{ success: boolean; newFingerprint: string }> => {
    const res = await cgs_api.post('/settings/rotate-secret', { secretKey });
    return res.data?.data || res.data;
  },
};
