/**
 * Main Server Entry Point
 * Banco Pichincha Backend
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { supabase } = require('./shared/config/database.config');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { data, error } = await supabase.from('clientes').select('count');
    
    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Database connection failed',
        error: error.message
      });
    }

    res.json({
      status: 'ok',
      message: 'Server is running',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// API Routes
app.get('/api', (req, res) => {
  res.json({
    message: 'Banco Pichincha API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Banco Pichincha Backend running on port ${PORT}`);
  console.log(`📊 Database: ${process.env.SUPABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});
