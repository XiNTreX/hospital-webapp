const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

router.get('/profile', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT first_name, last_name, specialization, room_number, photo_url 
       FROM "DOCTOR" 
       WHERE account_id = $1`,
      [req.user.accountId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor profile not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching doctor profile:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// GET /api/doctor/appointments
// ==========================================
router.get('/appointments', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         a.appointment_id, 
         a.date, 
         a.time, 
         a.serial_no,
         a.status,
         p.first_name AS patient_first_name, 
         p.last_name AS patient_last_name,
         p.gender,
         p.phone AS patient_phone,
         EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) AS patient_age
       FROM "APPOINTMENT" a
       JOIN "PATIENT" p ON a.patient_id = p.patient_id
       WHERE a.doctor_id = (SELECT doctor_id FROM "DOCTOR" WHERE account_id = $1)
         AND a.status != 'Cancelled'
       ORDER BY a.date ASC, a.time ASC`,
      [req.user.accountId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching doctor appointments:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;