const express = require('express');
const cors = require('cors');
const { pool } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const cityRoutes = require('./routes/cityRoutes');
const tripRoutes = require('./routes/tripRoutes');
const userRoutes = require('./routes/userRoutes');
const communityRoutes = require('./routes/communityRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API v1 & legacy endpoints
app.use('/api/v1/auth', authRoutes);
app.use('/api', authRoutes); // supports legacy /api/login, /api/register, etc.

app.use('/api/v1/cities', cityRoutes);
app.use('/api/cities', cityRoutes);

app.use('/api/v1/trips', tripRoutes);
app.use('/api/trips', tripRoutes);

app.use('/api/v1/users', userRoutes);
app.use('/api/users', userRoutes);

app.use('/api/v1/community', communityRoutes);
app.use('/api/community', communityRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to GlobeTrotter API!' });
});

// Database connection health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows[0].now
    });
  } catch (err) {
    console.error('Health check error:', err.message);
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: err.message
    });
  }
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred.',
      details: err.details || null
    }
  });
});

// Start Express Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`GlobeTrotter Backend Server is running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
