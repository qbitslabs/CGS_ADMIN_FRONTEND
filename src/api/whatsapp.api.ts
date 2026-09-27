/* Admin frontend client for whatsapp endpoints.
 * Talks to CGS admin routes with the operator bearer token. */
import { cgs_api } from './client';
import { WhatsAppMonitorItem } from '../types';

export const w_api = {
  getHealth: async (): Promise<WhatsAppMonitorItem[]> => {
    const res = await cgs_api.get('/whatsapp');
    const raw = res.data?.data || res.data || [];
    return Array.isArray(raw) ? raw : [];
  },
};

export const whatsappApi = w_api;
