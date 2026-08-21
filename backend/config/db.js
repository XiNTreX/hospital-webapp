const { Pool } = require('pg');
require('dotenv').config();

// Create a new connection pool using your Neon connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon and many cloud databases
  },
});

// Test the connection
pool.connect()
  .then(() => console.log('Successfully connected to Neon PostgreSQL!'))
  .catch(err => console.error('Connection error', err.stack));

module.exports = pool;