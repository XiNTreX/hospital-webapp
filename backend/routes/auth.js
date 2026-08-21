const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // Notice the '../' to go up one folder

const router = express.Router();

// POST: /api/auth/register
// POST: /api/auth/register
router.post('/register', async (req, res) => {
  // We extract all possible fields, including the new role, phone, and bloodGroup
  const { firstName, lastName, email, password, role, dob, gender, phone, bloodGroup } = req.body;
  const client = await pool.connect();

  // Security check: Only allow these two roles to register via the public form
  if (!['PATIENT', 'BLOOD_DONOR'].includes(role)) {
    return res.status(400).json({ error: 'Invalid registration role.' });
  }

  try {
    await client.query('BEGIN');

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
    }

    await client.query('COMMIT');
    
    // Format the success message beautifully
    const roleName = role === 'PATIENT' ? 'Patient' : 'Blood Donor';
    res.status(201).json({ message: `${roleName} registered successfully!` });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Registration Error:', err.message);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists.' });
    }
    res.status(500).json({ error: 'Server error during registration.' });
  } finally {
    client.release();
  }
});

// POST: /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const userResult = await pool.query(
      `SELECT * FROM "USER_ACCOUNT" WHERE email = $1 AND user_type = $2`,
      [email, role]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email, password, or role.' });
    }

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email, password, or role.' });
    }

    const token = jwt.sign(
      { accountId: user.account_id, role: user.user_type }, 
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ 
      message: 'Logged in successfully!',
      token: token,
      role: user.user_type
    });

  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

module.exports = router;