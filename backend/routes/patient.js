const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

// ==========================================
// GET /api/patient/profile
// ==========================================
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.user;
    
    const result = await pool.query(
      `SELECT p.first_name, p.last_name, p.dob, p.gender, p.phone, p.blood_group, p.address,
              u.email
       FROM "PATIENT" p
       JOIN "USER_ACCOUNT" u ON p.account_id = u.account_id
       WHERE p.account_id = $1`,
      [accountId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// PUT /api/patient/profile
// ==========================================
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.user;
    const { first_name, last_name, dob, gender, phone, blood_group, address } = req.body;
    
    await pool.query(
      `UPDATE "PATIENT" 
       SET first_name = $1, last_name = $2, dob = $3, gender = $4, 
           phone = $5, blood_group = $6, address = $7
       WHERE account_id = $8`,
      [first_name, last_name, dob, gender, phone, blood_group, address, accountId]
    );
    
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// GET /api/patient/doctors
// ==========================================
router.get('/doctors', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT doctor_id, first_name, last_name, specialization, degrees, 
              email, phone, room_number, fee, status, photo_url
       FROM "DOCTOR"
       WHERE status = 'Active'
       ORDER BY first_name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Doctors error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// ==========================================
// GET /api/patient/appointments/slots
// Query: doctorId, date (YYYY-MM-DD)
// ==========================================
router.get('/appointments/slots', verifyToken, async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    
    // Validate inputs
    if (!doctorId || !date) {
      return res.status(400).json({ error: 'doctorId and date are required' });
    }
    
    // Check if date is valid and within 1 month
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0,0,0,0);
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 1);
    
    if (selectedDate < today) {
      return res.status(400).json({ error: 'Cannot book appointments in the past' });
    }
    if (selectedDate > maxDate) {
      return res.status(400).json({ error: 'Bookings only allowed up to 1 month in advance' });
    }
    
    // Get available sessions
    const { getAvailableSessions } = require('../utils/schedule');
    const sessions = await getAvailableSessions(parseInt(doctorId), date, pool);
    
    res.json({
      doctorId: parseInt(doctorId),
      date,
      sessions
    });
  } catch (err) {
    console.error('Slots error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// GET /api/patient/appointments/pending
// ==========================================
router.get('/appointments/pending', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.user;
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      `SELECT a.appointment_id, a.date, a.time, a.serial_no, a.status,
              a.doctor_id,  -- 👈 ADD THIS
              d.first_name as doctor_first, d.last_name as doctor_last,
              d.specialization, d.room_number, d.photo_url
       FROM "APPOINTMENT" a
       JOIN "DOCTOR" d ON a.doctor_id = d.doctor_id
       JOIN "PATIENT" p ON a.patient_id = p.patient_id
       WHERE p.account_id = $1 
         AND a.status = 'Scheduled' 
         AND a.date >= $2
       ORDER BY a.date ASC, a.time ASC`,
      [accountId, today]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Pending appointments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// GET /api/patient/appointments/past
// ==========================================
router.get('/appointments/past', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.user;
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      `SELECT a.appointment_id, a.date, a.time, a.serial_no, a.status,
              a.doctor_id,  -- 👈 ADD THIS
              d.first_name as doctor_first, d.last_name as doctor_last,
              d.specialization, d.photo_url
       FROM "APPOINTMENT" a
       JOIN "DOCTOR" d ON a.doctor_id = d.doctor_id
       JOIN "PATIENT" p ON a.patient_id = p.patient_id
       WHERE p.account_id = $1 
         AND (a.status = 'Completed' OR a.status = 'Cancelled' OR a.date < $2)
       ORDER BY a.date DESC, a.time DESC`,
      [accountId, today]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Past appointments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// ==========================================
// PUT /api/patient/appointments/:id/cancel
// ==========================================
router.put('/appointments/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.user;
    const appointmentId = parseInt(req.params.id);
    
    // First, verify this appointment belongs to this patient
    const checkResult = await pool.query(
      `SELECT a.appointment_id, a.status, a.date
       FROM "APPOINTMENT" a
       JOIN "PATIENT" p ON a.patient_id = p.patient_id
       WHERE a.appointment_id = $1 AND p.account_id = $2`,
      [appointmentId, accountId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    const appointment = checkResult.rows[0];
    
    // Check if appointment is already past
    const today = new Date().toISOString().split('T')[0];
    if (appointment.date < today) {
      return res.status(400).json({ error: 'Cannot cancel past appointments' });
    }
    
    // Check if already cancelled
    if (appointment.status === 'Cancelled') {
      return res.status(400).json({ error: 'Appointment is already cancelled' });
    }
    
    // Update status to Cancelled
    await pool.query(
      `UPDATE "APPOINTMENT" SET status = 'Cancelled' WHERE appointment_id = $1`,
      [appointmentId]
    );
    
    res.json({ 
      message: 'Appointment cancelled successfully',
      appointment_id: appointmentId
    });
    
  } catch (err) {
    console.error('Cancel appointment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// ==========================================
// POST /api/patient/appointments/book
// ==========================================
// ==========================================
// POST /api/patient/appointments/book
// ==========================================
router.post('/appointments/book', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { accountId } = req.user;
    const { doctorId, date, time } = req.body;
    
    // Validate inputs
    if (!doctorId || !date || !time) {
      return res.status(400).json({ error: 'doctorId, date, and time are required' });
    }
    
    // Check date validity (not past, not > 1 month)
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0,0,0,0);
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 1);
    
    if (selectedDate < today) {
      return res.status(400).json({ error: 'Cannot book appointments in the past' });
    }
    if (selectedDate > maxDate) {
      return res.status(400).json({ error: 'Bookings only allowed up to 1 month in advance' });
    }
    
    await client.query('BEGIN');
    
    // Get patient_id from account_id
    const patientResult = await client.query(
      `SELECT patient_id FROM "PATIENT" WHERE account_id = $1`,
      [accountId]
    );
    
    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    const patientId = patientResult.rows[0].patient_id;
    
    // Check if the session is available
    const { isSessionAvailable, getNextSerial } = require('../utils/schedule');
    const available = await isSessionAvailable(parseInt(doctorId), date, time, pool);
    if (!available) {
      return res.status(409).json({ error: 'This session is fully booked. Please choose another time.' });
    }
    
    // Get next serial number
    const serialNo = await getNextSerial(parseInt(doctorId), date, pool);
    
    // Insert appointment
    await client.query(
      `INSERT INTO "APPOINTMENT" (date, time, serial_no, status, doctor_id, patient_id)
       VALUES ($1, $2, $3, 'Scheduled', $4, $5)`,
      [date, time, serialNo, parseInt(doctorId), patientId]
    );
    
    await client.query('COMMIT');
    res.status(201).json({ 
      message: 'Appointment booked successfully', 
      serialNo,
      date,
      time,
      doctorId
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Book appointment error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});
// ==========================================
// GET /api/patient/tests
// ==========================================
router.get('/tests', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT test_id, name, cost FROM "TEST" ORDER BY name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Tests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// GET /api/patient/reports/pending
// ==========================================
router.get('/reports/pending', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.user;
    
    const result = await pool.query(
      `SELECT tr.report_id, t.name as test_name, tr.date, tr.status,
              d.first_name as doctor_first, d.last_name as doctor_last
       FROM "TEST_REPORT" tr
       JOIN "TEST" t ON tr.test_id = t.test_id
       JOIN "DOCTOR" d ON tr.doctor_id = d.doctor_id
       JOIN "PATIENT" p ON tr.patient_id = p.patient_id
       WHERE p.account_id = $1 AND tr.status = 'Pending'
       ORDER BY tr.date DESC`,
      [accountId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Pending reports error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// GET /api/patient/reports/past
// ==========================================
router.get('/reports/past', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.user;
    
    const result = await pool.query(
      `SELECT tr.report_id, t.name as test_name, tr.date, tr.result, tr.status,
              d.first_name as doctor_first, d.last_name as doctor_last
       FROM "TEST_REPORT" tr
       JOIN "TEST" t ON tr.test_id = t.test_id
       JOIN "DOCTOR" d ON tr.doctor_id = d.doctor_id
       JOIN "PATIENT" p ON tr.patient_id = p.patient_id
       WHERE p.account_id = $1 AND tr.status = 'Completed'
       ORDER BY tr.date DESC`,
      [accountId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Past reports error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// GET /api/patient/blood-requests
// ==========================================
// ==========================================
// GET /api/patient/blood-requests
// ==========================================
router.get('/blood-requests', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.user;
    
    const result = await pool.query(
      `SELECT br.request_id, br.blood_group_needed, br.units_needed, 
              br.request_date, br.need_date, br.status, br.patient_notes,
              p.first_name, p.last_name
       FROM "BLOOD_REQUEST" br
       JOIN "PATIENT" p ON br.patient_id = p.patient_id
       WHERE p.account_id = $1
       ORDER BY br.request_date DESC`,
      [accountId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Blood requests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// ==========================================
// PUT /api/patient/blood-requests/:id/cancel
// ==========================================
router.put('/blood-requests/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.user;
    const requestId = parseInt(req.params.id);
    
    // First, verify this blood request belongs to this patient
    const checkResult = await pool.query(
      `SELECT br.request_id, br.status
       FROM "BLOOD_REQUEST" br
       JOIN "PATIENT" p ON br.patient_id = p.patient_id
       WHERE br.request_id = $1 AND p.account_id = $2`,
      [requestId, accountId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Blood request not found' });
    }
    
    const request = checkResult.rows[0];
    
    // Check if already cancelled or confirmed
    if (request.status === 'Cancelled') {
      return res.status(400).json({ error: 'Request is already cancelled' });
    }
    
    if (request.status === 'Confirmed' || request.status === 'Fulfilled') {
      return res.status(400).json({ error: 'Cannot cancel a request that has already been confirmed' });
    }
    
    // Update status to Cancelled
    await pool.query(
      `UPDATE "BLOOD_REQUEST" SET status = 'Cancelled' WHERE request_id = $1`,
      [requestId]
    );
    
    res.json({ 
      message: 'Blood request cancelled successfully',
      request_id: requestId
    });
    
  } catch (err) {
    console.error('Cancel blood request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// ==========================================
// POST /api/patient/blood-requests
// ==========================================
router.post('/blood-requests', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.user;
    const { bloodGroup, units, needDate, patientNotes } = req.body;
    
    // Validate inputs
    if (!bloodGroup || !units || !needDate) {
      return res.status(400).json({ error: 'Blood group, units, and need date are required' });
    }
    
    // Validate units (minimum 1, maximum 5 per request)
    if (units < 1 || units > 5) {
      return res.status(400).json({ error: 'Units must be between 1 and 5' });
    }
    
    // Validate date (cannot be in the past)
    const today = new Date().toISOString().split('T')[0];
    if (needDate < today) {
      return res.status(400).json({ error: 'Need date cannot be in the past' });
    }
    
    // Get patient_id from account_id
    const patientResult = await pool.query(
      `SELECT patient_id FROM "PATIENT" WHERE account_id = $1`,
      [accountId]
    );
    
    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const patientId = patientResult.rows[0].patient_id;
    
    // Insert blood request with status 'Pending'
    const result = await pool.query(
      `INSERT INTO "BLOOD_REQUEST" 
       (blood_group_needed, units_needed, need_date, status, patient_id, patient_notes)
       VALUES ($1, $2, $3, 'Pending', $4, $5)
       RETURNING request_id, request_date`,
      [bloodGroup, units, needDate, patientId, patientNotes || '']
    );
    
    res.status(201).json({ 
      message: 'Blood request submitted successfully',
      request_id: result.rows[0].request_id,
      request_date: result.rows[0].request_date
    });
    
  } catch (err) {
    console.error('Blood request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// ==========================================
// GET /api/patient/ambulance-requests
// ==========================================
router.get('/ambulance-requests', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.user;
    
    const result = await pool.query(
      `SELECT ar.request_id, ar.pickup_location, ar.drop_location, 
              ar.request_time, ar.status, ar.patient_notes,
              p.first_name, p.last_name
       FROM "AMBULANCE_REQUEST" ar
       JOIN "PATIENT" p ON ar.patient_id = p.patient_id
       WHERE p.account_id = $1
       ORDER BY ar.request_time DESC`,
      [accountId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Ambulance requests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// POST /api/patient/ambulance-requests
// ==========================================
router.post('/ambulance-requests', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.user;
    const { pickupLocation, dropLocation, patientNotes } = req.body;
    
    // Validate inputs
    if (!pickupLocation || !dropLocation) {
      return res.status(400).json({ error: 'Pickup and drop locations are required' });
    }
    
    // Get patient_id from account_id
    const patientResult = await pool.query(
      `SELECT patient_id FROM "PATIENT" WHERE account_id = $1`,
      [accountId]
    );
    
    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const patientId = patientResult.rows[0].patient_id;
    
    // Insert ambulance request with status 'Pending'
    const result = await pool.query(
      `INSERT INTO "AMBULANCE_REQUEST" 
       (pickup_location, drop_location, status, patient_id, patient_notes)
       VALUES ($1, $2, 'Pending', $3, $4)
       RETURNING request_id, request_time`,
      [pickupLocation, dropLocation, patientId, patientNotes || '']
    );
    
    res.status(201).json({ 
      message: 'Ambulance request submitted successfully',
      request_id: result.rows[0].request_id,
      request_time: result.rows[0].request_time
    });
    
  } catch (err) {
    console.error('Ambulance request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// PUT /api/patient/ambulance-requests/:id/cancel
// ==========================================
router.put('/ambulance-requests/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.user;
    const requestId = parseInt(req.params.id);
    
    // Verify this request belongs to this patient
    const checkResult = await pool.query(
      `SELECT ar.request_id, ar.status
       FROM "AMBULANCE_REQUEST" ar
       JOIN "PATIENT" p ON ar.patient_id = p.patient_id
       WHERE ar.request_id = $1 AND p.account_id = $2`,
      [requestId, accountId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ambulance request not found' });
    }
    
    const request = checkResult.rows[0];
    
    // Check if already cancelled or accepted
    if (request.status === 'Cancelled') {
      return res.status(400).json({ error: 'Request is already cancelled' });
    }
    
    if (request.status === 'Accepted' || request.status === 'En Route' || request.status === 'Completed') {
      return res.status(400).json({ error: 'Cannot cancel a request that is already in progress' });
    }
    
    // Update status to Cancelled
    await pool.query(
      `UPDATE "AMBULANCE_REQUEST" SET status = 'Cancelled' WHERE request_id = $1`,
      [requestId]
    );
    
    res.json({ 
      message: 'Ambulance request cancelled successfully',
      request_id: requestId
    });
    
  } catch (err) {
    console.error('Cancel ambulance request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// GET /api/patient/admissions
// ==========================================
router.get('/admissions', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.user;
    
    const result = await pool.query(
      `SELECT ipd.ipd_id, ipd.bed_number, ipd.type, ipd.fee_per_day,
              ipd.status, ipd.admission_date, ipd.discharge_date
       FROM "IPD" ipd
       JOIN "PATIENT" p ON ipd.patient_id = p.patient_id
       WHERE p.account_id = $1
       ORDER BY ipd.admission_date DESC`,
      [accountId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Admissions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;