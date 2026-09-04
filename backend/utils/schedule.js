// backend/utils/schedule.js

// Default schedule: 4 sessions of 2 hours, breaks 30 min
// Start at 12:00, end at 21:30
const DEFAULT_SESSIONS = [
  { start: '12:00', end: '14:00' },
  { start: '14:30', end: '16:30' },
  { start: '17:00', end: '19:00' },
  { start: '19:30', end: '21:30' }
];

// Max patients per session
const MAX_PER_SESSION = 10;

/**
 * Get available sessions for a doctor on a given date.
 * @param {number} doctorId
 * @param {string} date - YYYY-MM-DD
 * @param {import('pg').Pool} pool - database pool
 * @returns {Promise<Array>} Array of session objects with availability
 */
async function getAvailableSessions(doctorId, date, pool) {
  // 1. Get all appointments for this doctor on this date
  const result = await pool.query(
    `SELECT time FROM "APPOINTMENT" 
     WHERE doctor_id = $1 AND date = $2 AND status = 'Scheduled'`,
    [doctorId, date]
  );
  
  const bookedTimes = result.rows.map(row => row.time);
  
  // 2. Generate sessions (default for now; later we'll check custom schedules)
  const sessions = DEFAULT_SESSIONS.map(session => {
    // Count how many appointments fall within this session's time range
    const count = bookedTimes.filter(time => {
      // time is a string like '12:00:00' or '14:30:00'
      return time >= session.start && time < session.end;
    }).length;
    
    const available = count < MAX_PER_SESSION;
    return {
      ...session,
      booked: count,
      available,
      remaining: MAX_PER_SESSION - count
    };
  });
  
  return sessions;
}

/**
 * Get the next serial number for a doctor on a given date.
 */
async function getNextSerial(doctorId, date, pool) {
  const result = await pool.query(
    `SELECT COALESCE(MAX(serial_no), 0) + 1 AS next_serial 
     FROM "APPOINTMENT" 
     WHERE doctor_id = $1 AND date = $2`,
    [doctorId, date]
  );
  return result.rows[0].next_serial;
}

/**
 * Check if a specific session is available for booking.
 */
async function isSessionAvailable(doctorId, date, time, pool) {
  const sessions = await getAvailableSessions(doctorId, date, pool);
  const session = sessions.find(s => s.start === time);
  if (!session) return false;
  return session.available;
}

module.exports = {
  DEFAULT_SESSIONS,
  MAX_PER_SESSION,
  getAvailableSessions,
  getNextSerial,
  isSessionAvailable
};