/**
 * Rutas de Transacciones
 * Endpoints para consulta de movimientos
 */

const express = require('express');
const router = express.Router();
const transaccionController = require('./controllers/transaccion.controller');

/**
 * @route GET /api/transacciones/tipos
 * @description Obtener tipos de transacción disponibles
 */
router.get('/tipos', transaccionController.obtenerTipos);

/**
 * @route GET /api/transacciones/cuenta/:idCuenta
 * @description Obtener movimientos de una cuenta
 * @query tipo - Filtrar por tipo ('00', '01', '02', '03')
 * @query fechaInicio - Fecha inicio (YYYY-MM-DD)
 * @query fechaFin - Fecha fin (YYYY-MM-DD)
 * @query limit - Límite de resultados
 * @query offset - Desplazamiento para paginación
 */
router.get('/cuenta/:idCuenta', transaccionController.obtenerMovimientos);

/**
 * @route GET /api/transacciones/resumen/:idCuenta
 * @description Obtener resumen de transacciones de una cuenta
 */
router.get('/resumen/:idCuenta', transaccionController.obtenerResumen);

/**
 * @route GET /api/transacciones/:idTransaccion
 * @description Obtener detalle de una transacción específica
 */
router.get('/:idTransaccion', transaccionController.obtenerDetalle);

module.exports = router;
