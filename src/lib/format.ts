/**
 * Formatting helpers. Locale is fixed to en-AU for now; we'll make it
 * configurable when/if we add multi-currency support.
 */

const AUD = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 2,
});

export function formatAUD(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '—';
  return AUD.format(cents / 100);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Australian financial year for a given date. FY2026 = 1 Jul 2025 – 30 Jun 2026.
 */
export function australianFinancialYear(date: Date = new Date()): number {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0–11
  return m >= 6 ? y + 1 : y;
}
