const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const runSchema = async () => {
  try {
    const sqlPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing schema.sql...');
    await pool.query(sql);
    console.log('Tables created successfully!');
    
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    pool.end(); // Close the database connection
  }
};

runSchema();