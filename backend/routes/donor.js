const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

router.get('/profile', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bd.first_name, bd.last_name, u.email, bd.phone, bd.blood_group, bd.last_donation_date 
       FROM "USER_ACCOUNT" u
       JOIN "BLOOD_DONOR" bd ON u.account_id = bd.account_id
       WHERE u.account_id = $1`,
      [req.user.accountId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Donor profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;