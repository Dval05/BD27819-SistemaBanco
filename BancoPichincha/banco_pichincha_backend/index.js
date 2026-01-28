/**
 * Main Server Entry Point
 * Banco Pichincha Backend
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { supabase } = require('./shared/config/database.config');

// Módulos
const authRoutes = require('./modules/auth/auth.routes');
const inversionesRoutes = require('./modules/inversiones/inversiones.routes');
const cuentasRoutes = require('./modules/cuentas/cuentas.routes');
const solicitudesRoutes = require('./modules/solicitudes/solicitudes.routes');
const transaccionesRoutes = require('./modules/transacciones/transacciones.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas de módulos
app.use('/api/auth', authRoutes);
app.use('/api/clientes', authRoutes);
app.use('/api/inversiones', inversionesRoutes);
app.use('/api/cuentas', cuentasRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/transacciones', transaccionesRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    
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
