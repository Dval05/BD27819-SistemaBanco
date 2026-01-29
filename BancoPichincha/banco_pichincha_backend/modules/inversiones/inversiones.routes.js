const express = require('express');
const router = express.Router();
const InversionController = require('./controllers/inversion.controller');
const CronogramaController = require('./controllers/cronograma.controller');
const MovimientoController = require('./controllers/movimiento.controller');
const SimuladorController = require('./controllers/simulador.controller');
const TasasController = require('./controllers/tasas.controller');

// ========== SIMULADOR ==========
// Simular inversión
router.post('/simular', SimuladorController.simular);

// Obtener recomendaciones de plazos
router.get('/recomendaciones', SimuladorController.obtenerRecomendaciones);

// ========== TASAS ==========
// Obtener tabla completa de tasas
router.get('/tasas', TasasController.obtenerTabla);

// Obtener tasa específica
router.get('/tasas/especifica', TasasController.obtenerTasaEspecifica);

// ========== INVERSIONES ==========
// Listar todas las inversiones (con filtros opcionales)
router.get('/', InversionController.getAll);

// Obtener inversiones por cuenta
router.get('/cuenta/:idCuenta', InversionController.getByCuenta);

// Obtener inversiones por persona
router.get('/persona/:idPersona', InversionController.getByPersona);

// Obtener inversión por ID
router.get('/:id', InversionController.getById);

// Crear nueva inversión
router.post('/', InversionController.create);

// Actualizar inversión
router.put('/:id', InversionController.update);

// Actualizar estado de inversión
router.patch('/:id/estado', InversionController.updateEstado);

// Cancelar inversión
router.post('/:id/cancelar', InversionController.cancelar);

// Eliminar inversión
router.delete('/:id', InversionController.delete);

// ========== CRONOGRAMAS ==========
// Obtener cronogramas de una inversión
router.get('/:idInv/cronogramas', CronogramaController.getByInversion);

// Obtener cronograma específico
router.get('/cronogramas/:id', CronogramaController.getById);

// Crear cronograma manual
router.post('/:idInv/cronogramas', CronogramaController.create);

// Actualizar cronograma
router.put('/cronogramas/:id', CronogramaController.update);

// Actualizar estado de cronograma
router.patch('/cronogramas/:id/estado', CronogramaController.updateEstado);

// ========== MOVIMIENTOS ==========
// Obtener movimientos de una inversión
router.get('/:idInv/movimientos', MovimientoController.getByInversion);

// Obtener movimiento específico
router.get('/movimientos/:id', MovimientoController.getById);

// Crear movimiento manual
router.post('/:idInv/movimientos', MovimientoController.create);

module.exports = router;
