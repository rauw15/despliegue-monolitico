const express = require('express');
const { sequelize } = require('../database/connection');
const router = express.Router();

// Endpoint de salud básica
router.get('/', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: 'Connected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      message: error.message
    });
  }
});

// Endpoint de salud detallada (solo para desarrollo)
router.get('/detailed', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  try {
    const [results] = await sequelize.query('SELECT version() as db_version');
    
    res.json({
      status: 'OK',
      system: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime()
      },
      database: {
        status: 'Connected',
        version: results[0]?.db_version || 'Unknown'
      },
      environment: {
        node_env: process.env.NODE_ENV,
        port: process.env.PORT,
        database_url: process.env.DATABASE_URL ? 'Set' : 'Not set'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

module.exports = router;
