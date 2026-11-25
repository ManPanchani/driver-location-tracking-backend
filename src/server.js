
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const db = require('./config/database');
const locationRoutes = require('./routes/location_routes');

const app = express();

const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Driver Location Tracking API is running.',
    version: '1.0.0',
  });
});

app.get('/api/v1/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();

    res.json({
      success: true,
      message: 'API and database are healthy.',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Database is unavailable.',
    });
  }
});

app.use('/api/v1/locations', locationRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found.',
  });
});

app.use((error, req, res, next) => {
  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    'body' in error
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON request body.',
    });
  }

  console.error('Server error:', error);

  return res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
});

if (require.main === module) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('======================================');
    console.log(' Driver Location Tracking Backend');
    console.log('======================================');
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/v1/health`);
  });

  function shutdown() {
    console.log('\nShutting down server...');

    server.close(() => {
      db.close();
      console.log('Server and database closed.');
      process.exit(0);
    });
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = app;
