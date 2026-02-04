const limiteService = require('../services/limite-transaccional.service');

/**
 * Limite Transaccional Controller
 * Maneja las peticiones HTTP de límites transaccionales
 * Parte del flujo: Validación de montos
 */
class LimiteTransaccionalController {
  /**
   * GET /api/transferencias/limites/:idCuenta
   * Obtiene todos los límites configurados para una cuenta
   * Params: idCuenta
   * Respuesta: { exito, mensaje, datos: [limites] }
   */
  async obtenerLimitesCuenta(req, res) {
    try {
      const { idCuenta } = req.params;

      if (!idCuenta) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID de cuenta es requerido'
        });
      }

      const resultado = await limiteService.obtenerLimitesCuenta(idCuenta);

      return res.status(resultado.exito ? 200 : 404).json(resultado);
    } catch (error) {
      console.error('Error en obtenerLimitesCuenta:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /api/transferencias/limites/:idCuenta/tipo/:tipoTransaccion
   * Obtiene el límite de una cuenta para un tipo de transacción específico
   * Params: idCuenta, tipoTransaccion ('00'=Transferencia, '01'=Retiro, '02'=Pago)
   * Respuesta: { exito, mensaje, datos: limite }
   */
  async obtenerLimiteTransaccion(req, res) {
    try {
      const { idCuenta, tipoTransaccion } = req.params;

      if (!idCuenta || !tipoTransaccion) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID de cuenta y tipo de transacción son requeridos'
        });
      }

      const tiposValidos = ['00', '01', '02'];
      if (!tiposValidos.includes(tipoTransaccion)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Tipo de transacción inválido. Debe ser: 00 (Transferencia), 01 (Retiro), 02 (Pago)'
        });
      }

      const resultado = await limiteService.obtenerLimiteTransaccion(idCuenta, tipoTransaccion);

      return res.status(resultado.exito ? 200 : 404).json(resultado);
    } catch (error) {
      console.error('Error en obtenerLimiteTransaccion:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * POST /api/transferencias/limites/validar
   * Valida si una transacción cumple con los límites configurados
   * Parte crítica del flujo: Se llamada antes de ejecutar transferencia
   * 
   * Body: {
   *   idCuenta (requerido),
   *   tipoTransaccion (requerido, '00'=Transferencia),
   *   monto (requerido)
   * }
   * 
   * Respuesta: {
   *   valido: boolean,
   *   mensaje: string,
   *   detalles: {
   *     limiteMaximo?: number,
   *     limiteDisponible?: number,
   *     cantidadDisponible?: number
   *   }
   * }
   */
  async validarLimiteTransaccion(req, res) {
    try {
      const { idCuenta, tipoTransaccion, monto } = req.body;

      // Validación de campos requeridos
      if (!idCuenta || !tipoTransaccion || monto === undefined) {
        return res.status(400).json({
          valido: false,
          mensaje: 'Campos requeridos: idCuenta, tipoTransaccion, monto'
        });
      }

      // Validación de tipos
      if (typeof idCuenta !== 'string' || typeof tipoTransaccion !== 'string' || typeof monto !== 'number') {
        return res.status(400).json({
          valido: false,
          mensaje: 'Tipos de datos inválidos'
        });
      }

      // Validación de tipo de transacción
      const tiposValidos = ['00', '01', '02'];
      if (!tiposValidos.includes(tipoTransaccion)) {
        return res.status(400).json({
          valido: false,
          mensaje: 'Tipo de transacción inválido'
        });
      }

      // Llamar al service para validar
      const resultado = await limiteService.validarLimiteTransaccion(
        idCuenta,
        tipoTransaccion,
        monto
      );

      // Retornar con status apropiado
      const statusCode = resultado.valido ? 200 : 400;
      return res.status(statusCode).json(resultado);
    } catch (error) {
      console.error('Error en validarLimiteTransaccion:', error);
      return res.status(500).json({
        valido: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /api/transferencias/limites/:idCuenta/disponibles
   * Obtiene los límites disponibles restantes de una cuenta
   * Útil para mostrar en la UI cuánto puede transferir el usuario
   * 
   * Params: idCuenta
   * Query: tipoTransaccion (opcional, por defecto '00' = Transferencia)
   * 
   * Respuesta: {
   *   exito: boolean,
   *   mensaje: string,
   *   datos: {
   *     montoMaximoDiario: number,
   *     montoMaximoTransaccion: number,
   *     cantidadMaximaDiaria: number,
   *     montoDisponibleDiario: number,
   *     cantidadDisponibleDiaria: number
   *   }
   * }
   */
  async obtenerLimitesDisponibles(req, res) {
    try {
      const { idCuenta } = req.params;
      const { tipoTransaccion = '00' } = req.query;

      if (!idCuenta) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID de cuenta es requerido'
        });
      }

      const tiposValidos = ['00', '01', '02'];
      if (!tiposValidos.includes(tipoTransaccion)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Tipo de transacción inválido'
        });
      }

      const resultado = await limiteService.obtenerLimitesDisponibles(idCuenta, tipoTransaccion);

      return res.status(resultado.exito ? 200 : 404).json(resultado);
    } catch (error) {
      console.error('Error en obtenerLimitesDisponibles:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /api/transferencias/limites/persona/:idPersona/disponibles
   * Obtiene límites disponibles por idPersona (obtiene primero la cuenta)
   * 
   * Params: idPersona
   * Query: tipoTransaccion (opcional, por defecto '00')
   */
  async obtenerLimitesDisponiblesPorPersona(req, res) {
    try {
      const { idPersona } = req.params;
      const { tipoTransaccion = '00' } = req.query;

      if (!idPersona) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID de persona es requerido'
        });
      }

      const tiposValidos = ['00', '01', '02'];
      if (!tiposValidos.includes(tipoTransaccion)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Tipo de transacción inválido'
        });
      }

      // Obtener primero la cuenta de la persona
      const resultado = await limiteService.obtenerLimitesDisponiblesPorPersona(idPersona, tipoTransaccion);

      return res.status(resultado.exito ? 200 : 404).json(resultado);
    } catch (error) {
      console.error('Error en obtenerLimitesDisponiblesPorPersona:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * POST /api/transferencias/limites/guardar
   * Guarda los límites de transferencia para una persona
   * 
   * Body: {
   *   idPersona (requerido),
   *   montoMaximoDiario (número),
   *   montoMaximoTransaccion (número),
   *   cantidadMaximaDiaria (número)
   * }
   */
  async guardarLimites(req, res) {
    try {
      const { idPersona, montoMaximoDiario, montoMaximoTransaccion, cantidadMaximaDiaria } = req.body;

      // Validaciones
      if (!idPersona) {
        return res.status(400).json({
          exito: false,
          codigo: 'PERSONA_REQUERIDA',
          mensaje: 'ID de persona es requerido'
        });
      }

      if (!montoMaximoDiario || !montoMaximoTransaccion || !cantidadMaximaDiaria) {
        return res.status(400).json({
          exito: false,
          codigo: 'CAMPOS_REQUERIDOS',
          mensaje: 'Todos los límites son requeridos'
        });
      }

      const resultado = await limiteService.guardarLimites(
        idPersona,
        {
          montoMaximoDiario: parseFloat(montoMaximoDiario),
          montoMaximoTransaccion: parseFloat(montoMaximoTransaccion),
          cantidadMaximaDiaria: parseInt(cantidadMaximaDiaria)
        }
      );

      return res.status(resultado.exito ? 201 : 400).json(resultado);
    } catch (error) {
      console.error('Error en guardarLimites:', error);
      return res.status(500).json({
        exito: false,
        codigo: 'ERROR_SERVIDOR',
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }}

module.exports = new LimiteTransaccionalController();