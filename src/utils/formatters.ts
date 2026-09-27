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

/**
 * Format date string with date-fns
 */
export function formatDate(dateString: string | null | undefined, formatPattern: string = 'dd MMM yyyy'): string {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, formatPattern);
  } catch {
    return dateString;
  }
}

/**
 * Format date and time
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  return formatDate(dateString, 'dd MMM yyyy, hh:mm a');
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
