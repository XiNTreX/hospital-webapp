const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const verifyToken = require('../middleware/auth');
require('dotenv').config();

// POST: /api/auth/register
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password, role, dob, gender, phone, bloodGroup, licenseNo } = req.body;
  const client = await pool.connect();

  // Security check: Only allow PATIENT, BLOOD_DONOR, and DRIVER to register via public form
  if (!['PATIENT', 'BLOOD_DONOR', 'DRIVER'].includes(role)) {
    return res.status(400).json({ error: 'Invalid registration role.' });
  }

  try {
    await client.query('BEGIN'); // Start transaction

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 1. Insert into USER_ACCOUNT with the dynamic role
    const userResult = await client.query(
      `INSERT INTO "USER_ACCOUNT" (email, password_hash, user_type) 
       VALUES ($1, $2, $3) 
       RETURNING account_id`,
      [email, hashedPassword, role]
    );
    
    const accountId = userResult.rows[0].account_id;

    // 2. Insert into the specific profile table based on the role
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
    } else if (role === 'DRIVER') {
      await client.query(
        `INSERT INTO "DRIVER" (first_name, last_name, license_no, phone, status, account_id) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [firstName, lastName, licenseNo, phone, 'Available', accountId]
      );
    }

    await client.query('COMMIT'); // Lock in transaction
    
    const roleLabels = { PATIENT: 'Patient', BLOOD_DONOR: 'Blood Donor', DRIVER: 'Ambulance Driver' };
    res.status(201).json({ message: `${roleLabels[role]} registered successfully!` });

  } catch (err) {
    await client.query('ROLLBACK'); // Cancel transaction if any step fails
    console.error('Registration Error:', err.message);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email or License Number already exists.' });
    }
    res.status(500).json({ error: 'Server error during registration.' });
  } finally {
    client.release();
  }
});

// POST: /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM "USER_ACCOUNT" WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const payload = {
      accountId: user.account_id,
      role: user.user_type
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        accountId: user.account_id,
        role: user.user_type
      }
    });

  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: 'Server error during login.' });
  }
});
// POST /api/auth/logout
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // Extract the token from the header (verifyToken already confirmed it exists)
    const authHeader = req.headers['authorization'];
    const token = authHeader.split(' ')[1];

    // Insert token into the blacklist table
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