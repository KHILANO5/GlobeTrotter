const express = require('express');
const cors = require('cors');
const { pool } = require('./config/db');

// Route modules
const authRoutes = require('./routes/authRoutes');
const cityRoutes = require('./routes/cityRoutes');
const tripRoutes = require('./routes/tripRoutes');
const itineraryRoutes = require('./routes/itineraryRoutes');
const activityRoutes = require('./routes/activityRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const shareRoutes = require('./routes/shareRoutes');
const userRoutes = require('./routes/userRoutes');
const communityRoutes = require('./routes/communityRoutes');
const adminRoutes = require('./routes/adminRoutes');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// API v1 & legacy route mountings
app.use('/api/v1/auth', authRoutes);
app.use('/api', authRoutes);

app.use('/api/v1/cities', cityRoutes);
app.use('/api/cities', cityRoutes);

app.use('/api/v1/activities', activityRoutes);
app.use('/api/activities', activityRoutes);

app.use('/api/v1/trips', tripRoutes);
app.use('/api/trips', tripRoutes);

// Nested trip sub-routes (Itinerary, Budget, Calendar, Activities)
app.use('/api/v1/trips/:tripId', itineraryRoutes);
app.use('/api/trips/:tripId', itineraryRoutes);

app.use('/api/v1/trips/:tripId', budgetRoutes);
app.use('/api/trips/:tripId', budgetRoutes);

app.use('/api/v1/trips/:tripId', calendarRoutes);
app.use('/api/trips/:tripId', calendarRoutes);

app.use('/api/v1/shared', shareRoutes);
app.use('/api/shared', shareRoutes);

app.use('/api/v1/users', userRoutes);
app.use('/api/users', userRoutes);

app.use('/api/v1/community', communityRoutes);
app.use('/api/community', communityRoutes);

app.use('/api/v1/admin', adminRoutes);
app.use('/api/admin', adminRoutes);

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
