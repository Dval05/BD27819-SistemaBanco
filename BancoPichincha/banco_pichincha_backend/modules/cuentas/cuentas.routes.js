const express = require('express');
const router = express.Router();
const CuentaController = require('./controllers/cuenta.controller');

// Crear cuenta de ahorro
router.post('/crear-ahorro', CuentaController.crearCuentaAhorro);

// Obtener cuentas por persona
router.get('/persona/:idPersona', CuentaController.getCuentasByPersona);

// Obtener cuenta por ID
router.get('/:id', CuentaController.getCuentaById);

module.exports = router;
