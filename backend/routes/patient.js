const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { todayDhaka, oneMonthFromTodayDhaka, daysBetween } = require('../utils/dhakaTime');

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
// ==========================================
router.get('/appointments/slots', verifyToken, async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ error: 'doctorId and date are required' });
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 1);

    if (selectedDate < today) {
      return res.status(400).json({ error: 'Cannot book appointments in the past' });
    }
    if (selectedDate > maxDate) {
      return res.status(400).json({ error: 'Bookings only allowed up to 1 month in advance' });
    }

    const { getAvailableSessions } = require('../utils/schedule');
    const sessions = await getAvailableSessions(parseInt(doctorId), date, pool);

    res.json({ doctorId: parseInt(doctorId), date, sessions });
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
    const today = todayDhaka();

    const result = await pool.query(
      `SELECT a.appointment_id, a.date, a.time, a.serial_no, a.status,
              a.doctor_id,
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

    const result = await pool.query(
      `SELECT a.appointment_id, a.date, a.time, a.serial_no, a.status,
              a.doctor_id,
              d.first_name as doctor_first, d.last_name as doctor_last,
              d.specialization, d.photo_url
       FROM "APPOINTMENT" a
       JOIN "DOCTOR" d ON a.doctor_id = d.doctor_id
       JOIN "PATIENT" p ON a.patient_id = p.patient_id
       WHERE p.account_id = $1
         AND a.status = 'Completed'
       ORDER BY a.date DESC, a.time DESC`,
      [accountId]
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

    const today = todayDhaka();
    if (appointment.date < today) {
      return res.status(400).json({ error: 'Cannot cancel past appointments' });
    }

    if (appointment.status === 'Cancelled') {
      return res.status(400).json({ error: 'Appointment is already cancelled' });
    }

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
router.post('/appointments/book', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { accountId } = req.user;
    const { doctorId, date, time } = req.body;

    if (!doctorId || !date || !time) {
      return res.status(400).json({ error: 'doctorId, date, and time are required' });
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 1);

    if (selectedDate < today) {
      return res.status(400).json({ error: 'Cannot book appointments in the past' });
    }
    if (selectedDate > maxDate) {
      return res.status(400).json({ error: 'Bookings only allowed up to 1 month in advance' });
    }

    await client.query('BEGIN');

    const patientResult = await client.query(
      `SELECT patient_id FROM "PATIENT" WHERE account_id = $1`,
      [accountId]
    );

    if (patientResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Patient not found' });
    }
    const patientId = patientResult.rows[0].patient_id;

    const existingAppointment = await client.query(
      `SELECT appointment_id FROM "APPOINTMENT"
       WHERE patient_id = $1 AND doctor_id = $2 AND status = 'Scheduled'`,
      [patientId, parseInt(doctorId)]
    );

    if (existingAppointment.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'You already have an active appointment scheduled with this doctor. Please cancel or reschedule your existing appointment before booking a new one.'
      });
    }

    const { isSessionAvailable, getNextSerial } = require('../utils/schedule');
    const available = await isSessionAvailable(parseInt(doctorId), date, time, pool);
    if (!available) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This session is fully booked. Please choose another time.' });
    }

    const serialNo = await getNextSerial(parseInt(doctorId), date, pool);

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
    const result = await pool.query('SELECT * FROM "TEST" ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch tests error:', err);
    res.status(500).json({ error: 'Failed to fetch medical tests' });
  }
});

// ==========================================
// PUT /api/patient/appointments/:id/reschedule
// ==========================================
router.put('/appointments/:id/reschedule', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { accountId } = req.user;
    const appointmentId = parseInt(req.params.id);
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({ error: 'Date and time are required for rescheduling' });
    }

    const today = todayDhaka();
    const maxDate = oneMonthFromTodayDhaka();

    if (daysBetween(today, date) > 0) {
      return res.status(400).json({ error: 'Cannot book appointments in the past' });
    }
    if (daysBetween(date, maxDate) > 0) {
      return res.status(400).json({ error: 'Bookings only allowed up to 1 month in advance' });
    }

    await client.query('BEGIN');

    const aptResult = await client.query(
      `SELECT a.appointment_id, a.doctor_id, a.status
       FROM "APPOINTMENT" a
       JOIN "PATIENT" p ON a.patient_id = p.patient_id
       WHERE a.appointment_id = $1 AND p.account_id = $2`,
      [appointmentId, accountId]
    );

    if (aptResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = aptResult.rows[0];
    if (appointment.status !== 'Scheduled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Can only reschedule active scheduled appointments' });
    }

    const doctorId = appointment.doctor_id;

    const { isSessionAvailable } = require('../utils/schedule');
    const available = await isSessionAvailable(doctorId, date, time, pool);
    if (!available) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This time slot is fully booked. Please choose another time.' });
    }

    await client.query(
      `UPDATE "APPOINTMENT" SET date = $1, time = $2 WHERE appointment_id = $3`,
      [date, time, appointmentId]
    );

    await client.query('COMMIT');
    res.json({
      message: 'Appointment rescheduled successfully',
      appointment_id: appointmentId,
      date,
      time
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Reschedule appointment error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// ==========================================
// GET /api/patient/reports/pending
// ==========================================
router.get('/reports/pending', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tr.report_id, tr.date, tr.status,
              t.name AS test_name,
              d.first_name AS doc_first, d.last_name AS doc_last
       FROM "TEST_REPORT" tr
       JOIN "TEST" t ON tr.test_id = t.test_id
       JOIN "DOCTOR" d ON tr.doctor_id = d.doctor_id
       JOIN "PATIENT" p ON tr.patient_id = p.patient_id
       WHERE p.account_id = $1 AND tr.status IN ('Pending', 'Prescribed', 'Specimen Received')
       ORDER BY tr.date DESC`,
      [req.user.accountId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching pending reports:', err);
    res.status(500).json({ error: 'Server error fetching pending reports' });
  }
});

// ==========================================
// GET /api/patient/reports/past
// ==========================================
router.get('/reports/past', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tr.report_id, tr.date, tr.result,
              t.name AS test_name,
              d.first_name AS doc_first, d.last_name AS doc_last, d.specialization
       FROM "TEST_REPORT" tr
       JOIN "TEST" t ON tr.test_id = t.test_id
       JOIN "DOCTOR" d ON tr.doctor_id = d.doctor_id
       JOIN "PATIENT" p ON tr.patient_id = p.patient_id
       WHERE p.account_id = $1 AND tr.status = 'Completed'
       ORDER BY tr.date DESC`,
      [req.user.accountId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching past reports:', err);
    res.status(500).json({ error: 'Server error fetching reports' });
  }
});

// ==========================================
// POST /api/patient/reports/submit-specimen
// ==========================================
router.post('/reports/submit-specimen', verifyToken, async (req, res) => {
  try {
    const { report_id } = req.body;
    await pool.query(
      `UPDATE "TEST_REPORT" SET status = 'Specimen Received' WHERE report_id = $1`,
      [report_id]
    );
    res.json({ message: 'Specimen submitted successfully' });
  } catch (err) {
    console.error('Error submitting specimen:', err);
    res.status(500).json({ error: 'Server error submitting specimen' });
  }
});

// ==========================================
// GET /api/patient/reports/:reportId/details
// ==========================================
router.get('/reports/:reportId/details', verifyToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    const result = await pool.query(
      `SELECT tp.parameter_name, tp.normal_range, trd.result_value
       FROM "TEST_REPORT_DETAIL" trd
       JOIN "TEST_PARAMETER" tp ON trd.parameter_id = tp.parameter_id
       WHERE trd.report_id = $1`,
      [reportId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching report details:', err);
    res.status(500).json({ error: 'Server error fetching details' });
  }
});

// ==========================================
// GET /api/patient/blood-requests
// Includes units_pending and a computed "days_left" hint.
// ==========================================
router.get('/blood-requests', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.user;
    const today = todayDhaka();

    const result = await pool.query(
      `SELECT br.request_id, br.blood_group_needed, br.units_needed,
              br.units_pledged, br.units_fulfilled,
              COALESCE(br.units_pending, 0) AS units_pending,
              br.request_date, br.need_date, br.status, br.patient_notes,
              p.first_name, p.last_name
       FROM "BLOOD_REQUEST" br
       JOIN "PATIENT" p ON br.patient_id = p.patient_id
       WHERE p.account_id = $1
       ORDER BY br.request_date DESC`,
      [accountId]
    );

    // Annotate days_left so the frontend doesn't need to recompute it
    const rows = result.rows.map((r) => {
      const need = r.need_date instanceof Date
        ? r.need_date.toISOString().split('T')[0]
        : String(r.need_date).split('T')[0];
      return {
        ...r,
        need_date: need,
        days_left: daysBetween(need, today) * -1, // positive = days remaining
      };
    });

    res.json(rows);
  } catch (err) {
    console.error('Blood requests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// PUT /api/patient/blood-requests/:id/extend
// Body: { needDate: 'YYYY-MM-DD' }
// ==========================================
router.put('/blood-requests/:id/extend', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.user;
    const requestId = parseInt(req.params.id);
    const { needDate } = req.body;

    if (!needDate) {
      return res.status(400).json({ error: 'New need date is required.' });
    }

    const today = todayDhaka();
    if (needDate < today) {
      return res.status(400).json({ error: 'New need date cannot be in the past.' });
    }

    // Verify ownership
    const check = await pool.query(
      `SELECT br.request_id, br.status
       FROM "BLOOD_REQUEST" br
       JOIN "PATIENT" p ON br.patient_id = p.patient_id
       WHERE br.request_id = $1 AND p.account_id = $2`,
      [requestId, accountId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Blood request not found.' });
    }
    if (check.rows[0].status !== 'Pending') {
      return res.status(400).json({
        error: 'Only pending requests can have their deadline extended.',
      });
    }

    await pool.query(
      `UPDATE "BLOOD_REQUEST" SET need_date = $1 WHERE request_id = $2`,
      [needDate, requestId]
    );

    res.json({ message: 'Deadline extended successfully.', need_date: needDate });
  } catch (err) {
    console.error('Extend request error:', err);
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

    const checkResult = await pool.query(
      `SELECT br.request_id, br.status, br.units_pledged
       FROM "BLOOD_REQUEST" br
       JOIN "PATIENT" p ON br.patient_id = p.patient_id
       WHERE br.request_id = $1 AND p.account_id = $2`,
      [requestId, accountId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Blood request not found' });
    }

    const r = checkResult.rows[0];

    if (r.status === 'Cancelled') {
      return res.status(400).json({ error: 'Request is already cancelled' });
    }
    if (r.status === 'Fulfilled') {
      return res.status(400).json({ error: 'Request is already fulfilled' });
    }
    if (r.status === 'Expired') {
      return res.status(400).json({ error: 'Request has expired' });
    }
    if (r.units_pledged > 0) {
      return res.status(400).json({
        error: `${r.units_pledged} donation(s) already pledged by donors. Contact support to cancel.`
      });
    }

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

    if (!bloodGroup || !units || !needDate) {
      return res.status(400).json({ error: 'Blood group, units, and need date are required' });
    }

    if (units < 1 || units > 5) {
      return res.status(400).json({ error: 'Units must be between 1 and 5' });
    }

    const today = todayDhaka();
    if (needDate < today) {
      return res.status(400).json({ error: 'Need date cannot be in the past' });
    }

    const patientResult = await pool.query(
      `SELECT patient_id FROM "PATIENT" WHERE account_id = $1`,
      [accountId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientId = patientResult.rows[0].patient_id;

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

    if (!pickupLocation || !dropLocation) {
      return res.status(400).json({ error: 'Pickup and drop locations are required' });
    }

    const patientResult = await pool.query(
      `SELECT patient_id FROM "PATIENT" WHERE account_id = $1`,
      [accountId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientId = patientResult.rows[0].patient_id;

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

    if (request.status !== 'Pending') {
      return res.status(400).json({
        error: request.status === 'Cancelled'
          ? 'Request is already cancelled'
          : 'A driver has already accepted this ride. It can no longer be cancelled.'
      });
    }

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

// ==========================================
// GET /api/patient/prescriptions/:appointmentId
// ==========================================
router.get('/prescriptions/:appointmentId', verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { accountId } = req.user;

    const presRes = await pool.query(
      `SELECT pr.*, d.first_name as doc_first, d.last_name as doc_last, d.specialization
       FROM "PRESCRIPTION" pr
       JOIN "DOCTOR" d ON pr.doctor_id = d.doctor_id
       JOIN "PATIENT" p ON pr.patient_id = p.patient_id
       WHERE pr.appointment_id = $1 AND p.account_id = $2`,
      [appointmentId, accountId]
    );

    if (presRes.rows.length === 0) return res.status(404).json({ error: 'Prescription not found' });
    const prescription = presRes.rows[0];

    const medRes = await pool.query(
      `SELECT pm.frequency, pm.duration, pm.before_after_meal, m.name, m.dosage
       FROM "PRESCRIPTION_MEDICINE" pm
       JOIN "MEDICINE" m ON pm.medicine_id = m.medicine_id
       WHERE pm.prescription_id = $1`,
      [prescription.prescription_id]
    );

    const testRes = await pool.query(
      `SELECT t.name FROM "TEST_REPORT" tr
       JOIN "TEST" t ON tr.test_id = t.test_id
       WHERE tr.patient_id = $1 AND tr.doctor_id = $2 AND tr.date = $3`,
      [prescription.patient_id, prescription.doctor_id, prescription.date]
    );

    res.json({
      ...prescription,
      medicines: medRes.rows,
      tests: testRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;