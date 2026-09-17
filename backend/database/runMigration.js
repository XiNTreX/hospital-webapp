const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const file = process.argv[2];

if (!file) {
  console.error('Usage: node database/runMigration.js <filename.sql>');
  console.error('Example: node database/runMigration.js add_driver_ambulance_workflow.sql');
  process.exit(1);
}

const filePath = path.join(__dirname, 'migrations', file);

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

const run = async () => {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Running migration: ${file}...`);
    await pool.query(sql);
    console.log(`✅ Migration "${file}" applied successfully!`);
  } catch (err) {
    console.error(`❌ Migration failed:`, err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();