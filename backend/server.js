const express = require('express');
const cors = require('cors');

// Import your modular routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Register Routes
// This prefixes all routes in auth.js with '/api/auth'
app.use('/api/auth', authRoutes); 
app.use('/api/dashboard', dashboardRoutes);

// A simple health-check route to test the server
app.get('/api/status', (req, res) => {
  res.json({ message: 'Modular backend is running smoothly!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});