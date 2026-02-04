const express = require('express');
const router = express.Router();
const depositosController = require('./controllers/depositos.controller');


router.post('/validar-cuenta', depositosController.validarCuenta);
router.post('/', (req, res, next) => {
  const { cuenta_id, monto } = req.body;
  if (!cuenta_id || !monto) {
    return res.status(400).json({ error: 'cuenta_id y monto son obligatorios' });
  }
  next();
}, depositosController.realizarDeposito);
router.get('/historial/:numeroCuenta', depositosController.obtenerHistorial);

module.exports = router;

