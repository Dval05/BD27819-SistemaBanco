const express = require('express');
const router = express.Router();
const PagoServiciosController = require('../controllers/pagoServicios.controller');

// =====================================
// RUTAS DE CONSULTA (Navegación)
// =====================================

/**
 * GET /api/pago-servicios/categorias
 * Obtener todas las categorías de servicios
 */
router.get('/categorias', PagoServiciosController.getCategorias);

/**
 * GET /api/pago-servicios/categorias/:idCat/subcategorias
 * Obtener subcategorías de una categoría
 */
router.get('/categorias/:idCat/subcategorias', PagoServiciosController.getSubcategorias);

/**
 * GET /api/pago-servicios/categorias/:idCat/servicios
 * Obtener servicios de una categoría (sin subcategorías)
 */
router.get('/categorias/:idCat/servicios', PagoServiciosController.getServiciosByCategoria);

/**
 * GET /api/pago-servicios/subcategorias/:idSubcat/servicios
 * Obtener servicios de una subcategoría
 */
router.get('/subcategorias/:idSubcat/servicios', PagoServiciosController.getServiciosBySubcategoria);

/**
 * GET /api/pago-servicios/servicios/:idSrv/subtipos
 * Obtener subtipos de un servicio (si tiene)
 */
router.get('/servicios/:idSrv/subtipos', PagoServiciosController.getSubtiposByServicio);

/**
 * GET /api/pago-servicios/servicios/:idSrv/datos-requeridos
 * Obtener datos requeridos para un servicio
 */
router.get('/servicios/:idSrv/datos-requeridos', PagoServiciosController.getDatosRequeridosByServicio);

/**
 * GET /api/pago-servicios/subtipos/:idSubtipo/datos-requeridos
 * Obtener datos requeridos para un subtipo
 */
router.get('/subtipos/:idSubtipo/datos-requeridos', PagoServiciosController.getDatosRequeridosBySubtipo);

// =====================================
// RUTAS DE CUENTAS (Requieren autenticación)
// =====================================

/**
 * GET /api/pago-servicios/cuentas-ahorro/:idPersona
 * Obtener cuentas de ahorro disponibles del usuario autenticado
 */
router.get('/cuentas-ahorro/:idPersona', PagoServiciosController.getCuentasAhorroDisponibles);

// =====================================
// RUTAS DE PROCESAMIENTO (Requieren autenticación)
// =====================================

/**
 * POST /api/pago-servicios/validar-datos
 * Validar datos antes de procesar el pago
 */
router.post('/validar-datos', PagoServiciosController.validarDatos);

/**
 * POST /api/pago-servicios/procesar-pago
 * Procesar el pago de un servicio
 */
router.post('/procesar-pago', PagoServiciosController.procesarPago);

// =====================================
// RUTAS DE HISTORIAL (Requieren autenticación)
// =====================================

/**
 * GET /api/pago-servicios/historial/:idPersona
 * Obtener historial de pagos de una persona
 */
router.get('/historial/:idPersona', PagoServiciosController.getHistorialPagos);

/**
 * GET /api/pago-servicios/comprobante/:idPagser
 * Obtener comprobante de un pago específico
 */
router.get('/comprobante/:idPagser', PagoServiciosController.getComprobante);

module.exports = router;