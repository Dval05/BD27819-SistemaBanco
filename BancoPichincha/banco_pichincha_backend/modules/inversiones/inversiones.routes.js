const express = require('express');
const router = express.Router();
const InversionController = require('./controllers/inversion.controller');
const CronogramaController = require('./controllers/cronograma.controller');
const MovimientoController = require('./controllers/movimiento.controller');

// Inversiones
router.get('/', InversionController.getAll);
router.get('/cuenta/:idCuenta', InversionController.getByCuenta);
router.get('/:id', InversionController.getById);
router.post('/', InversionController.create);
router.put('/:id', InversionController.update);
router.patch('/:id/estado', InversionController.updateEstado);
router.delete('/:id', InversionController.delete);

// Cronogramas
router.get('/:idInv/cronogramas', CronogramaController.getByInversion);
router.get('/cronogramas/:id', CronogramaController.getById);
router.post('/:idInv/cronogramas', CronogramaController.create);
router.put('/cronogramas/:id', CronogramaController.update);
router.patch('/cronogramas/:id/estado', CronogramaController.updateEstado);

// Movimientos
router.get('/:idInv/movimientos', MovimientoController.getByInversion);
router.get('/movimientos/:id', MovimientoController.getById);
router.post('/:idInv/movimientos', MovimientoController.create);

module.exports = router;
