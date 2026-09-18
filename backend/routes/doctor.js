const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

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
router.get('/appointments/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.appointment_id, a.date, a.time, a.patient_id, 
             p.first_name, p.last_name, p.dob, p.gender, p.blood_group
      FROM "APPOINTMENT" a
      JOIN "PATIENT" p ON a.patient_id = p.patient_id
      WHERE a.appointment_id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
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

    // Get doctor_id for the logged-in account
    const docRes = await client.query(
      'SELECT doctor_id FROM "DOCTOR" WHERE account_id = $1', 
      [req.user.accountId]
    );
    const doctor_id = docRes.rows[0].doctor_id;

    // 1. Insert Prescription (Linked to appointment)
    const presRes = await client.query(
      `INSERT INTO "PRESCRIPTION" (date, diagnosis, advice, doctor_id, patient_id, appointment_id)
       VALUES (CURRENT_DATE, $1, $2, $3, $4, $5) RETURNING prescription_id`,
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
           VALUES (CURRENT_DATE, 'Pending', $1, $2, $3)`,
          [doctor_id, patient_id, testId]
        );
      }
    }

    // 4. Update Appointment Status to 'Completed'
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
// GET /api/doctor/records (Fetch all past patients)
// ==========================================
router.get('/records', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.appointment_id, a.date, p.first_name, p.last_name, p.gender, 
              EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) AS age
       FROM "APPOINTMENT" a
       JOIN "PATIENT" p ON a.patient_id = p.patient_id
       JOIN "DOCTOR" d ON a.doctor_id = d.doctor_id
       WHERE d.account_id = $1 AND a.status = 'Completed'
       ORDER BY a.date DESC`,
      [req.user.accountId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
// ==========================================
// GET /api/doctor/pending-tests
// ==========================================
router.get('/pending-tests', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tr.report_id, tr.date, tr.status, 
              t.name AS test_name, 
              p.first_name, p.last_name, p.gender, EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) AS age
       FROM "TEST_REPORT" tr
       JOIN "TEST" t ON tr.test_id = t.test_id
       JOIN "PATIENT" p ON tr.patient_id = p.patient_id
       JOIN "DOCTOR" d ON tr.doctor_id = d.doctor_id
       WHERE d.account_id = $1 AND tr.status = 'Pending'
       ORDER BY tr.date DESC`,
      [req.user.accountId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching pending tests:', err);
    res.status(500).json({ error: 'Server error fetching tests' });
  }
});

// ==========================================
// POST /api/doctor/tests/result
// ==========================================
router.post('/tests/result', verifyToken, async (req, res) => {
  try {
    const { report_id, result_text } = req.body;
    await pool.query(
      `UPDATE "TEST_REPORT" 
       SET result = $1, status = 'Completed' 
       WHERE report_id = $2`,
      [result_text, report_id]
    );
    res.json({ message: 'Test result saved successfully' });
  } catch (err) {
    console.error('Error saving test result:', err);
    res.status(500).json({ error: 'Server error saving result' });
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
// GET /api/doctor/lab-tests/:testId/parameters (Fetch parameters for a test)
// ==========================================
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
// POST /api/doctor/lab-tests/submit (Submit structured report results)
// ==========================================
router.post('/lab-tests/submit', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { report_id, remarks, results } = req.body; // results is an array of { parameter_id, result_value }

    // 1. Get doctor_id from account_id
    const docRes = await client.query(
      `SELECT doctor_id FROM "DOCTOR" WHERE account_id = $1`,
      [req.user.accountId]
    );
    if (docRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Doctor profile not found' });
    }
    const labDoctorId = docRes.rows[0].doctor_id;

    // 2. Insert each parameter result into TEST_REPORT_DETAIL
    for (const item of results) {
      await client.query(
        `INSERT INTO "TEST_REPORT_DETAIL" (report_id, parameter_id, result_value) 
         VALUES ($1, $2, $3)`,
        [report_id, item.parameter_id, item.result_value]
      );
    }

    // 3. Update TEST_REPORT status, remarks, and lab_doctor_id
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
// ==========================================
// GET /api/doctor/records/:appointmentId/tests
// ==========================================
// ==========================================
// GET /api/doctor/records/:appointmentId/tests
// ==========================================
router.get('/records/:appointmentId/tests', verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    // 1. Get the patient_id from the appointment
    const aptRes = await pool.query(
      `SELECT patient_id FROM "APPOINTMENT" WHERE appointment_id = $1`,
      [appointmentId]
    );
    if (aptRes.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
    const { patient_id } = aptRes.rows[0];

    // 2. Fetch all test reports for this patient ordered by date
    const testsRes = await pool.query(
      `SELECT tr.report_id, tr.status, tr.date, tr.remarks, t.name AS test_name
       FROM "TEST_REPORT" tr
       JOIN "TEST" t ON tr.test_id = t.test_id
       WHERE tr.patient_id = $1
       ORDER BY tr.date DESC`,
      [patient_id]
    );

    // 3. For each test report that is completed, fetch its detailed parameters
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
    console.error('Error fetching record tests:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
module.exports = router;