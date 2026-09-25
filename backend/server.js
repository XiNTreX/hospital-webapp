const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

// Mount API Routes
app.use('/api/auth', require('./routes/auth'));
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/patient', require('./routes/patient'));
app.use('/api/doctor', require('./routes/doctor'));
app.use('/api/donor', require('./routes/donor'));
app.use('/api/driver', require('./routes/driver'));

// ==========================================
// Scheduled sweep: expire overdue blood requests
// Runs on boot, then every 30 minutes.
// ==========================================
async function expireOverdueRequests() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Cancel pledges tied to requests about to expire
    const cancelRes = await client.query(`
      UPDATE "BLOOD_DONATION" bd
      SET status = 'Cancelled',
          cancelled_at = CURRENT_TIMESTAMP
      FROM "BLOOD_REQUEST" br
      WHERE bd.request_id = br.request_id
        AND br.status = 'Pending'
        AND br.need_date < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date
        AND br.units_fulfilled < br.units_needed
        AND bd.status IN ('Pending', 'Pledged')
    `);

    // 2. Expire the requests and reset their live counters
    const expireRes = await client.query(`
      UPDATE "BLOOD_REQUEST"
      SET status = 'Expired',
          units_pending = 0,
          units_pledged = 0
      WHERE status = 'Pending'
        AND need_date < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date
        AND units_fulfilled < units_needed
      RETURNING request_id
    `);

    await client.query('COMMIT');

    if (expireRes.rowCount > 0 || cancelRes.rowCount > 0) {
      console.log(
        `[expiry sweep] Expired ${expireRes.rowCount} request(s), cancelled ${cancelRes.rowCount} pledge(s)`
      );
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[expiry sweep] Failed:', err.message);
  } finally {
    client.release();
  }
}

expireOverdueRequests();
setInterval(expireOverdueRequests, 30 * 60 * 1000); // every 30 minutes

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});