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
app.use('/api/admin', require('./routes/admin'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/patient', require('./routes/patient'));
app.use('/api/doctor', require('./routes/doctor')); 

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});