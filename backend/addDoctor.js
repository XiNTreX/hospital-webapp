const bcrypt = require('bcrypt');
const pool = require('./config/db');

// 👇 Change these details for whichever doctor you're adding
const newDoctor = {
  first: 'Nusrat',
  last: 'Karim',
  specialization: 'Dermatology',
  degrees: 'MBBS, MD',
  email: 'nusrat.karim2@hospital.local',
  phone: '01711000099',
  room: '303-C',
  fee: 1000.00,
  status: 'Active',
  join_date: '2026-09-05',
  photo: ''
};

async function addDoctor() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const hashedPassword = await bcrypt.hash('SecureDoc123!', 10);

    const userRes = await client.query(
      `INSERT INTO "USER_ACCOUNT" (email, password_hash, user_type)
       VALUES ($1, $2, $3) RETURNING account_id`,
      [newDoctor.email, hashedPassword, 'DOCTOR']
    );
    const accountId = userRes.rows[0].account_id;

    await client.query(
      `INSERT INTO "DOCTOR" (
        first_name, last_name, specialization, degrees,
        email, phone, room_number, fee, status, joining_date, account_id, photo_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        newDoctor.first, newDoctor.last, newDoctor.specialization, newDoctor.degrees,
        newDoctor.email, newDoctor.phone, newDoctor.room, newDoctor.fee, newDoctor.status,
        newDoctor.join_date, accountId, newDoctor.photo
      ]
    );

    await client.query('COMMIT');
    console.log('✅ Doctor added successfully!');
    console.log(`Login: ${newDoctor.email} / SecureDoc123!`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to add doctor:', err.message);
  } finally {
    client.release();
    process.exit();
  }
}

addDoctor();