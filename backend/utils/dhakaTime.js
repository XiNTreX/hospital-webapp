// All times in this app are anchored to Asia/Dhaka (Bangladesh Standard Time, UTC+6)
const TIMEZONE = 'Asia/Dhaka';

/**
 * Returns today's date in Bangladesh as "YYYY-MM-DD"
 */
function todayDhaka() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * Returns current timestamp in Bangladesh (readable string, for logs)
 */
function nowDhaka() {
  return new Date().toLocaleString('en-GB', {
    timeZone: TIMEZONE,
    hour12: false,
  });
}

/**
 * Days between two YYYY-MM-DD strings (a − b)
 * Positive if a is later than b.
 */
function daysBetween(a, b) {
  const msPerDay = 86400000;
  const da = new Date(a + 'T00:00:00Z').getTime();
  const db = new Date(b + 'T00:00:00Z').getTime();
  return Math.floor((da - db) / msPerDay);
}
function oneMonthFromTodayDhaka() {
  const [y, m, d] = todayDhaka().split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCMonth(dt.getUTCMonth() + 1);
  return dt.toISOString().split('T')[0];
}
// module.exports = { todayDhaka, nowDhaka, daysBetween, TIMEZONE };
module.exports = { todayDhaka, nowDhaka, daysBetween, oneMonthFromTodayDhaka, TIMEZONE };