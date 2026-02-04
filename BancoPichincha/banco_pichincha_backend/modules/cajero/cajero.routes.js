const express = require('express');
const router = express.Router();
const cajeroController = require('./controllers/cajero.controller');

// Rutas para tarjetas
router.post('/tarjeta/generar', cajeroController.generarTarjetaDebito);
router.post('/tarjeta/generar-debito', cajeroController.generarTarjetaDebito); // Alias para compatibilidad
router.post('/tarjeta/generar-credito', cajeroController.generarTarjetaCredito); // Nueva ruta para crédito
router.get('/tarjeta/verificar/:id_cuenta', cajeroController.verificarTarjeta);
router.put('/tarjeta/cambiar-pin/:id_tarjeta', cajeroController.cambiarPin);
router.post('/tarjeta/validar-pin', cajeroController.validarPin);
router.get('/tarjeta/estado/:id_tarjeta', cajeroController.obtenerEstadoTarjeta);
router.put('/tarjeta/bloquear/:id_tarjeta', cajeroController.bloquearTarjeta);
router.put('/tarjeta/desbloquear/:id_tarjeta', cajeroController.desbloquearTarjeta);
router.delete('/tarjeta/cancelar/:id_tarjeta', cajeroController.cancelarTarjeta);
router.delete('/tarjeta/limpiar-pruebas/:id_persona', cajeroController.limpiarTarjetasPrueba);

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
