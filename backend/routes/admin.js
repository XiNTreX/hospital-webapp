const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
// ==========================================
// GET /api/admin/stats (Dashboard Analytics)
// ==========================================
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const patientsCount = await pool.query(`SELECT COUNT(*) FROM "PATIENT"`);
    const doctorsCount = await pool.query(`SELECT COUNT(*) FROM "DOCTOR"`);
    const appointmentsCount = await pool.query(`SELECT COUNT(*) FROM "APPOINTMENT"`);
    const pendingTestsCount = await pool.query(`SELECT COUNT(*) FROM "TEST_REPORT" WHERE status != 'Completed'`);

    res.json({
      totalPatients: parseInt(patientsCount.rows[0].count),
      totalDoctors: parseInt(doctorsCount.rows[0].count),
      totalAppointments: parseInt(appointmentsCount.rows[0].count),
      pendingTests: parseInt(pendingTestsCount.rows[0].count),
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Server error fetching analytics' });
  }
});

// ==========================================
// GET /api/admin/doctors (Manage Doctors)
// ==========================================
router.get('/doctors', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.doctor_id, d.first_name, d.last_name, d.specialization, d.doctor_type, d.room_number, u.email 
      FROM "DOCTOR" d
      JOIN "USER_ACCOUNT" u ON d.account_id = u.account_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching doctors:', err);
    res.status(500).json({ error: 'Server error fetching doctors' });
  }
});

// ==========================================
// POST /api/admin/doctors (Onboard New Doctor)
// ==========================================
router.post('/doctors', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { email, password, first_name, last_name, specialization, doctor_type, room_number } = req.body;

    const hashedPassword = await bcrypt.hash(password || 'password123', 10);
    
    // 1. Create User Account
    const accRes = await client.query(
      `INSERT INTO "USER_ACCOUNT" (email, password_hash, role) VALUES ($1, $2, 'DOCTOR') RETURNING account_id`,
      [email, hashedPassword]
    );
    const accountId = accRes.rows[0].account_id;

    // 2. Create Doctor Profile
    await client.query(
      `INSERT INTO "DOCTOR" (account_id, first_name, last_name, specialization, doctor_type, room_number) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [accountId, first_name, last_name, specialization, doctor_type || 'Clinical', room_number]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Doctor onboarded successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating doctor:', err);
    res.status(500).json({ error: 'Server error creating doctor profile' });
  } finally {
    client.release();
  }
});

// ==========================================
// GET /api/admin/tests (Fetch all tests)
// ==========================================
router.get('/tests', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM "TEST" ORDER BY test_id ASC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tests:', err);
    res.status(500).json({ error: 'Server error fetching tests' });
  }
});

// ==========================================
// POST /api/admin/tests (Add a new test)
// ==========================================
router.post('/tests', verifyToken, async (req, res) => {
  try {
    const { name, cost } = req.body;
    const result = await pool.query(
      `INSERT INTO "TEST" (name, cost) VALUES ($1, $2) RETURNING *`,
      [name, cost]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating test:', err);
    res.status(500).json({ error: 'Server error creating test' });
  }
});

// ==========================================
// GET /api/admin/medicines (Fetch all medicines)
// ==========================================
router.get('/medicines', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM "MEDICINE" ORDER BY medicine_id ASC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching medicines:', err);
    res.status(500).json({ error: 'Server error fetching medicines' });
  }
});

// ==========================================
// POST /api/admin/medicines (Add a new medicine)
// ==========================================
router.post('/medicines', verifyToken, async (req, res) => {
  try {
    const { name, generic_name, description } = req.body;
    const result = await pool.query(
      `INSERT INTO "MEDICINE" (name, generic_name, description) VALUES ($1, $2, $3) RETURNING *`,
      [name, generic_name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating medicine:', err);
    res.status(500).json({ error: 'Server error creating medicine' });
  }
});

module.exports = router;