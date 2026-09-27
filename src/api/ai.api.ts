/* Admin frontend client for ai endpoints.
 * Talks to CGS admin routes with the operator bearer token. */
import { cgs_api } from './client';
import { AiModelStatus } from '../types';

export interface AiHealthData {
  aiService: string;
  aiDetails?: any;
  cgsInternalApi: string;
  database: string;
}

export interface AiUsageSummary {
  period_days: number;
  total_requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost: number;
  today_cost: number;
  month_cost: number;
  avg_cost_per_request: number;
}

export interface AiModelUsage {
  model: string;
  requests: number;
  total_tokens: number;
  cost: number;
  percentage: number;
}

export interface AiEntityUsage {
  entity_id: string;
  name: string;
  type: string;
  requests: number;
  total_tokens: number;
  cost: number;
}

export interface AiDailyUsage {
  date: string;
  requests: number;
  total_tokens: number;
  cost: number;
}

export interface AiConversationSummary {
  id: string;
  entity_id: string;
  entity_name: string;
  entity_type: string;
  participant_id: string;
  channel: string;
  state: string;
  message_count: number;
  last_activity?: string;
}

export interface AiConversationDetail extends AiConversationSummary {
  summary?: string;
  messages: Array<{
    id: string;
    sender_type: string;
    content: string;
    tokens?: number;
    created_at?: string;
    metadata?: any;
  }>;
}

export interface GenericEntity {
  id: string;
  type: 'CLINIC' | 'DOCTOR' | 'RESTAURANT' | 'ECOMMERCE' | 'EDUCATION' | 'REAL_ESTATE';
  name: string;
  system_prompt: string;
  configuration: Record<string, any>;
  status: string;
}

export const aiApi = {
  getHealth: async (): Promise<AiHealthData> => {
    try {
      const res = await cgs_api.get('/overview');
      return {
        aiService: 'ONLINE',
        aiDetails: res.data?.data?.ai,
        cgsInternalApi: 'ONLINE',
        database: 'HEALTHY',
      };
    } catch {
      return {
        aiService: 'OFFLINE',
        cgsInternalApi: 'ONLINE',
        database: 'HEALTHY',
      };
    }
  },

  getUsageSummary: async (days: number = 30): Promise<AiUsageSummary> => {
    const res = await cgs_api.get(`/ai/usage/summary?days=${days}`);
    const data = res.data?.data || res.data || {};
    return {
      period_days: days,
      total_requests: data.totalRequests || data.total_requests || 0,
      prompt_tokens: data.inputTokens || data.prompt_tokens || 0,
      completion_tokens: data.outputTokens || data.completion_tokens || 0,
      total_tokens: data.totalTokens || data.total_tokens || 0,
      estimated_cost: data.totalCost || data.estimated_cost || 0,
      today_cost: data.todayCost || 0,
      month_cost: data.totalCost || 0,
      avg_cost_per_request: data.avgCostPerRequest || 0,
    };
  },

  getModelBreakdown: async (days: number = 30): Promise<AiModelUsage[]> => {
    const res = await cgs_api.get(`/ai/usage/models?days=${days}`);
    const raw = res.data?.data || res.data || [];
    return Array.isArray(raw) ? raw.map((m: any) => ({
      model: m.model,
      requests: m.requests || 0,
      total_tokens: m.totalTokens || m.total_tokens || 0,
      cost: m.totalCost || m.cost || 0,
      percentage: m.percentage || 0,
    })) : [];
  },

  getEntityBreakdown: async (days: number = 30): Promise<AiEntityUsage[]> => {
    const res = await cgs_api.get(`/ai/usage/entities?days=${days}`);
    const raw = res.data?.data || res.data || [];
    return Array.isArray(raw) ? raw.map((e: any) => ({
      entity_id: e.entityId || e.entity_id || 'unknown',
      name: e.name || e.entityId || 'Entity',
      type: e.entityType || e.type || 'CLINIC',
      requests: e.requests || 0,
      total_tokens: e.totalTokens || e.total_tokens || 0,
      cost: e.totalCost || e.cost || 0,
    })) : [];
  },

  getDailyUsage: async (days: number = 14): Promise<AiDailyUsage[]> => {
    const res = await cgs_api.get(`/ai/usage/daily`, { params: { days } });
    const raw = res.data?.data || res.data || [];
    if (!Array.isArray(raw)) return [];
    return raw.map((d: any) => ({
      date: d.date,
      requests: d.requests || 0,
      total_tokens: d.aiTokens || d.total_tokens || 0,
      cost: Number(d.estimatedCost || d.cost || 0),
    }));
  },

  getConversations: async (limit: number = 50): Promise<AiConversationSummary[]> => {
    const res = await cgs_api.get('/ai/conversations', { params: { limit } });
    const raw = res.data?.data || res.data || [];
    return Array.isArray(raw) ? raw : [];
  },

  getConversationById: async (id: string): Promise<AiConversationDetail> => {
    const res = await cgs_api.get(`/ai/conversations/${id}`);
    return res.data?.data || res.data;
  },

  getEntities: async (): Promise<GenericEntity[]> => {
    try {
      const res = await cgs_api.get('/ai/entities');
      const raw = res.data?.data || res.data || [];
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  },

  createEntity: async (data: Partial<GenericEntity>): Promise<GenericEntity> => {
    let configObj: Record<string, any> = {};
    if (typeof data.configuration === 'string') {
      try {
        configObj = JSON.parse(data.configuration);
      } catch {
        configObj = {};
      }
    } else if (data.configuration && typeof data.configuration === 'object') {
      configObj = data.configuration;
    }

    const res = await cgs_api.post('/ai/entities', {
      ...data,
      configuration: configObj,
    });
    return res.data?.data || res.data;
  },

  runTestGenerate: async (payload: {
    entity_id: string;
    entity_type: string;
    participant_id: string;
    message: string;
    channel?: string;
  }): Promise<any> => {
    const res = await cgs_api.post('/ai/generate', payload);
    return res.data.data;
  },

  getModels: async (): Promise<AiModelStatus[]> => {
    const [modelsRes, healthRes] = await Promise.allSettled([
      cgs_api.get('/ai/usage/models?days=7'),
      cgs_api.get('/support/diagnostics'),
    ]);
    const modelsRaw = modelsRes.status === 'fulfilled' ? (modelsRes.value.data?.data || modelsRes.value.data || []) : [];
    const diag = healthRes.status === 'fulfilled' ? (healthRes.value.data?.data || healthRes.value.data || {}) : {};
    const aiLatency = parseInt(String(diag.system?.aiService?.latency || '0').replace(/[^\d]/g, ''), 10) || 0;
    const aiOk = String(diag.system?.aiService?.status || '').toUpperCase() === 'HEALTHY';

    if (Array.isArray(modelsRaw) && modelsRaw.length > 0) {
      return modelsRaw.map((m: any) => ({
        provider: (m.provider || 'GOOGLE').toUpperCase(),
        modelName: m.model || 'Google: Gemma 4 31B',
        status: aiOk ? 'OPERATIONAL' : 'DEGRADED',
        latencyMs: Math.round(m.avgDurationMs || aiLatency || 0),
        tokenCostPer1k: m.totalTokens ? Number(m.totalCost || 0) / (m.totalTokens / 1000) : 0.00008,
        promptVersion: 'v2.4',
        errorRatePercent: aiOk ? 0.1 : 5,
        totalRequestsToday: m.requests || 0,
      }));
    }

    return [
      {
        provider: 'GOOGLE',
        modelName: 'Google: Gemma 4 31B',
        status: aiOk ? 'OPERATIONAL' : 'DEGRADED',
        latencyMs: aiLatency,
        tokenCostPer1k: 0.00008,
        promptVersion: 'v2.4',
        errorRatePercent: aiOk ? 0.1 : 5,
        totalRequestsToday: 0,
      },
    ];
  },
};
