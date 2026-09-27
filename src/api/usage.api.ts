/* Admin frontend client for usage endpoints.
 * Talks to CGS admin routes with the operator bearer token. */
import { cgs_api } from './client';
import { UsageOverviewData } from '../types';

export const usageApi = {
  getUsageOverview: async (): Promise<UsageOverviewData> => {
    const [summaryRes, clinicsRes, overviewRes, dailyRes] = await Promise.allSettled([
      cgs_api.get('/ai/usage/summary'),
      cgs_api.get('/ai/usage/clinics'),
      cgs_api.get('/overview'),
      cgs_api.get('/ai/usage/daily', { params: { days: 7 } }),
    ]);

    const summary = summaryRes.status === 'fulfilled' ? (summaryRes.value.data?.data || summaryRes.value.data || {}) : {};
    const clinicsRaw = clinicsRes.status === 'fulfilled' ? (clinicsRes.value.data?.data || clinicsRes.value.data || []) : [];
    const overview = overviewRes.status === 'fulfilled' ? (overviewRes.value.data?.data || overviewRes.value.data || {}) : {};
    const dailyRaw = dailyRes.status === 'fulfilled' ? (dailyRes.value.data?.data || dailyRes.value.data || []) : [];

    const platform = overview.platform || {};
    const totalWhatsApp = platform.whatsappConversations || platform.totalConversations || 0;
    const totalWhatsAppCost = platform.whatsappCost || Number(totalWhatsApp * 0.4);
    const totalAiTokens = summary.totalTokens || overview.ai?.total_tokens || 0;
    const totalAiCost = summary.totalCost || overview.ai?.estimated_cost || 0;

    const clinicsList = Array.isArray(clinicsRaw) ? clinicsRaw : [];
    const clinicsUsage = clinicsList.map((c: any) => {
      const waIncluded = c.whatsappIncluded || 1000;
      const waConsumed = c.whatsappConsumed || 0;
      const waOverage = Math.max(0, waConsumed - waIncluded) * 0.4;

      const aiIncluded = c.aiTokensIncluded || 1000000;
      const aiConsumed = c.totalTokens || 0;
      const aiOverage = Math.max(0, (aiConsumed - aiIncluded) / 1000) * 0.15;

      return {
        clinicId: c.clinicId,
        clinicName: c.clinicName,
        whatsappIncluded: waIncluded,
        whatsappConsumed: waConsumed,
        whatsappOverageCost: waOverage,
        aiTokensIncluded: aiIncluded,
        aiTokensConsumed: aiConsumed,
        aiOverageCost: aiOverage,
        totalBillableOverage: waOverage + aiOverage,
        billingPeriod: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      };
    });

    const dailyUsageTrend = Array.isArray(dailyRaw) && dailyRaw.length > 0
      ? dailyRaw.map((d: any) => ({
          date: d.date,
          whatsappCount: d.whatsappCount || 0,
          aiTokens: d.aiTokens || 0,
          estimatedCost: Number(d.estimatedCost || 0),
        }))
      : Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return {
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            whatsappCount: 0,
            aiTokens: 0,
            estimatedCost: 0,
          };
        });

    return {
      totalWhatsAppConversations: totalWhatsApp,
      totalWhatsAppCost,
      totalAiTokens,
      totalAiCost,
      activeClinicsWithOverage: clinicsUsage.filter((c: any) => c.totalBillableOverage > 0).length,
      clinicsUsage,
      dailyUsageTrend,
    };
  },
};
