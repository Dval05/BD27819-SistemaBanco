const express = require('express');
const router = express.Router();
const CuentaController = require('./controllers/cuenta.controller');

// Obtener cuentas por persona
router.get('/persona/:idPersona', CuentaController.getCuentasByPersona);

// Obtener cuenta por ID
router.get('/:id', CuentaController.getCuentaById);

module.exports = router;
