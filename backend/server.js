const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Ensure path is exactly './config/db'
const pool = require('./config/db'); 

const app = express();

app.use(cors());
app.use(express.json());

// Mount API Routes
app.use('/api/auth', require('./routes/auth'));
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/patient', require('./routes/patient'));
app.use('/api/doctor', require('./routes/doctor')); 
app.use('/api/donor', require('./routes/donor'));
app.use('/api/driver', require('./routes/driver'));
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});