const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

router.get('/profile', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.first_name, d.last_name, u.email, d.license_no, d.phone, d.status 
       FROM "USER_ACCOUNT" u
       JOIN "DRIVER" d ON u.account_id = d.account_id
       WHERE u.account_id = $1`,
      [req.user.accountId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Driver profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;