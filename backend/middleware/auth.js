const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'Invalid token format' });

  try {
    // 1. Check if token has been blacklisted (logged out)
    const blacklistCheck = await pool.query(
      'SELECT token FROM "TOKEN_BLACKLIST" WHERE token = $1', 
      [token]
    );
    
    if (blacklistCheck.rows.length > 0) {
      return res.status(401).json({ error: 'Token has been invalidated. Please log in again.' });
    }

    // 2. If not blacklisted, verify the JWT normally
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

module.exports = verifyToken;