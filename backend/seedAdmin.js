const pool = require('./config/db');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function seedAdmin() {
  const email = 'admin1@hospital.com';
  const password = 'admin123';

  try {
    // 1. Check if admin user already exists
    const existingUser = await pool.query(
      `SELECT * FROM "USER_ACCOUNT" WHERE email = $1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️ Admin user already exists in the database.');
      process.exit(0);
    }

    // 2. Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Insert admin account into USER_ACCOUNT table with user_type = 'ADMIN'
    await pool.query(
      `INSERT INTO "USER_ACCOUNT" (email, password_hash, user_type) 
       VALUES ($1, $2, $3)`,
      [email, hashedPassword, 'ADMIN']
    );

    console.log('--------------------------------------------------');
    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('--------------------------------------------------');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding admin user:', err.message);
    process.exit(1);
  }
}

seedAdmin();