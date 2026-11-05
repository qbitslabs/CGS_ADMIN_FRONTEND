/* Admin frontend client for dashboard endpoints.
 * Talks to CGS admin routes with the operator bearer token. */
import { cgs_api } from './client';
import { AuditLog } from '../types';

export interface DashboardSummaryData {
  kpi: {
    totalClinics: number;
    activeClinics: number;
    newClinicsThisMonth: number;
    mrr: number;
    activeSubscriptions: number;
    failedPaymentCount: number;
    totalPatients: number;
    totalLeads: number;
    totalAppointments: number;
    whatsappConversations: number;
    whatsappCost: number;
    aiTokens: number;
    aiCost: number;
    overviewLoaded: boolean;
  };
  health: {
    database: { status: string; latency: number };
    redisQueue: { status: string; activeWorkers: number; pendingJobs: number };
    whatsappCloudApi: { status: string; successRate: string; latency?: number };
    openaiApi: { status: string; latency: number; model?: string; provider?: string };
  };
  recentActivity: AuditLog[];
}

function parseLatencyMs(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = parseInt(value.replace(/[^\d]/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummaryData> => {
    const [overviewRes, auditRes, diagRes, jobsRes, aiUsageRes] = await Promise.allSettled([
      cgs_api.get('/overview'),
      cgs_api.get('/audit-logs?limit=5'),
      cgs_api.get('/support/diagnostics'),
      cgs_api.get('/jobs', { params: { status: 'PENDING', limit: 1 } }),
      cgs_api.get('/ai/usage/summary?days=30'),
    ]);

    const overviewLoaded = overviewRes.status === 'fulfilled';
    const raw = overviewLoaded ? (overviewRes.value.data?.data || overviewRes.value.data || {}) : {};
    const platform = raw.platform || {};
    const usageRaw = aiUsageRes.status === 'fulfilled' ? (aiUsageRes.value.data?.data || aiUsageRes.value.data || {}) : {};

    const rawAudit = auditRes.status === 'fulfilled' ? (auditRes.value.data?.data || auditRes.value.data || []) : [];
    const auditLogs: AuditLog[] = Array.isArray(rawAudit)
      ? rawAudit
      : (rawAudit.data || []);

    const diag = diagRes.status === 'fulfilled' ? (diagRes.value.data?.data || diagRes.value.data || {}) : {};
    const system = diag.system || {};

    const jobsPayload = jobsRes.status === 'fulfilled' ? (jobsRes.value.data?.data || jobsRes.value.data || {}) : {};
    const pendingJobs =
      typeof jobsPayload.meta?.total === 'number'
        ? jobsPayload.meta.total
        : Array.isArray(jobsPayload)
          ? jobsPayload.length
          : Array.isArray(jobsPayload.data)
            ? jobsPayload.data.length
            : 0;

    const dbLatency = parseLatencyMs(system.database?.latency);
    const aiLatency = parseLatencyMs(system.aiService?.latency);
    const waLatency = parseLatencyMs(system.whatsappService?.latency);
    const waStatus = String(system.whatsappService?.status || 'UNKNOWN').toUpperCase();
    const aiStatus = String(system.aiService?.status || 'UNKNOWN').toUpperCase();
    const dbStatus = String(system.database?.status || 'UNKNOWN').toUpperCase();

    const totalClinics = platform.totalClinics || 0;
    const mrr = platform.totalRevenue || 0;

    return {
      kpi: {
        totalClinics,
        activeClinics: totalClinics,
        newClinicsThisMonth: platform.newClinicsThisMonth || 0,
        mrr,
        activeSubscriptions: totalClinics,
        failedPaymentCount: 0,
        totalPatients: platform.totalPatients || 0,
        totalLeads: platform.totalLeads || 0,
        totalAppointments: platform.totalAppointments || 0,
        whatsappConversations: platform.whatsappConversations || platform.totalConversations || 0,
        whatsappCost: platform.whatsappCost || 0,
        aiTokens: usageRaw.totalTokens || usageRaw.total_tokens || 0,
        aiCost: usageRaw.totalCost || usageRaw.estimated_cost || 0,
        overviewLoaded,
      },
      health: {
        database: {
          status: dbStatus === 'HEALTHY' ? 'HEALTHY' : dbStatus || 'UNKNOWN',
          latency: dbLatency,
        },
        redisQueue: {
          status: pendingJobs > 50 ? 'DEGRADED' : 'HEALTHY',
          activeWorkers: 1,
          pendingJobs,
        },
        whatsappCloudApi: {
          status: waStatus === 'HEALTHY' ? 'HEALTHY' : waStatus || 'UNKNOWN',
          successRate: waStatus,
          latency: waLatency,
        },
        openaiApi: {
          status: aiStatus === 'HEALTHY' ? 'HEALTHY' : aiStatus || 'UNKNOWN',
          latency: aiLatency,
          model: system.aiService?.model || '',
          provider: system.aiService?.provider || '',
        },
      },
      recentActivity: auditLogs,
    };
  },
};
