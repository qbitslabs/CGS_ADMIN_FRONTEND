/* Shared TypeScript models for the platform-admin UI.
 * Mirrors CGS admin API payloads. */
export type AdminRole = 
  | 'SUPER_ADMIN' 
  | 'PLATFORM_ADMIN' 
  | 'SUPPORT_ADMIN' 
  | 'BILLING_ADMIN';

export type AdminPermission =
  | 'clinics.read'
  | 'clinics.write'
  | 'clinics.suspend'
  | 'clinics.delete'
  | 'users.read'
  | 'users.write'
  | 'users.impersonate_view'
  | 'billing.read'
  | 'billing.manage_plans'
  | 'billing.manage_subscriptions'
  | 'billing.refund'
  | 'usage.read'
  | 'usage.manage_rates'
  | 'whatsapp.read'
  | 'whatsapp.manage'
  | 'ai.read'
  | 'ai.manage_models'
  | 'jobs.read'
  | 'jobs.retry'
  | 'jobs.cancel'
  | 'audit.read'
  | 'settings.read'
  | 'settings.write'
  | 'support.read'
  | 'support.diagnostics';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: AdminPermission[];
  avatarUrl?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLoginAt: string;
  createdAt: string;
}

export type ClinicStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'INACTIVE';
export type SubscriptionTier = 'STARTER' | 'GROWTH' | 'ENTERPRISE' | 'CUSTOM';

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  landingPageId?: string | null;
  status: ClinicStatus;
  doctorName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  address: string;
  gstin: string;
  website?: string;
  description?: string;
  logoUrl?: string;
  workingDays?: string[];
  openingTime?: string;
  closingTime?: string;
  tier: SubscriptionTier;
  mrr: number;
  createdAt: string;
  doctorsCount: number;
  staffCount: number;
  leadsCount: number;
  patientsCount: number;
  appointmentsCount: number;
  whatsappConnected: boolean;
  aiEnabled: boolean;
}

export interface ClinicDetail extends Clinic {
  users: PlatformUser[];
  subscription: ClinicSubscription;
  whatsappConfig: {
    phoneNumber: string;
    wabaId: string;
    phoneNumberId?: string;
    apiVersion?: string;
    webhookUrl?: string;
    verifyToken?: string;
    connectionState: 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED';
    webhookStatus: 'HEALTHY' | 'SLOW' | 'FAILING';
    qualityRating: 'GREEN' | 'YELLOW' | 'RED';
    dailyLimit: number;
    lastVerifiedAt: string;
    messageTemplates?: Record<string, string>;
  };
  aiConfig: {
    enabled: boolean;
    provider: string;
    model: string;
    systemPromptVersion: string;
    monthlyTokenQuota: number;
    tokensConsumedThisMonth: number;
    customKnowledgeDocsCount: number;
    tone?: string;
    receptionistName?: string;
    greetingMessage?: string;
    customInstructions?: string;
  };
  landingPage?: {
    landingPageId: string;
    title?: string | null;
    shortDescription?: string | null;
    primaryCta?: string | null;
    whatsappNumber?: string | null;
    enquiryFormEnabled?: boolean;
    services?: unknown;
    doctors?: unknown;
    address?: string | null;
    additionalInfo?: string | null;
    isPublished?: boolean;
  } | null;
  workflowConfig?: {
    qualificationEnabled: boolean;
    appointmentEnabled: boolean;
    reminderEnabled: boolean;
    followUpEnabled: boolean;
    noResponseEnabled: boolean;
    staffHandoffEnabled: boolean;
    followUpHours: number;
    reminderHoursBefore: number;
  } | null;
  usageSummary: {
    whatsappConversations: number;
    whatsappCost: number;
    aiTokens: number;
    aiCost: number;
    totalOverageCost: number;
  };
  recentAuditLogs: AuditLog[];
}

export type PlatformUserRole = 'DOCTOR' | 'EMPLOYEE' | 'SUPER_ADMIN' | 'PLATFORM_ADMIN' | 'SUPPORT_ADMIN' | 'BILLING_ADMIN';

export interface PlatformUser {
  id: string;
  clinicId?: string;
  clinicName?: string;
  name: string;
  email: string;
  phone: string;
  role: PlatformUserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  designation?: string;
  // Doctor-specific profile details
  specialization?: string;
  registrationNumber?: string;
  qualification?: string;
  experienceYears?: number;
  consultationFee?: number;
  doctorId?: string;
  isPrimary?: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  priceMonthly: number;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  features: string[];
  whatsappConversationsIncluded: number;
  aiTokensIncluded: number;
  activeSubscriptionsCount: number;
  isPublic: boolean;
  overageRateWhatsApp: number; // e.g. ₹0.40
  overageRateAi1kTokens: number; // e.g. ₹0.15
}

export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';

export interface ClinicSubscription {
  id: string;
  clinicId: string;
  clinicName: string;
  planId: string;
  planName: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  amount: number;
  currency: string;
  paymentMethodLast4: string;
  paymentMethodBrand: string;
}

export type InvoiceStatus = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';

export interface SaasInvoice {
  id: string;
  invoiceNumber: string;
  clinicId: string;
  clinicName: string;
  planName: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  paidAt?: string;
  pdfUrl?: string;
}

export interface SaasPayment {
  id: string;
  transactionId: string;
  invoiceId: string;
  clinicId: string;
  clinicName: string;
  amount: number;
  currency: string;
  channel: 'UPI' | 'CARD' | 'NET_BANKING' | 'BANK_TRANSFER';
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';
  gatewayReference: string;
  timestamp: string;
  failureReason?: string;
}

export interface FailedPaymentIncident {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clinicId: string;
  clinicName: string;
  amount: number;
  currency: string;
  failedAttempts: number;
  lastAttemptAt: string;
  nextRetryAt?: string;
  errorCategory: 'INSUFFICIENT_FUNDS' | 'CARD_EXPIRED' | 'GATEWAY_REJECT' | 'AUTHENTICATION_FAILED';
  dunningNoticeSent: boolean;
  status: 'OPEN' | 'RESOLVED' | 'WRITTEN_OFF';
}

export interface ClinicUsageRecord {
  clinicId: string;
  clinicName: string;
  whatsappIncluded: number;
  whatsappConsumed: number;
  whatsappOverageCost: number;
  aiTokensIncluded: number;
  aiTokensConsumed: number;
  aiOverageCost: number;
  totalBillableOverage: number;
  billingPeriod: string;
}

export interface UsageOverviewData {
  totalWhatsAppConversations: number;
  totalWhatsAppCost: number;
  totalAiTokens: number;
  totalAiCost: number;
  activeClinicsWithOverage: number;
  clinicsUsage: ClinicUsageRecord[];
  dailyUsageTrend: {
    date: string;
    whatsappCount: number;
    aiTokens: number;
    estimatedCost: number;
  }[];
}

export interface WhatsAppMonitorItem {
  id: string;
  clinicId: string;
  clinicName: string;
  phoneNumber: string;
  wabaId: string;
  connectionState: 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED';
  webhookState: 'HEALTHY' | 'SLOW' | 'FAILING';
  latencyMs: number;
  qualityRating: 'GREEN' | 'YELLOW' | 'RED';
  dailyMessagesSent: number;
  dailyMessagesReceived: number;
  lastVerifiedAt: string;
}

export interface AiModelStatus {
  provider: 'GOOGLE';
  modelName: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
  latencyMs: number;
  tokenCostPer1k: number;
  promptVersion: string;
  errorRatePercent: number;
  totalRequestsToday: number;
}

export type JobQueueName = 'DEFAULT' | 'WHATSAPP' | 'AI' | 'BILLING' | 'NOTIFICATIONS';
export type JobType = 
  | 'WHATSAPP_WEBHOOK_PROCESS' 
  | 'AI_CONVERSATION_SUMMARY' 
  | 'BILLING_RECURRING_CHARGE' 
  | 'META_ADS_SYNC' 
  | 'APPOINTMENT_REMINDER_DISPATCH' 
  | 'DATA_RETENTION_CLEANUP';

export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'STALE';

export interface BackgroundJob {
  id: string;
  queue: JobQueueName;
  jobType: JobType;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
  stackTrace?: string;
  clinicId?: string;
  clinicName?: string;
  correlationId?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  actorType: 'ADMIN' | 'SYSTEM' | 'CLINIC_USER';
  action: string;
  resource: string;
  resourceId: string;
  clinicId?: string;
  clinicName?: string;
  ipAddress: string;
  userAgent: string;
  result: 'SUCCESS' | 'FAILURE';
  diffBefore?: Record<string, any>;
  diffAfter?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface PlatformSettings {
  platformName: string;
  maintenanceMode: boolean;
  defaultCurrency: string;
  whatsappRatePerConversation: number;
  aiRatePer1kTokens: number;
  bullMqConcurrency: number;
  dunningGracePeriodDays: number;
  featureFlags: {
    enableAiVoiceAgents: boolean;
    enableMultiLocationChains: boolean;
    enableAutomatedDunningSuspension: boolean;
    enableRealtimeWebhookInspection: boolean;
  };
  secretsMetadata: {
    metaAppSecret: { lastRotated: string; keyFingerprint: string };
    whatsappAccessToken: { lastRotated: string; keyFingerprint: string };
    openaiApiKey: { lastRotated: string; keyFingerprint: string };
    databaseUrl: { lastRotated: string; keyFingerprint: string };
    jwtSecret: { lastRotated: string; keyFingerprint: string };
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
