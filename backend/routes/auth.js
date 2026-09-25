const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');
require('dotenv').config();

// ==========================================
// Blood Compatibility Helper
// ==========================================
const CAN_DONATE_TO = {
  'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+':  ['O+', 'A+', 'B+', 'AB+'],
  'A-':  ['A-', 'A+', 'AB-', 'AB+'],
  'A+':  ['A+', 'AB+'],
  'B-':  ['B-', 'B+', 'AB-', 'AB+'],
  'B+':  ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
};

function isCompatible(donorBG, neededBG) {
  return (CAN_DONATE_TO[donorBG] || []).includes(neededBG);
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ==========================================
// GET /api/auth/invite/:token
// ==========================================
router.get('/invite/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!UUID_REGEX.test(token)) {
      return res.status(400).json({ valid: false, error: 'Invalid invite link format.' });
    }

    const result = await pool.query(
      `SELECT er.invite_token, er.is_claimed,
              br.request_id, br.blood_group_needed, br.units_needed, br.units_pledged,
              br.need_date, br.status AS request_status,
              ref.first_name AS referrer_first_name, ref.last_name AS referrer_last_name
       FROM "EXTERNAL_REFERRAL" er
       JOIN "BLOOD_REQUEST" br ON er.request_id = br.request_id
       JOIN "BLOOD_DONOR" ref ON er.referrer_donor_id = ref.donor_id
       WHERE er.invite_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ valid: false, error: 'Invite link not found.' });
    }

    const inv = result.rows[0];
    if (inv.is_claimed) {
      return res.status(400).json({ valid: false, error: 'This invite link has already been claimed.' });
    }
    if (inv.request_status !== 'Pending') {
      return res.status(400).json({ valid: false, error: 'This blood request is no longer active.' });
    }

    res.json({
      valid: true,
      requestId: inv.request_id,
      bloodGroupNeeded: inv.blood_group_needed,
      referrerName: `${inv.referrer_first_name} ${inv.referrer_last_name}`,
      needDate: inv.need_date
    });
  } catch (err) {
    console.error('Validate invite error:', err);
    res.status(500).json({ error: 'Server error validating invite link.' });
  }
});

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
    inviteToken,
  } = req.body;

  if (agreedToTerms !== true) {
    return res.status(400).json({
      error: 'You must agree to the Terms & Conditions to create an account.',
    });
  }

  if (!['PATIENT', 'BLOOD_DONOR', 'DRIVER'].includes(role)) {
    return res.status(400).json({ error: 'Invalid registration role.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const hashedPassword = await bcrypt.hash(password, 10);

    // ---------- DRIVER ----------
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
        message: 'Your driver account request has been submitted. Please wait for admin approval.',
        pendingApproval: true,
      });
    }

    // ---------- PATIENT / BLOOD_DONOR ----------
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
      const donorResult = await client.query(
        `INSERT INTO "BLOOD_DONOR" (first_name, last_name, email, phone, blood_group, account_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING donor_id`,
        [firstName, lastName, email, phone, bloodGroup, accountId]
      );
      const newDonorId = donorResult.rows[0].donor_id;

      // 🔒 SECURE EXTERNAL INVITE HANDLING
      if (inviteToken) {
        if (!UUID_REGEX.test(inviteToken)) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Invalid invite link format.' });
        }

        const inviteRes = await client.query(
          `SELECT request_id, referrer_donor_id, is_claimed 
           FROM "EXTERNAL_REFERRAL" 
           WHERE invite_token = $1 FOR UPDATE`,
          [inviteToken]
        );

        if (inviteRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Referral invite link not found.' });
        }

        const invite = inviteRes.rows[0];
        if (invite.is_claimed) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'This referral invite link has already been used.' });
        }

        const reqRes = await client.query(
          `SELECT request_id, blood_group_needed, units_needed, units_pledged, status, need_date
           FROM "BLOOD_REQUEST"
           WHERE request_id = $1 FOR UPDATE`,
          [invite.request_id]
        );

        if (reqRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Associated blood request no longer exists.' });
        }

        const bloodReq = reqRes.rows[0];
        if (bloodReq.status !== 'Pending') {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'This blood request is no longer accepting pledges.' });
        }

        // FIX: Removed the `units_pledged >= units_needed` restriction to support unlimited/overbooked pledges

        if (!isCompatible(bloodGroup, bloodReq.blood_group_needed)) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            error: `Your selected blood group (${bloodGroup}) cannot donate to the requested group (${bloodReq.blood_group_needed}).`
          });
        }

        console.log(`✅ Processing Invite | Referrer ID: ${invite.referrer_donor_id} | New Donor ID: ${newDonorId}`);

        await client.query(
          `INSERT INTO "BLOOD_DONATION"
             (request_id, donor_id, donation_type, referred_donor_id, status)
           VALUES ($1, $2, 'REFERRED', $3, 'Pledged')`,
          [invite.request_id, invite.referrer_donor_id, newDonorId]
        );

        await client.query(
          `UPDATE "BLOOD_REQUEST"
           SET units_pledged = units_pledged + 1
           WHERE request_id = $1`,
          [invite.request_id]
        );

        await client.query(
          `UPDATE "EXTERNAL_REFERRAL"
           SET is_claimed = true,
               claimed_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')
           WHERE invite_token = $1`,
          [inviteToken]
        );
      }
    }

    await client.query('COMMIT');
    const roleLabels = { PATIENT: 'Patient', BLOOD_DONOR: 'Blood Donor' };
    res.status(201).json({ 
      message: `${roleLabels[role]} registered successfully!${inviteToken ? ' Blood donation pledge has been confirmed.' : ''}` 
    });
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