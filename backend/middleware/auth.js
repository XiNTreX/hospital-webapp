const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
  // 1. Get the Authorization header from the incoming request
  const authHeader = req.header('Authorization');

  // 2. If there is no header at all, reject the request
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  // 3. Tokens are typically sent as "Bearer <token_string>". Split it to get just the string.
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Malformed token.' });
  }

  try {
    // 4. Verify the token's signature and expiration using your secret key
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // 5. Attach the decoded payload (accountId, role) to the request object
    // This allows the next route to know exactly who is making the request
    req.user = verified; 
    
    // 6. Pass control to the next middleware or the actual route handler
    next(); 
  } catch (err) {
    // If the token is expired or tampered with, this catch block catches it
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
};