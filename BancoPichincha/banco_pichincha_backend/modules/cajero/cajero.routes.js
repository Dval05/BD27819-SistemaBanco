const express = require('express');
const router = express.Router();
const cajeroController = require('./controllers/cajero.controller');

// Rutas para tarjetas
router.post('/tarjeta/generar', cajeroController.generarTarjetaDebito);
router.get('/tarjeta/verificar/:id_cuenta', cajeroController.verificarTarjeta);
router.put('/tarjeta/cambiar-pin/:id_tarjeta', cajeroController.cambiarPin);

// Rutas para retiro sin tarjeta
router.post('/retiro-sin-tarjeta/solicitar', cajeroController.solicitarRetiroSinTarjeta);
router.post('/retiro-sin-tarjeta/generar-codigo', cajeroController.generarCodigoTemporal);
router.post('/retiro-sin-tarjeta/validar-codigo', cajeroController.validarCodigoTemporal);
router.post('/retiro-sin-tarjeta/validar-cajero', cajeroController.validarCodigoEnCajero);

// Rutas para retiro en cajero
router.post('/retiro/validar-tarjeta', cajeroController.validarTarjetaEnCajero);
router.post('/retiro/procesar', cajeroController.procesarRetiro);
router.get('/retiro/historial/:id_cuenta', cajeroController.obtenerHistorialRetiros);

module.exports = router;
