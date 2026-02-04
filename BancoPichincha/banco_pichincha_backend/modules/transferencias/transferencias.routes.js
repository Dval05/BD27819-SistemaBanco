const express = require('express');
const router = express.Router();

// Importar controllers
const bancoController = require('./controllers/banco.controller');
const contactoController = require('./controllers/contacto.controller');
const limiteTransaccionalController = require('./controllers/limite-transaccional.controller');
const transferenciaController = require('./controllers/transferencia.controller');

/**
 * RUTAS DEL MÓDULO DE TRANSFERENCIAS
 * 
 * Base URL: /api/transferencias
 * 
 * Estructura:
 * - /bancos - Gestión de bancos
 * - /contactos - Gestión de contactos
 * - /limites - Gestión de límites transaccionales
 * - / - Gestión de transferencias (crear, historial, estado)
 */

// ============================================
// RUTAS DE BANCOS
// ============================================
/**
 * GET /api/transferencias/bancos
 * Obtiene lista completa de bancos disponibles para transferencias interbancarias
 */
router.get('/bancos', (req, res) => {
  bancoController.obtenerBancos(req, res);
});

/**
 * GET /api/transferencias/bancos/:idBanco
 * Obtiene datos de un banco específico por ID
 */
router.get('/bancos/:idBanco', (req, res) => {
  bancoController.obtenerBancoPorId(req, res);
});

/**
 * GET /api/transferencias/bancos/codigo/:codigo
 * Obtiene un banco por su código (ej: PICHINCHA, BG)
 */
router.get('/bancos/codigo/:codigo', (req, res) => {
  bancoController.obtenerBancoPorCodigo(req, res);
});

/**
 * POST /api/transferencias/bancos/validar
 * Valida si un banco existe y está activo
 * Body: { idBanco }
 */
router.post('/bancos/validar', (req, res) => {
  bancoController.validarBanco(req, res);
});

/**
 * POST /api/transferencias/validar-cuenta-pichincha
 * Valida si una cuenta existe en Banco Pichincha
 * Body: { numeroCuenta }
 */
router.post('/validar-cuenta-pichincha', (req, res) => {
  transferenciaController.validarCuentaPichincha(req, res);
});

// ============================================
// RUTAS DE CONTACTOS
// ============================================
/**
 * GET /api/transferencias/contactos
 * Obtiene todos los contactos guardados del usuario autenticado
 * Requiere: Autenticación
 */
router.get('/contactos', (req, res) => {
  contactoController.obtenerMisContactos(req, res);
});

/**
 * GET /api/transferencias/contactos/cliente/:clienteId
 * Obtiene todos los contactos de un cliente específico
 */
router.get('/contactos/cliente/:clienteId', (req, res) => {
  contactoController.obtenerContactosPorCliente(req, res);
});

/**
 * GET /api/transferencias/contactos/:idContacto
 * Obtiene un contacto específico
 */
router.get('/contactos/:idContacto', (req, res) => {
  contactoController.obtenerContacto(req, res);
});

/**
 * POST /api/transferencias/contactos
 * Crea un nuevo contacto guardado
 * Requiere: Autenticación
 * 
 * Body: {
 *   conAlias (string, requerido),
 *   conNombreBeneficiario (string, opcional),
 *   conTipoIdentificacion (string, requerido: '00', '01', '02'),
 *   conIdentificacion (string, requerido),
 *   conNumeroCuenta (string, requerido),
 *   conEmail (string, requerido),
 *   conTipoCuenta (string, requerido: '00', '01'),
 *   idBanco (string, opcional - para interbancarias)
 * }
 */
router.post('/contactos', (req, res) => {
  contactoController.crearContacto(req, res);
});

/**
 * PUT /api/transferencias/contactos/:idContacto
 * Actualiza un contacto existente
 * 
 * Body: {
 *   conAlias? (string),
 *   conNombreBeneficiario? (string),
 *   conEmail? (string)
 * }
 */
router.put('/contactos/:idContacto', (req, res) => {
  contactoController.actualizarContacto(req, res);
});

/**
 * DELETE /api/transferencias/contactos/:idContacto
 * Desactiva un contacto (soft delete)
 */
router.delete('/contactos/:idContacto', (req, res) => {
  contactoController.desactivarContacto(req, res);
});

// ============================================
// RUTAS DE LÍMITES TRANSACCIONALES
// ============================================
/**
 * POST /api/transferencias/limites/guardar
 * Guarda los límites de transferencia para una persona
 * IMPORTANTE: Esta ruta debe ir ANTES de las rutas con parámetros
 * 
 * Body: {
 *   idPersona (string, requerido),
 *   montoMaximoDiario (number),
 *   montoMaximoTransaccion (number),
 *   cantidadMaximaDiaria (number)
 * }
 */
router.post('/limites/guardar', (req, res) => {
  limiteTransaccionalController.guardarLimites(req, res);
});

/**
 * POST /api/transferencias/limites/validar
 * ENDPOINT CRÍTICO: Valida si una transacción cumple con los límites
 * Se llama antes de ejecutar transferencia
 * IMPORTANTE: Esta ruta debe ir ANTES de las rutas con parámetros
 * 
 * Body: {
 *   idCuenta (string, requerido),
 *   tipoTransaccion (string, requerido: '00', '01', '02'),
 *   monto (number, requerido)
 * }
 * 
 * Respuesta: {
 *   valido: boolean,
 *   mensaje: string,
 *   detalles: { limiteMaximo?, limiteDisponible?, cantidadDisponible? }
 * }
 */
router.post('/limites/validar', (req, res) => {
  limiteTransaccionalController.validarLimiteTransaccion(req, res);
});

/**
 * GET /api/transferencias/limites/:idCuenta
 * Obtiene todos los límites configurados para una cuenta
 */
router.get('/limites/:idCuenta', (req, res) => {
  limiteTransaccionalController.obtenerLimitesCuenta(req, res);
});

/**
 * GET /api/transferencias/limites/:idCuenta/tipo/:tipoTransaccion
 * Obtiene el límite de una cuenta para un tipo de transacción específico
 * tipoTransaccion: '00' (Transferencia), '01' (Retiro), '02' (Pago)
 */
router.get('/limites/:idCuenta/tipo/:tipoTransaccion', (req, res) => {
  limiteTransaccionalController.obtenerLimiteTransaccion(req, res);
});

/**
 * GET /api/transferencias/limites/:idCuenta/disponibles
 * Obtiene los límites disponibles restantes (para mostrar en UI)
 * Query: tipoTransaccion (opcional, default '00')
 */
router.get('/limites/:idCuenta/disponibles', (req, res) => {
  limiteTransaccionalController.obtenerLimitesDisponibles(req, res);
});

/**
 * GET /api/transferencias/limites/persona/:idPersona/disponibles
 * ALTERNATIVA: Obtiene los límites disponibles por idPersona (en lugar de idCuenta)
 * Necesita obtener primero la cuenta por id_persona
 */
router.get('/limites/persona/:idPersona/disponibles', (req, res) => {
  limiteTransaccionalController.obtenerLimitesDisponiblesPorPersona(req, res);
});

// ============================================
// RUTAS DE TRANSFERENCIAS (PRINCIPAL)
// ============================================
/**
 * GET /api/transferencias/historial/:idCuenta
 * Obtiene el historial completo de transferencias de una cuenta
 * Query: pagina=1, porPagina=20
 */
router.get('/historial/:idCuenta', (req, res) => {
  transferenciaController.obtenerHistorial(req, res);
});

/**
 * GET /api/transferencias/historial/:idCuenta/internas
 * Obtiene solo transferencias INTERNAS (entre cuentas Pichincha)
 * Query: limite=20
 */
router.get('/historial/:idCuenta/internas', (req, res) => {
  transferenciaController.obtenerTransferenciasInternas(req, res);
});

/**
 * GET /api/transferencias/historial/:idCuenta/interbancarias
 * Obtiene solo transferencias INTERBANCARIAS (a otros bancos)
 * Query: limite=20
 */
router.get('/historial/:idCuenta/interbancarias', (req, res) => {
  transferenciaController.obtenerTransferenciasInterbancarias(req, res);
});

/**
 * GET /api/transferencias/estado/:idTra/:idTrf
 * Obtiene el estado actual de una transferencia específica
 */
router.get('/estado/:idTra/:idTrf', (req, res) => {
  transferenciaController.obtenerEstadoTransferencia(req, res);
});

/**
 * POST /api/transferencias/crear
 * ⭐ ENDPOINT PRINCIPAL DEL FLUJO DE TRANSFERENCIAS
 * 
 * Ejecuta la transferencia completa con todas las validaciones:
 * - Validación de datos básicos
 * - Validación de monto (> 0, saldo suficiente, límite máximo $15,000)
 * - Validación de límites transaccionales
 * - Prevención de duplicados
 * - Validación de banco destino (si es interbancaria)
 * - Guardado de contacto (opcional)
 * - Cálculo de comisiones
 * - Creación de registros
 * 
 * Requiere: Autenticación
 * 
 * Body: {
 *   idCuenta (string, requerido) - Cuenta origen,
 *   idPersona (string, requerido) - Usuario,
 *   monto (number, requerido),
 *   descripcion (string, requerido),
 *   tipoTransferencia (string, requerido: '00' o '01'),
 *   saldoDisponible (number, requerido),
 *   saldoDisponibleAnterior (number, requerido),
 *   cuentaDestino: {
 *     numeroCuenta (string, requerido),
 *     email (string, requerido),
 *     tipoIdentificacion (string, requerido),
 *     identificacion (string, requerido),
 *     tipoCuenta (string, requerido),
 *     nombreBeneficiario? (string),
 *     idBanco? (string, requerido si tipo='01'),
 *     idContacto? (string)
 *   },
 *   guardarContacto?: {
 *     guardar (boolean),
 *     alias (string),
 *     nombreBeneficiario (string)
 *   }
 * }
 * 
 * Respuesta exitosa (201):
 * {
 *   exito: true,
 *   codigo: 'TRANSFERENCIA_CREADA',
 *   mensaje: string,
 *   datos: {
 *     idTransferencia,
 *     idTransaccion,
 *     transferencia: {...},
 *     resumen: {
 *       montoTransferencia,
 *       comisiones,
 *       montoTotal,
 *       saldoAnterior,
 *       saldoNuevo,
 *       timestamp,
 *       tipoTransferencia,
 *       contactoGuardado
 *     }
 *   }
 * }
 * 
 * Respuesta error:
 * {
 *   exito: false,
 *   codigo: 'CODIGO_ESPECIFICO',
 *   mensaje: string,
 *   detalles?: {...}
 * }
 */
router.post('/crear', (req, res) => {
  transferenciaController.crearTransferencia(req, res);
});

/**
 * DELETE /api/transferencias/:idTra/:idTrf/cancelar
 * Cancela una transferencia pendiente (solo si está en estado '00')
 * Cambia estado a '03' (Reversada)
 */
router.delete('/:idTra/:idTrf/cancelar', (req, res) => {
  transferenciaController.cancelarTransferencia(req, res);
});

// ============================================
// MIDDLEWARE DE ERROR
// ============================================
/**
 * Manejo de rutas no encontradas
 */
router.use((req, res) => {
  res.status(404).json({
    exito: false,
    mensaje: 'Ruta no encontrada',
    ruta: req.originalUrl
  });
});

module.exports = router;
