const TIMEZONE = 'Asia/Dhaka';

export function todayDhaka(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function addDaysDhaka(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().split('T')[0];
}

export function oneMonthFromTodayDhaka(): string {
  const [y, m, d] = todayDhaka().split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCMonth(dt.getUTCMonth() + 1);
  return dt.toISOString().split('T')[0];
}

export function formatDateTimeDhaka(input: string | null | undefined): string {
  if (!input) return '—';
  const d = new Date(input);
  return d.toLocaleString('en-GB', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateDhaka(input: string | null | undefined): string {
  if (!input) return '—';
  const d = new Date(input);
  return d.toLocaleDateString('en-GB', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function timeAgoDhaka(input: string | null | undefined): string {
  if (!input) return '—';
  const d = new Date(input);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return formatDateDhaka(input);
}
export function formatTimeDhaka(input: string | null | undefined): string {
  if (!input) return '—';
  const d = new Date(input);
  return d.toLocaleTimeString('en-GB', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}