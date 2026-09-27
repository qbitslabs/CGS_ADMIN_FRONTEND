/* Admin helper for billing.
 * Supports the platform console for this area. */
import { SaasInvoice } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

export function downloadSaasReceiptHtml(invoice: SaasInvoice) {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CGS SaaS Tax Invoice - ${invoice.invoiceNumber}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: 40px 20px;
    }
    .invoice-card {
      max-width: 780px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    .brand h1 {
      margin: 0;
      color: #0f172a;
      font-size: 24px;
      font-weight: 800;
    }
    .brand p {
      margin: 4px 0 0;
      color: #64748b;
      font-size: 13px;
    }
    .meta-badge {
      display: inline-block;
      padding: 6px 14px;
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      border-radius: 20px;
      font-weight: 700;
      font-size: 13px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-bottom: 32px;
      font-size: 13.5px;
    }
    .info-box h4 {
      margin: 0 0 8px;
      color: #64748b;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    th {
      background: #f1f5f9;
      text-align: left;
      padding: 12px 14px;
      font-size: 12.5px;
      color: #475569;
      text-transform: uppercase;
    }
    td {
      padding: 14px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    .totals {
      float: right;
      width: 300px;
      margin-bottom: 40px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13.5px;
      color: #475569;
    }
    .totals-row.grand {
      border-top: 2px solid #0f172a;
      padding-top: 10px;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .footer {
      clear: both;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .invoice-card { border: none; box-shadow: none; padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 780px; margin: 0 auto 16px; display: flex; justify-content: flex-end;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-weight: 700; cursor: pointer;">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <div class="invoice-card">
    <div class="header">
      <div class="brand">
        <h1>CLINIC GROWTH SYSTEM (CGS)</h1>
        <p>Clinic Growth Technologies India Pvt Ltd • GSTIN: 27AABCC9988D1Z4</p>
        <p>Enterprise SaaS Platform for Dental Practices</p>
      </div>
      <div>
        <div class="meta-badge">${invoice.status}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <h4>Billed To (Clinic Tenant)</h4>
        <strong style="font-size: 15px; color: #0f172a;">${invoice.clinicName}</strong><br>
        <span>Billing Period: ${formatDate(invoice.billingPeriodStart)} – ${formatDate(invoice.billingPeriodEnd)}</span><br>
        <span>Due Date: ${formatDate(invoice.dueDate)}</span>
      </div>

      <div class="info-box" style="text-align: right;">
        <h4>Tax Invoice Details</h4>
        <span>Invoice No: <strong>${invoice.invoiceNumber}</strong></span><br>
        <span>Invoice Date: <strong>${formatDate(invoice.billingPeriodStart)}</strong></span><br>
        <span>Payment Method: <strong>Auto-Debit (Razorpay Subscriptions)</strong></span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description & Scope</th>
          <th>Billing Cycle</th>
          <th style="text-align: right;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${invoice.planName}</strong><br>
            <span style="font-size: 12.5px; color: #64748b;">
              Includes WhatsApp Business Cloud API routing, AI Receptionist LLM inference, and multi-user clinic CRM.
            </span>
          </td>
          <td>Monthly Recurring</td>
          <td style="text-align: right; font-weight: 600;">${formatCurrency(invoice.amount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Subtotal:</span>
        <span>${formatCurrency(invoice.amount)}</span>
      </div>
      <div class="totals-row">
        <span>GST (18% Integrated Tax):</span>
        <span>${formatCurrency(invoice.taxAmount)}</span>
      </div>
      <div class="totals-row grand">
        <span>Total Amount Paid:</span>
        <span>${formatCurrency(invoice.totalAmount)}</span>
      </div>
    </div>

    <div class="footer">
      <p>This is a computer-generated tax invoice issued by Clinic Growth System (CGS). No signature required.</p>
      <p>For SaaS billing queries, reach out to billing@clinicgrowth.com</p>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoice.invoiceNumber}.html`;
    a.click();
  }
}
