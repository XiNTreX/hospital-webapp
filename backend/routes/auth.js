const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');
require('dotenv').config();

// ==========================================
// POST /api/auth/register
// ==========================================
router.post('/register', async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    role,
    dob,
    gender,
    phone,
    bloodGroup,
    licenseNo,
    agreedToTerms,
  } = req.body;

  // 🔒 Terms gate — server-side enforcement
  if (agreedToTerms !== true) {
    return res.status(400).json({
      error: 'You must agree to the Terms & Conditions to create an account.',
    });
  }

  // Security check: only allow PATIENT, BLOOD_DONOR, DRIVER via public form
  if (!['PATIENT', 'BLOOD_DONOR', 'DRIVER'].includes(role)) {
    return res.status(400).json({ error: 'Invalid registration role.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const hashedPassword = await bcrypt.hash(password, 10);

    // ---------- DRIVER: route to approval queue ----------
    if (role === 'DRIVER') {
      const dup = await client.query(
        `SELECT 1 FROM "USER_ACCOUNT" WHERE email = $1
         UNION
         SELECT 1 FROM "DRIVER_SIGNUP_REQUEST" WHERE email = $1 AND status = 'Pending'`,
        [email]
      );
      if (dup.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'An account or pending request already exists for this email.',
        });
      }

      await client.query(
        `INSERT INTO "DRIVER_SIGNUP_REQUEST"
           (first_name, last_name, email, password_hash, license_no, phone)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [firstName, lastName, email, hashedPassword, licenseNo, phone]
      );

      await client.query('COMMIT');
      return res.status(201).json({
        message:
          'Your driver account request has been submitted. Please wait for admin approval.',
        pendingApproval: true,
      });
    }

    // ---------- PATIENT / BLOOD_DONOR: normal flow ----------
    const userResult = await client.query(
      `INSERT INTO "USER_ACCOUNT" (email, password_hash, user_type)
       VALUES ($1, $2, $3)
       RETURNING account_id`,
      [email, hashedPassword, role]
    );
    const accountId = userResult.rows[0].account_id;

    if (role === 'PATIENT') {
      await client.query(
        `INSERT INTO "PATIENT" (first_name, last_name, dob, gender, account_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [firstName, lastName, dob, gender, accountId]
      );
    } else if (role === 'BLOOD_DONOR') {
      await client.query(
        `INSERT INTO "BLOOD_DONOR" (first_name, last_name, email, phone, blood_group, account_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [firstName, lastName, email, phone, bloodGroup, accountId]
      );
    }

    await client.query('COMMIT');
    const roleLabels = { PATIENT: 'Patient', BLOOD_DONOR: 'Blood Donor' };
    res.status(201).json({ message: `${roleLabels[role]} registered successfully!` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Registration Error:', err.message);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email or License Number already exists.' });
    }
    res.status(500).json({ error: 'Server error during registration.' });
  } finally {
    client.release();
  }
});

// ==========================================
// POST /api/auth/login
// ==========================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM "USER_ACCOUNT" WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      // Is this a pending/rejected driver signup?
      const pending = await pool.query(
        `SELECT status, rejection_reason FROM "DRIVER_SIGNUP_REQUEST" WHERE email = $1`,
        [email]
      );

      if (pending.rows.length > 0) {
        const reqRow = pending.rows[0];
        if (reqRow.status === 'Pending') {
          return res.status(403).json({
            error: 'Your driver account request is waiting for admin approval.',
            pendingApproval: true,
          });
        }
        if (reqRow.status === 'Rejected') {
          return res.status(403).json({
            error: `Your driver account request was rejected.${
              reqRow.rejection_reason ? ' Reason: ' + reqRow.rejection_reason : ''
            }`,
            rejected: true,
          });
        }
      }
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const payload = {
      accountId: user.account_id,
      role: user.user_type,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        accountId: user.account_id,
        role: user.user_type,
      },
    });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// ==========================================
// POST /api/auth/logout
// ==========================================
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader.split(' ')[1];

    await pool.query(
      `INSERT INTO "TOKEN_BLACKLIST" (token) VALUES ($1) ON CONFLICT DO NOTHING`,
      [token]
    );

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Server error during logout' });
  }
});

module.exports = router;