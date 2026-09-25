const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');
// ==========================================
// Helper: get driver_id from JWT accountId
// ==========================================
async function getDriverId(accountId) {
  const res = await pool.query(
    'SELECT driver_id FROM "DRIVER" WHERE account_id = $1',
    [accountId]
  );
  return res.rows[0]?.driver_id || null;
}

// Statuses that count as "active ride" (blocks new accepts)
const ACTIVE_STATUSES = ['Accepted', 'En Route', 'Arrived', 'Picked Up'];

// ==========================================
// GET /api/driver/profile
// ==========================================
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.driver_id, d.first_name, d.last_name, u.email,
              d.license_no, d.phone, d.status
       FROM "USER_ACCOUNT" u
       JOIN "DRIVER" d ON u.account_id = d.account_id
       WHERE u.account_id = $1`,
      [req.user.accountId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Driver profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// PUT /api/driver/profile
// ==========================================
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { first_name, last_name, phone, license_no } = req.body;

    if (!first_name || !last_name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required.' });
    }

    await pool.query(
      `UPDATE "DRIVER"
       SET first_name = $1, last_name = $2, phone = $3,
           license_no = COALESCE($4, license_no)
       WHERE account_id = $5`,
      [first_name, last_name, phone, license_no || null, req.user.accountId]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Driver profile update error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'License number already in use.' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// ==========================================
// PUT /api/driver/status
// Body: { status: 'Available' | 'Off Duty' }
// 'On Trip' is system-managed — never accepted here.
// ==========================================
router.put('/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;

    const allowed = ['Available', 'Off Duty'];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: "Only 'Available' or 'Off Duty' can be set manually. 'On Trip' is automatic."
      });
    }

    const driverId = await getDriverId(req.user.accountId);
    if (!driverId) return res.status(404).json({ error: 'Driver not found' });

    // If driver has an active ride, block all manual status changes
    const active = await pool.query(
      `SELECT request_id FROM "AMBULANCE_REQUEST"
       WHERE driver_id = $1 AND status = ANY($2::text[])`,
      [driverId, ACTIVE_STATUSES]
    );
    if (active.rows.length > 0) {
      return res.status(400).json({
        error: 'You are currently on a trip. Complete or cancel it first.'
      });
    }

    // Self-heal: if status was stuck at 'On Trip' with no ride, this will fix it
    await pool.query(
      'UPDATE "DRIVER" SET status = $1 WHERE driver_id = $2',
      [status, driverId]
    );

    res.json({ message: `You are now ${status}`, status });
  } catch (err) {
    console.error('Driver status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// ==========================================
// GET /api/driver/requests/available
// Pending requests with no driver assigned
// ==========================================
router.get('/requests/available', verifyToken, async (req, res) => {
  try {
    const driverId = await getDriverId(req.user.accountId);
    if (!driverId) return res.status(404).json({ error: 'Driver not found' });

    // 🔒 NEW: return empty if not Available
    const statusRow = await pool.query(
      `SELECT status FROM "DRIVER" WHERE driver_id = $1`,
      [driverId]
    );
    if (statusRow.rows[0]?.status !== 'Available') {
      return res.json([]);
    }
    const result = await pool.query(
      `SELECT ar.request_id, ar.pickup_location, ar.drop_location,
              ar.request_time, ar.status, ar.patient_notes,
              p.first_name, p.last_name, p.phone AS patient_phone
       FROM "AMBULANCE_REQUEST" ar
       JOIN "PATIENT" p ON ar.patient_id = p.patient_id
       WHERE ar.status = 'Pending' AND ar.driver_id IS NULL
       ORDER BY ar.request_time ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Available requests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// POST /api/driver/requests/:id/accept
// ==========================================
router.post('/requests/:id/accept', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const requestId = parseInt(req.params.id);
    const driverId = await getDriverId(req.user.accountId);
    if (!driverId) return res.status(404).json({ error: 'Driver not found' });

    await client.query('BEGIN');
    // 🔒 NEW: Driver must be Available (not Off Duty / On Trip)
    const statusRow = await client.query(
      `SELECT status FROM "DRIVER" WHERE driver_id = $1 FOR UPDATE`,
      [driverId]
    );
    const driverStatus = statusRow.rows[0]?.status;
    if (driverStatus !== 'Available') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error:
          driverStatus === 'Off Duty'
            ? 'You are currently Off Duty. Toggle to Available before accepting rides.'
            : `You cannot accept a ride while status is "${driverStatus}".`
      });
    }
    // 1. Driver can't already have an active ride
    const active = await client.query(
      `SELECT request_id FROM "AMBULANCE_REQUEST"
       WHERE driver_id = $1 AND status = ANY($2::text[])`,
      [driverId, ACTIVE_STATUSES]
    );
    if (active.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'You already have an active ride. Complete it before accepting another.'
      });
    }

    // 2. Lock the target row and verify it's still claimable
    const reqRow = await client.query(
      `SELECT request_id, status, driver_id FROM "AMBULANCE_REQUEST"
       WHERE request_id = $1 FOR UPDATE`,
      [requestId]
    );
    if (reqRow.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found' });
    }
    if (reqRow.rows[0].status !== 'Pending' || reqRow.rows[0].driver_id) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'This request has already been accepted by another driver.'
      });
    }

    // 3. Claim it
    await client.query(
      `UPDATE "AMBULANCE_REQUEST"
       SET driver_id = $1, status = 'Accepted', accepted_at = CURRENT_TIMESTAMP
       WHERE request_id = $2`,
      [driverId, requestId]
    );

    // 4. Auto-set driver status to On Trip
    await client.query(
      `UPDATE "DRIVER" SET status = 'On Trip' WHERE driver_id = $1`,
      [driverId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Request accepted', request_id: requestId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Accept request error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// ==========================================
// GET /api/driver/requests/current
// ==========================================
router.get('/requests/current', verifyToken, async (req, res) => {
  try {
    const driverId = await getDriverId(req.user.accountId);
    const result = await pool.query(
      `SELECT ar.request_id, ar.pickup_location, ar.drop_location,
              ar.request_time, ar.status, ar.patient_notes,
              ar.accepted_at, ar.en_route_at, ar.arrived_at,
              ar.picked_up_at, ar.completed_at,
              p.first_name, p.last_name, p.phone AS patient_phone
       FROM "AMBULANCE_REQUEST" ar
       JOIN "PATIENT" p ON ar.patient_id = p.patient_id
       WHERE ar.driver_id = $1 AND ar.status = ANY($2::text[])
       ORDER BY ar.accepted_at DESC
       LIMIT 1`,
      [driverId, ACTIVE_STATUSES]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error('Current ride error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// PUT /api/driver/requests/:id/status
// Body: { status: 'En Route' | 'Arrived' | 'Picked Up' | 'Completed' }
// ==========================================
router.put('/requests/:id/status', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const requestId = parseInt(req.params.id);
    const { status } = req.body;
    const driverId = await getDriverId(req.user.accountId);

    // Strict transition map — driver can only move forward
    const NEXT = {
      'Accepted':  'En Route',
      'En Route':  'Arrived',
      'Arrived':   'Picked Up',
      'Picked Up': 'Completed'
    };

    await client.query('BEGIN');

    const cur = await client.query(
      `SELECT status FROM "AMBULANCE_REQUEST"
       WHERE request_id = $1 AND driver_id = $2 FOR UPDATE`,
      [requestId, driverId]
    );
    if (cur.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Ride not found' });
    }
    const currentStatus = cur.rows[0].status;
    if (NEXT[currentStatus] !== status) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Invalid transition: ${currentStatus} → ${status}`
      });
    }

    // Timestamp column per new status
    const TS_COL = {
      'En Route':  'en_route_at',
      'Arrived':   'arrived_at',
      'Picked Up': 'picked_up_at',
      'Completed': 'completed_at'
    }[status];

    await client.query(
      `UPDATE "AMBULANCE_REQUEST"
       SET status = $1, ${TS_COL} = CURRENT_TIMESTAMP
       WHERE request_id = $2`,
      [status, requestId]
    );

    // On completion, free up the driver
    if (status === 'Completed') {
      await client.query(
        `UPDATE "DRIVER" SET status = 'Available' WHERE driver_id = $1`,
        [driverId]
      );
    }

    await client.query('COMMIT');
    res.json({ message: `Ride updated to ${status}`, status });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update ride status error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// ==========================================
// PUT /api/driver/requests/:id/cancel
// Only allowed while status = 'Accepted'
// ==========================================
router.put('/requests/:id/cancel', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const requestId = parseInt(req.params.id);
    const driverId = await getDriverId(req.user.accountId);

    await client.query('BEGIN');

    const cur = await client.query(
      `SELECT status FROM "AMBULANCE_REQUEST"
       WHERE request_id = $1 AND driver_id = $2 FOR UPDATE`,
      [requestId, driverId]
    );
    if (cur.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Ride not found' });
    }
    if (cur.rows[0].status !== 'Accepted') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'You can only cancel a ride before starting the trip.'
      });
    }

    // Keep driver_id set so this ride still shows in the driver's Cancelled Rides
    await client.query(
      `UPDATE "AMBULANCE_REQUEST"
       SET status = 'Cancelled', cancelled_at = CURRENT_TIMESTAMP,
           cancelled_by = 'DRIVER'
       WHERE request_id = $1`,
      [requestId]
    );

    // Free driver back to Available
    await client.query(
      `UPDATE "DRIVER" SET status = 'Available' WHERE driver_id = $1`,
      [driverId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Ride cancelled' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Cancel ride error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// ==========================================
// GET /api/driver/requests/completed
// ==========================================
router.get('/requests/completed', verifyToken, async (req, res) => {
  try {
    const driverId = await getDriverId(req.user.accountId);
    const result = await pool.query(
      `SELECT ar.request_id, ar.pickup_location, ar.drop_location,
              ar.request_time, ar.status, ar.patient_notes,
              ar.accepted_at, ar.completed_at,
              p.first_name, p.last_name
       FROM "AMBULANCE_REQUEST" ar
       JOIN "PATIENT" p ON ar.patient_id = p.patient_id
       WHERE ar.driver_id = $1 AND ar.status = 'Completed'
       ORDER BY ar.completed_at DESC`,
      [driverId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Completed rides error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// GET /api/driver/requests/cancelled
// Shows rides this driver had accepted but which ended up cancelled
// (either by driver or by patient)
// ==========================================
router.get('/requests/cancelled', verifyToken, async (req, res) => {
  try {
    const driverId = await getDriverId(req.user.accountId);
    const result = await pool.query(
      `SELECT ar.request_id, ar.pickup_location, ar.drop_location,
              ar.request_time, ar.status, ar.patient_notes,
              ar.cancelled_at, ar.cancelled_by,
              p.first_name, p.last_name
       FROM "AMBULANCE_REQUEST" ar
       JOIN "PATIENT" p ON ar.patient_id = p.patient_id
       WHERE ar.driver_id = $1 AND ar.status = 'Cancelled'
       ORDER BY ar.cancelled_at DESC`,
      [driverId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Cancelled rides error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// GET /api/driver/ambulance
// Returns the ambulance assigned to this driver (via AMBULANCE.driver_id)
// ==========================================
router.get('/ambulance', verifyToken, async (req, res) => {
  try {
    const driverId = await getDriverId(req.user.accountId);
    const result = await pool.query(
      `SELECT a.ambulance_id, a.ambulance_no, a.status,
              d.name AS department_name
       FROM "AMBULANCE" a
       LEFT JOIN "DEPARTMENT" d ON a.department_id = d.department_id
       WHERE a.driver_id = $1
       LIMIT 1`,
      [driverId]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error('Ambulance fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;