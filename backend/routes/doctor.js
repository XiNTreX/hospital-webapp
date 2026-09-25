const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// ==========================================
// GET /api/doctor/profile
// ==========================================
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT doctor_id, account_id, first_name, last_name, specialization, room_number, photo_url, doctor_type 
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
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
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

// ==========================================
// GET /api/doctor/medicines
// ==========================================
router.get('/medicines', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "MEDICINE" ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching medicines' });
  }
});

// ==========================================
// GET /api/doctor/tests
// ==========================================
router.get('/tests', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "TEST" ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching tests' });
  }
});

// ==========================================
// GET /api/doctor/appointments/:id
// ==========================================
// ==========================================
// GET /api/doctor/appointments/:id
// ==========================================
router.get('/appointments/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.appointment_id, a.date, a.time, a.patient_id, 
             p.first_name, p.last_name, p.dob, p.gender, p.blood_group
      FROM "APPOINTMENT" a
      JOIN "PATIENT" p ON a.patient_id = p.patient_id
      JOIN "DOCTOR" d ON a.doctor_id = d.doctor_id
      WHERE a.appointment_id = $1 AND d.account_id = $2
    `, [req.params.id, req.user.accountId]); // <-- SECURITY FIX
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found or unauthorized' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching appointment details' });
  }
});

// ==========================================
// POST /api/doctor/prescriptions
// ==========================================
router.post('/prescriptions', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { appointment_id, patient_id, diagnosis, advice, medicines, tests } = req.body;

    const docRes = await client.query(
      'SELECT doctor_id FROM "DOCTOR" WHERE account_id = $1', 
      [req.user.accountId]
    );
    const doctor_id = docRes.rows[0].doctor_id;
    const aptCheck = await client.query(
      `SELECT appointment_id FROM "APPOINTMENT" WHERE appointment_id = $1 AND doctor_id = $2`,
      [appointment_id, doctor_id]
    );
    if (aptCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Unauthorized: This appointment belongs to another doctor.' });
    }
    // 1. Insert Prescription
    const presRes = await client.query(
      `INSERT INTO "PRESCRIPTION" (date, diagnosis, advice, doctor_id, patient_id, appointment_id)
       VALUES ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date, $1, $2, $3, $4, $5) RETURNING prescription_id`,
      [diagnosis || '', advice || '', doctor_id, patient_id, appointment_id]
    );
    const prescription_id = presRes.rows[0].prescription_id;

    // 2. Insert Medicines
    if (medicines && medicines.length > 0) {
      for (let med of medicines) {
        await client.query(
          `INSERT INTO "PRESCRIPTION_MEDICINE" (frequency, duration, before_after_meal, prescription_id, medicine_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [med.frequency, med.duration, med.before_after_meal, prescription_id, med.medicine_id]
        );
      }
    }

    // 3. Insert Tests into TEST_REPORT
    if (tests && tests.length > 0) {
      for (let testId of tests) {
        await client.query(
          `INSERT INTO "TEST_REPORT" (date, status, doctor_id, patient_id, test_id)
           VALUES ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date, 'Pending', $1, $2, $3)`,
          [doctor_id, patient_id, testId]
        );
      }
    }

    // 4. Update Appointment Status
    await client.query(
      `UPDATE "APPOINTMENT" SET status = 'Completed' WHERE appointment_id = $1`,
      [appointment_id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Prescription saved successfully!' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Prescription error:', err);
    res.status(500).json({ error: 'Failed to save prescription' });
  } finally {
    client.release();
  }
});

// ==========================================
// GET /api/doctor/prescriptions/:appointmentId
// ==========================================
router.get('/prescriptions/:appointmentId', verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { accountId } = req.user;

    const presRes = await pool.query(
      `SELECT pr.*, p.first_name as pat_first, p.last_name as pat_last, p.gender, 
              EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) AS age
       FROM "PRESCRIPTION" pr
       JOIN "PATIENT" p ON pr.patient_id = p.patient_id
       JOIN "DOCTOR" d ON pr.doctor_id = d.doctor_id
       WHERE pr.appointment_id = $1 AND d.account_id = $2`,
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

    res.json({ ...prescription, medicines: medRes.rows, tests: testRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// GET /api/doctor/records (Fetch unique past patients)
// ==========================================
router.get('/records', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.patient_id, p.first_name, p.last_name, p.gender, 
              EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) AS age,
              MAX(a.date) as last_visit
       FROM "APPOINTMENT" a
       JOIN "PATIENT" p ON a.patient_id = p.patient_id
       JOIN "DOCTOR" d ON a.doctor_id = d.doctor_id
       WHERE d.account_id = $1 AND a.status = 'Completed'
       GROUP BY p.patient_id, p.first_name, p.last_name, p.gender, p.dob
       ORDER BY last_visit DESC`,
      [req.user.accountId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching patient records:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// GET /api/doctor/patients/:patientId/prescriptions
// ==========================================
router.get('/patients/:patientId/prescriptions', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { accountId } = req.user;

    const presRes = await pool.query(
      `SELECT pr.prescription_id, pr.date, pr.diagnosis, pr.advice
       FROM "PRESCRIPTION" pr
       JOIN "DOCTOR" d ON pr.doctor_id = d.doctor_id
       WHERE pr.patient_id = $1 AND d.account_id = $2
       ORDER BY pr.date DESC`,
      [patientId, accountId]
    );

    const prescriptions = [];
    for (let p of presRes.rows) {
      const medRes = await pool.query(
        `SELECT pm.frequency, pm.duration, pm.before_after_meal, m.name, m.dosage
         FROM "PRESCRIPTION_MEDICINE" pm
         JOIN "MEDICINE" m ON pm.medicine_id = m.medicine_id
         WHERE pm.prescription_id = $1`,
        [p.prescription_id]
      );
      p.medicines = medRes.rows;
      prescriptions.push(p);
    }
    res.json(prescriptions);
  } catch (err) {
    console.error('Error fetching prescriptions:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// GET /api/doctor/patients/:patientId/tests
// ==========================================
router.get('/patients/:patientId/tests', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const testsRes = await pool.query(
      `SELECT tr.report_id, tr.status, tr.date, tr.remarks, t.name AS test_name
       FROM "TEST_REPORT" tr
       JOIN "TEST" t ON tr.test_id = t.test_id
       WHERE tr.patient_id = $1
       ORDER BY tr.date DESC`,
      [patientId]
    );

    const reportsWithDetails = [];
    for (let report of testsRes.rows) {
      if (report.status === 'Completed') {
        const detailsRes = await pool.query(
          `SELECT tp.parameter_name, tp.normal_range, trd.result_value
           FROM "TEST_REPORT_DETAIL" trd
           JOIN "TEST_PARAMETER" tp ON trd.parameter_id = tp.parameter_id
           WHERE trd.report_id = $1`,
          [report.report_id]
        );
        report.parameters = detailsRes.rows;
      } else {
        report.parameters = [];
      }
      reportsWithDetails.push(report);
    }
    res.json(reportsWithDetails);
  } catch (err) {
    console.error('Error fetching tests:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// GET /api/doctor/lab-queue (Fetch specimens ready for processing)
// ==========================================
router.get('/lab-queue', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tr.report_id, tr.date, tr.status, 
              t.test_id, t.name AS test_name, 
              p.first_name, p.last_name, p.gender, EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) AS age
       FROM "TEST_REPORT" tr
       JOIN "TEST" t ON tr.test_id = t.test_id
       JOIN "PATIENT" p ON tr.patient_id = p.patient_id
       JOIN "DOCTOR" d ON tr.doctor_id = d.doctor_id
       WHERE tr.status = 'Specimen Received'
       ORDER BY tr.date ASC`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching lab queue:', err);
    res.status(500).json({ error: 'Server error fetching lab queue' });
  }
});

// ==========================================
// GET /api/doctor/lab-tests/:testId/parameters
// ==========================================
router.get('/lab-tests/:testId/parameters', verifyToken, async (req, res) => {
  try {
    const { testId } = req.params;
    const result = await pool.query(
      `SELECT parameter_id, parameter_name, normal_range 
       FROM "TEST_PARAMETER" 
       WHERE test_id = $1`,
      [testId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching test parameters:', err);
    res.status(500).json({ error: 'Server error fetching parameters' });
  }
});

// ==========================================
// POST /api/doctor/lab-tests/submit
// ==========================================
router.post('/lab-tests/submit', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { report_id, remarks, results } = req.body;

    const docRes = await client.query(
      `SELECT doctor_id FROM "DOCTOR" WHERE account_id = $1`,
      [req.user.accountId]
    );
    if (docRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Doctor profile not found' });
    }
    const labDoctorId = docRes.rows[0].doctor_id;

    for (const item of results) {
      await client.query(
        `INSERT INTO "TEST_REPORT_DETAIL" (report_id, parameter_id, result_value) 
         VALUES ($1, $2, $3)`,
        [report_id, item.parameter_id, item.result_value]
      );
    }

    await client.query(
      `UPDATE "TEST_REPORT" 
       SET status = 'Completed', remarks = $1, lab_doctor_id = $2 
       WHERE report_id = $3`,
      [remarks, labDoctorId, report_id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Lab test results submitted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error submitting lab report:', err);
    res.status(500).json({ error: 'Server error submitting report' });
  }
});

module.exports = router;