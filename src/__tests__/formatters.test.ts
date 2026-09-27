/* Unit tests for admin formatters.test.
 * Guards formatting, permissions, or clinic-onboarding helpers. */
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatTokens, formatCompactNumber, formatDurationMs } from '../utils/formatters';

describe('Formatters and Value Renderers', () => {
  it('formats INR currency correctly', () => {
    expect(formatCurrency(25000)).toMatch(/₹\s*25,000/);
    expect(formatCurrency(0)).toMatch(/₹\s*0/);
    expect(formatCurrency(null)).toBe('₹0');
  });

  it('formats LLM token counts with compact suffixes', () => {
    expect(formatTokens(680000)).toBe('680.0k tokens');
    expect(formatTokens(1250000)).toBe('1.25M tokens');
    expect(formatTokens(450)).toBe('450 tokens');
    expect(formatTokens(0)).toBe('0 tokens');
  });

  it('formats compact numbers', () => {
    expect(formatCompactNumber(1200)).toBe('1.2k');
    expect(formatCompactNumber(2500000)).toBe('2.5M');
    expect(formatCompactNumber(45)).toBe('45');
  });

  it('formats millisecond latencies', () => {
    expect(formatDurationMs(142)).toBe('142ms');
    expect(formatDurationMs(1500)).toBe('1.50s');
  });
});
