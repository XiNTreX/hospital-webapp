const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Import the middleware we just created
const verifyToken = require('../middleware/auth'); 

// GET: /api/dashboard/profile
// Notice how `verifyToken` is passed as the second argument. 
// Express will run the middleware first. If it succeeds, it runs the async function.
router.get('/profile', verifyToken, async (req, res) => {
  try {
    // Because the middleware attached the decoded token to req.user, we can use it here!
    const { accountId, role } = req.user;

    let profileData;

    // Fetch different data based on the user's role
    if (role === 'PATIENT') {
      const result = await pool.query(
        `SELECT first_name, last_name, dob, blood_group FROM "PATIENT" WHERE account_id = $1`,
        [accountId]
      );
      profileData = result.rows[0];
    } else if (role === 'BLOOD_DONOR') {
      const result = await pool.query(
        `SELECT first_name, last_name, blood_group, donation_count FROM "BLOOD_DONOR" WHERE account_id = $1`,
        [accountId]
      );
      profileData = result.rows[0];
    } else {
       // Placeholder for DOCTOR and ADMIN
       profileData = { message: `Profile data for ${role} not yet implemented.` };
    }

    res.json({
      message: 'Secure data retrieved successfully',
      user: {
        accountId,
        role,
        ...profileData
      }
    });

  } catch (err) {
    console.error('Dashboard Error:', err.message);
    res.status(500).json({ error: 'Server error fetching profile data.' });
  }
});

module.exports = router;