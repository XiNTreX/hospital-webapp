const pool = require('./config/db');
const bcrypt = require('bcrypt'); // Note: adjust to require('bcrypt') if you are using that instead

const donors = [
  { email: 'donor.rafiq@example.com', first_name: 'Rafiqul', last_name: 'Islam', is_regular: true, phone: '01711000001', blood_group: 'O+', eligibility: true, last_donation_date: '2026-06-15', donation_count: 5 },
  { email: 'donor.ayesha@example.com', first_name: 'Ayesha', last_name: 'Siddiqa', is_regular: false, phone: '01811000002', blood_group: 'B-', eligibility: true, last_donation_date: '2025-11-20', donation_count: 1 },
  { email: 'donor.karim@example.com', first_name: 'Abdul', last_name: 'Karim', is_regular: true, phone: '01911000003', blood_group: 'AB+', eligibility: false, last_donation_date: '2026-08-30', donation_count: 8 }
];

const drivers = [
  { email: 'driver.jamal@hospital.com', first_name: 'Jamal', last_name: 'Uddin', license_no: 'DL-DHA-102938', phone: '01722000001', status: 'Available' },
  { email: 'driver.hasan@hospital.com', first_name: 'Laila', last_name: 'Hasan', license_no: 'DL-SYL-847563', phone: '01822000002', status: 'On Trip' },
  { email: 'driver.tariq@hospital.com', first_name: 'Tariq', last_name: 'Mahmud', license_no: 'DL-CTG-564738', phone: '01922000003', status: 'Off Duty' }
];

async function seedDatabase() {
  try {
    console.log('Starting seeding process...');
    
    // Hash a uniform password for all seeded accounts
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Seed Blood Donors
    for (const donor of donors) {
      const userRes = await pool.query(
        `INSERT INTO "USER_ACCOUNT" (email, password_hash, user_type) 
         VALUES ($1, $2, $3) RETURNING account_id`,
        [donor.email, hashedPassword, 'BLOOD_DONOR']
      );
      
      const accountId = userRes.rows[0].account_id;

      await pool.query(
        `INSERT INTO "BLOOD_DONOR" (first_name, last_name, is_regular, email, phone, blood_group, eligibility, last_donation_date, donation_count, account_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [donor.first_name, donor.last_name, donor.is_regular, donor.email, donor.phone, donor.blood_group, donor.eligibility, donor.last_donation_date, donor.donation_count, accountId]
      );
      console.log(`Seeded Donor: ${donor.first_name} ${donor.last_name}`);
    }

    // Seed Drivers
    for (const driver of drivers) {
      const userRes = await pool.query(
        `INSERT INTO "USER_ACCOUNT" (email, password_hash, user_type) 
         VALUES ($1, $2, $3) RETURNING account_id`,
        [driver.email, hashedPassword, 'DRIVER']
      );
      
      const accountId = userRes.rows[0].account_id;

      await pool.query(
        `INSERT INTO "DRIVER" (first_name, last_name, license_no, phone, status, account_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [driver.first_name, driver.last_name, driver.license_no, driver.phone, driver.status, accountId]
      );
      console.log(`Seeded Driver: ${driver.first_name} ${driver.last_name}`);
    }

    console.log('\nSeeding completed successfully!');
    console.log('All accounts have the password: password123');
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
}

seedDatabase();