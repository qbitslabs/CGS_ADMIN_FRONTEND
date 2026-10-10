/* Admin frontend utility: formatters.
 * Formatting or permission helpers used by operator screens. */
import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Format numbers as Indian Rupee (INR) currency or specified currency
 */
export function formatCurrency(amount: number | null | undefined, currency: string = 'INR'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

const CLINIC_TZ = 'Asia/Kolkata';

function toDate(value: unknown): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Format a calendar date as 10 Oct 2026.
 */
export function formatDate(dateString: string | null | undefined, formatPattern: string = 'dd MMM yyyy'): string {
  if (!dateString) return '—';
  if (!/^\d{4}-\d{2}-\d{2}/.test(String(dateString).trim())) return dateString;
  const date = toDate(dateString);
  if (!date) return dateString;
  if (formatPattern === 'dd MMM yyyy') {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: /^\d{4}-\d{2}-\d{2}$/.test(dateString) ? 'UTC' : CLINIC_TZ,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
  try {
    const parsed = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(parsed, formatPattern);
  } catch {
    return dateString;
  }
}

/**
 * Format a timestamp as 10 Oct 2026, 1:49 pm in India time.
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())) return formatDate(dateString);
  if (!/^\d{4}-\d{2}-\d{2}[T ]/.test(dateString.trim())) return dateString;
  const date = toDate(dateString);
  if (!date) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: CLINIC_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Relative time from now (e.g. "5 minutes ago")
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateString;
  }
}

/**
 * Format numbers with compact suffixes (1.2K, 3.4M)
 */
export function formatCompactNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}k`;
  }
  return num.toLocaleString('en-IN');
}

/**
 * Format LLM token counts
 */
export function formatTokens(tokens: number | null | undefined): string {
  if (!tokens) return '0 tokens';
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M tokens`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}k tokens`;
  }
  return `${tokens} tokens`;
}

/**
 * Format milliseconds latency
 */
export function formatDurationMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
