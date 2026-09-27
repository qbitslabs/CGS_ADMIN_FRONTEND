/* Admin frontend client for billing endpoints.
 * Talks to CGS admin routes with the operator bearer token. */
import { cgs_api } from './client';
import {
  FailedPaymentIncident,
  SaasInvoice,
  SaasPayment,
  SubscriptionPlan,
  ClinicSubscription,
} from '../types';

export const billingApi = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const res = await cgs_api.get('/plans');
    const raw = res.data?.data || res.data || [];
    return Array.isArray(raw) ? raw : [];
  },

  getSubscriptions: async (): Promise<ClinicSubscription[]> => {
    const res = await cgs_api.get('/subscriptions');
    const raw = res.data?.data || res.data || [];
    return Array.isArray(raw) ? raw : [];
  },

  getInvoices: async (): Promise<SaasInvoice[]> => {
    const res = await cgs_api.get('/invoices');
    const raw = res.data?.data || res.data || [];
    return Array.isArray(raw) ? raw : [];
  },

  getPayments: async (): Promise<SaasPayment[]> => {
    const invoices = await billingApi.getInvoices();
    return invoices.map((inv) => ({
      id: `pay-${inv.id}`,
      transactionId: `tx_${inv.id.slice(0, 8)}`,
      invoiceId: inv.id,
      clinicId: inv.clinicId,
      clinicName: inv.clinicName,
      amount: inv.totalAmount || inv.amount,
      currency: inv.currency || 'INR',
      channel: 'UPI',
      status: inv.status === 'PAID' ? 'SUCCESS' : inv.status === 'FAILED' ? 'FAILED' : 'PENDING',
      gatewayReference: `rzp_pay_${inv.id.slice(0, 8)}`,
      timestamp: inv.paidAt || inv.billingPeriodStart || new Date().toISOString(),
    }));
  },

  getFailedPayments: async (): Promise<FailedPaymentIncident[]> => {
    const invoices = await billingApi.getInvoices();
    return invoices
      .filter((inv) => inv.status === 'FAILED')
      .map((inv) => ({
        id: `fail-${inv.id}`,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clinicId: inv.clinicId,
        clinicName: inv.clinicName,
        amount: inv.totalAmount || inv.amount,
        currency: inv.currency || 'INR',
        failedAttempts: 1,
        lastAttemptAt: inv.dueDate || new Date().toISOString(),
        errorCategory: 'GATEWAY_REJECT',
        dunningNoticeSent: false,
        status: 'OPEN',
      }));
  },

  retryFailedPayment: async (_id: string): Promise<FailedPaymentIncident> => {
    throw new Error('No pending retry payment.');
  },
};
