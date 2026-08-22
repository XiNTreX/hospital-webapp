const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// Secure all admin routes
router.use(verifyToken, isAdmin);

// GET: /api/admin/schema - Dynamically fetches all tables and their columns
router.get('/schema', async (req, res) => {
  try {
    // 1. Get all user-created tables in the public schema
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const schema = {};
    
    // 2. For each table, get its columns
    for (let row of tablesResult.rows) {
      const tableName = row.table_name;
      const colsResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [tableName]);
      
      schema[tableName] = colsResult.rows.map(c => c.column_name);
    }
    
    res.json(schema);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch database schema.' });
  }
});

// POST: /api/admin/query - Executes the secure parameterized query
router.post('/query', async (req, res) => {
  const { query, values } = req.body;
  
  try {
    const result = await pool.query(query, values || []);
    res.json({
      command: result.command,
      rowCount: result.rowCount,
      rows: result.rows
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;