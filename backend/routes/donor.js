const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { todayDhaka, daysBetween } = require('../utils/dhakaTime');

// ==========================================
// Helpers
// ==========================================
async function getDonorId(accountId) {
  const res = await pool.query(
    'SELECT donor_id FROM "BLOOD_DONOR" WHERE account_id = $1',
    [accountId]
  );
  return res.rows[0]?.donor_id || null;
}

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

function toDateStr(input) {
  if (!input) return null;
  if (typeof input === 'string') return input.split('T')[0];
  return input.toISOString().split('T')[0];
}

function isEligibleByCooldown(lastDonationDate) {
  const last = toDateStr(lastDonationDate);
  if (!last) return true;
  return daysBetween(todayDhaka(), last) >= 90;
}

function nextEligibleDate(lastDonationDate) {
  const last = toDateStr(lastDonationDate);
  if (!last) return null;
  const [y, m, d] = last.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 90);
  return dt.toISOString().split('T')[0];
}

// ==========================================
// GET /api/donor/profile
// ==========================================
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bd.donor_id, bd.first_name, bd.last_name, u.email,
              bd.phone, bd.blood_group, bd.eligibility,
              bd.last_donation_date, bd.donation_count, bd.is_regular
       FROM "USER_ACCOUNT" u
       JOIN "BLOOD_DONOR" bd ON u.account_id = bd.account_id
       WHERE u.account_id = $1`,
      [req.user.accountId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }
    const d = result.rows[0];
    const inCooldown = !isEligibleByCooldown(d.last_donation_date);
    res.json({
      ...d,
      in_cooldown: inCooldown,
      eligible_now: d.eligibility && !inCooldown,
      next_eligible_date: nextEligibleDate(d.last_donation_date),
    });
  } catch (err) {
    console.error('Donor profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// PUT /api/donor/profile
// ==========================================
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;

    if (!first_name || !last_name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required.' });
    }

    await pool.query(
      `UPDATE "BLOOD_DONOR"
       SET first_name = $1, last_name = $2, phone = $3
       WHERE account_id = $4`,
      [first_name, last_name, phone, req.user.accountId]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Donor profile update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// PUT /api/donor/availability
// ==========================================
router.put('/availability', verifyToken, async (req, res) => {
  try {
    const { eligibility } = req.body;
    if (typeof eligibility !== 'boolean') {
      return res.status(400).json({ error: 'eligibility must be true or false.' });
    }

    const donorId = await getDonorId(req.user.accountId);
    if (!donorId) return res.status(404).json({ error: 'Donor not found' });

    const row = await pool.query(
      `SELECT last_donation_date FROM "BLOOD_DONOR" WHERE donor_id = $1`,
      [donorId]
    );
    
    if (eligibility && !isEligibleByCooldown(row.rows[0].last_donation_date)) {
      return res.status(400).json({
        error: "You're in the 90-day cooldown. You cannot be marked as Available right now."
      });
    }

    await pool.query(
      'UPDATE "BLOOD_DONOR" SET eligibility = $1 WHERE donor_id = $2',
      [eligibility, donorId]
    );

    res.json({
      message: eligibility ? 'You are now Available.' : 'You are now Unavailable.',
      eligibility,
    });
  } catch (err) {
    console.error('Availability update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// GET /api/donor/stats
// ==========================================
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const donorId = await getDonorId(req.user.accountId);
    if (!donorId) return res.status(404).json({ error: 'Donor not found' });

    const row = await pool.query(
      `SELECT blood_group, last_donation_date, donation_count, eligibility
       FROM "BLOOD_DONOR" WHERE donor_id = $1`,
      [donorId]
    );
    if (row.rows.length === 0) return res.status(404).json({ error: 'Donor not found' });

    const d = row.rows[0];
    const inCooldown = !isEligibleByCooldown(d.last_donation_date);

    const counts = await pool.query(
      `SELECT
         CAST(COUNT(*) FILTER (
           WHERE donor_id = $1 AND donation_type = 'SELF' AND status = 'Fulfilled'
         ) AS int) AS self_fulfilled,
         CAST(COUNT(*) FILTER (
           WHERE donor_id = $1 AND donation_type = 'REFERRED' AND status = 'Fulfilled'
         ) AS int) AS referred_fulfilled,
         CAST(COUNT(*) FILTER (
           WHERE ((donor_id = $1 AND donation_type = 'SELF') OR (referred_donor_id = $1 AND donation_type = 'REFERRED'))
             AND status = 'Pledged'
         ) AS int) AS self_active,
         CAST(COUNT(*) FILTER (
           WHERE donor_id = $1 AND donation_type = 'REFERRED'
             AND status IN ('Pending', 'Pledged')
         ) AS int) AS referred_active,
         CAST(COUNT(*) FILTER (
           WHERE referred_donor_id = $1 AND status = 'Fulfilled'
         ) AS int) AS donated_via_referral
       FROM "BLOOD_DONATION"
       WHERE donor_id = $1 OR referred_donor_id = $1`,
      [donorId]
    );

    res.json({
      blood_group: d.blood_group,
      last_donation_date: d.last_donation_date,
      donation_count: d.donation_count,
      eligibility: d.eligibility,
      in_cooldown: inCooldown,
      eligible_now: d.eligibility && !inCooldown,
      next_eligible_date: nextEligibleDate(d.last_donation_date),
      ...counts.rows[0],
    });
  } catch (err) {
    console.error('Donor stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// GET /api/donor/requests/available
// ==========================================
router.get('/requests/available', verifyToken, async (req, res) => {
  try {
    const donorId = await getDonorId(req.user.accountId);
    if (!donorId) return res.status(404).json({ error: 'Donor not found' });

    const result = await pool.query(
      `SELECT br.request_id, br.blood_group_needed, br.units_needed,
              br.units_pledged, br.units_fulfilled, br.units_pending,
              br.request_date, br.need_date, br.status,
              br.patient_notes,
              p.first_name, p.last_name,
              CAST((SELECT COUNT(*) FROM "BLOOD_DONATION" bd
               WHERE bd.request_id = br.request_id 
                 AND (bd.donor_id = $1 OR bd.referred_donor_id = $1)
                 AND bd.status IN ('Pending', 'Pledged')) AS int) AS my_pledged_count
       FROM "BLOOD_REQUEST" br
       JOIN "PATIENT" p ON br.patient_id = p.patient_id
       WHERE br.status = 'Pending'
         AND br.units_fulfilled < br.units_needed
       ORDER BY br.need_date ASC, br.request_date ASC`,
      [donorId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Available blood requests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// POST /api/donor/requests/:id/generate-invite
// ==========================================
router.post('/requests/:id/generate-invite', verifyToken, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) return res.status(400).json({ error: 'Invalid request ID.' });

    const donorId = await getDonorId(req.user.accountId);
    if (!donorId) return res.status(404).json({ error: 'Donor not found' });

    const reqRow = await pool.query(
      `SELECT request_id, blood_group_needed, units_needed, units_pledged, status, need_date
       FROM "BLOOD_REQUEST" WHERE request_id = $1`,
      [requestId]
    );

    if (reqRow.rows.length === 0) {
      return res.status(404).json({ error: 'Blood request not found.' });
    }

    const request = reqRow.rows[0];
    if (request.status !== 'Pending') {
      return res.status(400).json({ error: 'This request is no longer accepting pledges.' });
    }

    const needDate = toDateStr(request.need_date);
    if (needDate && needDate < todayDhaka()) {
      return res.status(400).json({ error: 'This request has passed its deadline.' });
    }

    // FIX: Removed the `units_pledged >= units_needed` check to allow unlimited invites

    const insertRes = await pool.query(
      `INSERT INTO "EXTERNAL_REFERRAL" (request_id, referrer_donor_id)
       VALUES ($1, $2)
       RETURNING invite_token`,
      [requestId, donorId]
    );

    const inviteToken = insertRes.rows[0].invite_token;

    res.status(201).json({
      message: 'Invite link generated successfully!',
      inviteToken,
      inviteUrl: `http://localhost:3000/register?invite=${inviteToken}`,
      bloodGroupNeeded: request.blood_group_needed,
    });
  } catch (err) {
    console.error('Generate invite error:', err);
    res.status(500).json({ error: 'Server error generating invite.' });
  }
});

// ==========================================
// POST /api/donor/requests/:id/pledge
// Direct self-donation pledge
// ==========================================
router.post('/requests/:id/pledge', verifyToken, async (req, res) => {
  let client;
  try {
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) return res.status(400).json({ error: 'Invalid request ID.' });

    const { agreedTerms } = req.body;
    if (!agreedTerms) {
      return res.status(400).json({ error: 'You must agree to the terms and conditions.' });
    }

    const donorId = await getDonorId(req.user.accountId);
    if (!donorId) return res.status(404).json({ error: 'Donor not found' });

    client = await pool.connect();
    await client.query('BEGIN');

    const reqRow = await client.query(
      `SELECT request_id, blood_group_needed, units_needed, units_pledged, status, need_date
       FROM "BLOOD_REQUEST" WHERE request_id = $1 FOR UPDATE`,
      [requestId]
    );
    if (reqRow.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Blood request not found.' });
    }
    const request = reqRow.rows[0];
    if (request.status !== 'Pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This request is no longer accepting pledges.' });
    }

    const needDate = toDateStr(request.need_date);
    if (needDate && needDate < todayDhaka()) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'This request has passed its deadline and is no longer accepting pledges.',
      });
    }

    // FIX: Removed the `units_pledged >= units_needed` check to allow unlimited direct pledges

    const donorRow = await client.query(
      `SELECT blood_group, last_donation_date, eligibility
       FROM "BLOOD_DONOR" WHERE donor_id = $1`,
      [donorId]
    );
    const d = donorRow.rows[0];

    if (!d.eligibility) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You are currently unavailable. Toggle to Available in your profile.' });
    }
    if (!isEligibleByCooldown(d.last_donation_date)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `You must wait 90 days between donations. Next eligible: ${nextEligibleDate(d.last_donation_date)}`
      });
    }
    if (!isCompatible(d.blood_group, request.blood_group_needed)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Your blood group (${d.blood_group}) cannot donate to ${request.blood_group_needed}.`
      });
    }

    const activePledge = await client.query(
      `SELECT donation_id FROM "BLOOD_DONATION"
       WHERE ((donor_id = $1 AND donation_type = 'SELF') OR (referred_donor_id = $1))
         AND status = 'Pledged'`,
      [donorId]
    );
    if (activePledge.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'You already have an active blood donation pledge. Complete or cancel it first.'
      });
    }

    await client.query(
      `INSERT INTO "BLOOD_DONATION"
       (request_id, donor_id, donation_type, status)
       VALUES ($1, $2, 'SELF', 'Pledged')`,
      [requestId, donorId]
    );

    await client.query(
      `UPDATE "BLOOD_REQUEST"
       SET units_pledged = units_pledged + 1
       WHERE request_id = $1`,
      [requestId]
    );

    await client.query('COMMIT');
    return res.json({ message: 'Pledge recorded. Thank you!', bags: 1 });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('Pledge error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    if (client) client.release();
  }
});

// ==========================================
// GET /api/donor/referrals/incoming
// Called by the invited friend (referred_donor_id) to see their invitations
// ==========================================
router.get('/referrals/incoming', verifyToken, async (req, res) => {
  try {
    const donorId = await getDonorId(req.user.accountId);
    if (!donorId) return res.status(404).json({ error: 'Donor not found' });

    const result = await pool.query(
      `SELECT bd.donation_id, bd.request_id, bd.status, bd.pledged_at,
              bd.fulfilled_at, bd.cancelled_at,
              br.blood_group_needed, br.units_needed, br.need_date,
              br.patient_notes, br.status AS request_status,
              p.first_name AS patient_first_name, p.last_name AS patient_last_name,
              p.phone AS patient_phone,
              ref.donor_id AS referrer_id,
              ref.first_name AS referrer_first_name,
              ref.last_name AS referrer_last_name,
              ref.phone AS referrer_phone,
              ref.blood_group AS referrer_blood_group
       FROM "BLOOD_DONATION" bd
       JOIN "BLOOD_REQUEST" br ON bd.request_id = br.request_id
       JOIN "PATIENT" p ON br.patient_id = p.patient_id
       JOIN "BLOOD_DONOR" ref ON bd.donor_id = ref.donor_id
       WHERE bd.referred_donor_id = $1
       ORDER BY bd.pledged_at DESC`,
      [donorId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Incoming referrals error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// PUT /api/donor/referrals/:id/fulfill
// Called by the invited friend (referred_donor_id) to fulfill their donation
// ==========================================
router.put('/referrals/:id/fulfill', verifyToken, async (req, res) => {
  let client;
  try {
    const donationId = parseInt(req.params.id);
    if (isNaN(donationId)) return res.status(400).json({ error: 'Invalid referral ID.' });

    const donorId = await getDonorId(req.user.accountId);
    if (!donorId) return res.status(404).json({ error: 'Donor not found' });

    client = await pool.connect();
    await client.query('BEGIN');

    const row = await client.query(
      `SELECT donation_id, request_id, status
       FROM "BLOOD_DONATION"
       WHERE donation_id = $1 AND referred_donor_id = $2
       FOR UPDATE`,
      [donationId, donorId]
    );
    if (row.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Referral not found.' });
    }
    if (row.rows[0].status !== 'Pledged') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Only pledged donations can be marked as fulfilled.'
      });
    }

    await client.query(
      `UPDATE "BLOOD_DONATION"
       SET status = 'Fulfilled', fulfilled_at = CURRENT_TIMESTAMP
       WHERE donation_id = $1`,
      [donationId]
    );

    await client.query(
      `UPDATE "BLOOD_REQUEST"
       SET units_fulfilled = units_fulfilled + 1
       WHERE request_id = $1`,
      [row.rows[0].request_id]
    );

    await client.query(
      `UPDATE "BLOOD_DONOR"
       SET last_donation_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date,
           donation_count = donation_count + 1
       WHERE donor_id = $1`,
      [donorId]
    );

    const reqStatus = await client.query(
      `SELECT units_needed, units_fulfilled FROM "BLOOD_REQUEST" WHERE request_id = $1`,
      [row.rows[0].request_id]
    );
    if (reqStatus.rows[0].units_fulfilled >= reqStatus.rows[0].units_needed) {
      await client.query(
        `UPDATE "BLOOD_REQUEST" SET status = 'Fulfilled' WHERE request_id = $1`,
        [row.rows[0].request_id]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Donation confirmed. Thank you!' });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('Fulfill referral error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    if (client) client.release();
  }
});

// ==========================================
// PUT /api/donor/donations/:id/fulfill
// Called by a donor to fulfill their donation (Handles both SELF and REFERRED)
// ==========================================
router.put('/donations/:id/fulfill', verifyToken, async (req, res) => {
  let client;
  try {
    const donationId = parseInt(req.params.id);
    if (isNaN(donationId)) return res.status(400).json({ error: 'Invalid donation ID.' });
    
    const donorId = await getDonorId(req.user.accountId);
    if (!donorId) return res.status(404).json({ error: 'Donor not found.' });

    client = await pool.connect();
    await client.query('BEGIN');

    const row = await client.query(
      `SELECT donation_id, request_id, donation_type, status, referred_donor_id
       FROM "BLOOD_DONATION"
       WHERE donation_id = $1 
         AND ((donor_id = $2 AND donation_type = 'SELF') OR (referred_donor_id = $2 AND donation_type = 'REFERRED'))
       FOR UPDATE`,
      [donationId, donorId]
    );
    
    if (row.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Donation not found or unauthorized.' });
    }
    
    if (row.rows[0].status !== 'Pledged') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Only pledged donations can be fulfilled.' });
    }

    await client.query(
      `UPDATE "BLOOD_DONATION"
       SET status = 'Fulfilled', fulfilled_at = CURRENT_TIMESTAMP
       WHERE donation_id = $1`,
      [donationId]
    );

    await client.query(
      `UPDATE "BLOOD_REQUEST"
       SET units_fulfilled = units_fulfilled + 1
       WHERE request_id = $1`,
      [row.rows[0].request_id]
    );

    await client.query(
      `UPDATE "BLOOD_DONOR"
       SET last_donation_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date,
           donation_count = donation_count + 1
       WHERE donor_id = $1`,
      [donorId]
    );

    const reqStatus = await client.query(
      `SELECT units_needed, units_fulfilled FROM "BLOOD_REQUEST" WHERE request_id = $1`,
      [row.rows[0].request_id]
    );
    if (reqStatus.rows[0].units_fulfilled >= reqStatus.rows[0].units_needed) {
      await client.query(
        `UPDATE "BLOOD_REQUEST" SET status = 'Fulfilled' WHERE request_id = $1`,
        [row.rows[0].request_id]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Donation marked as fulfilled. Thank you!' });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('Fulfill donation error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    if (client) client.release();
  }
});

// ==========================================
// PUT /api/donor/donations/:id/cancel
// Either the Referrer or the Invited Donor can cancel the pledge
// ==========================================
router.put('/donations/:id/cancel', verifyToken, async (req, res) => {
  let client;
  try {
    const donationId = parseInt(req.params.id);
    if (isNaN(donationId)) return res.status(400).json({ error: 'Invalid donation ID.' });

    const donorId = await getDonorId(req.user.accountId);
    if (!donorId) return res.status(404).json({ error: 'Donor not found.' });

    client = await pool.connect();
    await client.query('BEGIN');

    const row = await client.query(
      `SELECT donation_id, request_id, status, donation_type, referred_donor_id
       FROM "BLOOD_DONATION"
       WHERE donation_id = $1 AND (donor_id = $2 OR referred_donor_id = $2)
       FOR UPDATE`,
      [donationId, donorId]
    );
    if (row.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Donation not found.' });
    }
    const donation = row.rows[0];
    if (!['Pending', 'Pledged'].includes(donation.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Only pending or pledged donations can be cancelled.'
      });
    }

    await client.query(
      `UPDATE "BLOOD_DONATION"
       SET status = 'Cancelled', cancelled_at = CURRENT_TIMESTAMP
       WHERE donation_id = $1`,
      [donationId]
    );

    await client.query(
      `UPDATE "BLOOD_REQUEST"
       SET units_pledged = GREATEST(units_pledged - 1, 0)
       WHERE request_id = $1`,
      [donation.request_id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Donation cancelled.' });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('Cancel donation error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    if (client) client.release();
  }
});

// ==========================================
// GET /api/donor/donations/mine
// Fetches all donations where this donor bled (both SELF and REFERRED)
// ==========================================
router.get('/donations/mine', verifyToken, async (req, res) => {
  try {
    const donorId = await getDonorId(req.user.accountId);
    const result = await pool.query(
      `SELECT bd.donation_id, bd.request_id, bd.status,
              bd.pledged_at, bd.fulfilled_at, bd.cancelled_at,
              br.blood_group_needed, br.units_needed, br.need_date,
              br.patient_notes,
              p.first_name, p.last_name
       FROM "BLOOD_DONATION" bd
       JOIN "BLOOD_REQUEST" br ON bd.request_id = br.request_id
       JOIN "PATIENT" p ON br.patient_id = p.patient_id
       WHERE (bd.donor_id = $1 AND bd.donation_type = 'SELF')
          OR (bd.referred_donor_id = $1 AND bd.donation_type = 'REFERRED')
       ORDER BY bd.pledged_at DESC`,
      [donorId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('My donations error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// GET /api/donor/donations/referred
// Called by the Referrer (donor_id) to see friends they invited
// ==========================================
router.get('/donations/referred', verifyToken, async (req, res) => {
  try {
    const donorId = await getDonorId(req.user.accountId);
    const result = await pool.query(
      `SELECT bd.donation_id, bd.request_id, bd.status,
              bd.referred_donor_id,
              rd.first_name AS referred_first_name,
              rd.last_name  AS referred_last_name,
              rd.blood_group AS referred_blood_group,
              rd.phone AS referred_phone,
              bd.pledged_at, bd.fulfilled_at, bd.cancelled_at,
              br.blood_group_needed, br.units_needed, br.need_date,
              br.patient_notes,
              p.first_name, p.last_name
       FROM "BLOOD_DONATION" bd
       JOIN "BLOOD_REQUEST" br ON bd.request_id = br.request_id
       JOIN "PATIENT" p ON br.patient_id = p.patient_id
       LEFT JOIN "BLOOD_DONOR" rd ON bd.referred_donor_id = rd.donor_id
       WHERE bd.donor_id = $1 AND bd.donation_type = 'REFERRED'
       ORDER BY bd.pledged_at DESC`,
      [donorId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Referred donations error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;