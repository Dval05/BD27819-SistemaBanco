const limiteTransaccionalRepository = require('../repositories/limite-transaccional.repository');

/**
 * Limite Transaccional Service
 * Lógica de negocio para validación de límites de transacciones
 */
class LimiteTransaccionalService {
  /**
   * Obtiene los límites de una cuenta
   * @param {string} idCuenta - ID de la cuenta
   * @returns {Promise<Object>} Respuesta con límites
   */
  async obtenerLimitesCuenta(idCuenta) {
    try {
      if (!idCuenta || typeof idCuenta !== 'string') {
        return {
          exito: false,
          mensaje: 'ID de cuenta inválido',
          datos: []
        };
      }

      const limites = await limiteTransaccionalRepository.obtenerLimitesPorCuenta(idCuenta);

      if (!limites || limites.length === 0) {
        return {
          exito: false,
          mensaje: 'No se encontraron límites configurados para esta cuenta',
          datos: []
        };
      }

      return {
        exito: true,
        mensaje: 'Límites obtenidos exitosamente',
        datos: limites.map(limite => this._formatarLimite(limite))
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al obtener límites: ${error.message}`,
        datos: []
      };
    }
  }

  /**
   * Obtiene el límite de una cuenta para un tipo de transacción específico
   * @param {string} idCuenta - ID de la cuenta
   * @param {string} tipoTransaccion - Tipo de transacción ('00'=Transferencia, '01'=Retiro, '02'=Pago)
   * @returns {Promise<Object>} Respuesta con límite
   */
  async obtenerLimiteTransaccion(idCuenta, tipoTransaccion) {
    try {
      if (!idCuenta || typeof idCuenta !== 'string') {
        return {
          exito: false,
          mensaje: 'ID de cuenta inválido',
          datos: null
        };
      }

      if (!tipoTransaccion || typeof tipoTransaccion !== 'string') {
        return {
          exito: false,
          mensaje: 'Tipo de transacción inválido',
          datos: null
        };
      }

      const limite = await limiteTransaccionalRepository.obtenerLimitePorCuentaYTipo(
        idCuenta,
        tipoTransaccion
      );

      if (!limite) {
        return {
          exito: false,
          mensaje: 'Límite no configurado para este tipo de transacción',
          datos: null
        };
      }

      return {
        exito: true,
        mensaje: 'Límite obtenido exitosamente',
        datos: this._formatarLimite(limite)
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al obtener límite: ${error.message}`,
        datos: null
      };
    }
  }

  /**
   * Valida si una transacción cumple con los límites de la cuenta
   * @param {string} idCuenta - ID de la cuenta
   * @param {string} tipoTransaccion - Tipo de transacción
   * @param {number} monto - Monto de la transacción
   * @returns {Promise<Object>} Resultado de validación con detalles
   */
  async validarLimiteTransaccion(idCuenta, tipoTransaccion, monto) {
    try {
      // Validaciones básicas
      if (!idCuenta || typeof idCuenta !== 'string') {
        return {
          valido: false,
          mensaje: 'ID de cuenta inválido',
          detalles: null
        };
      }

      if (!tipoTransaccion || typeof tipoTransaccion !== 'string') {
        return {
          valido: false,
          mensaje: 'Tipo de transacción inválido',
          detalles: null
        };
      }

      if (typeof monto !== 'number' || monto <= 0) {
        return {
          valido: false,
          mensaje: 'Monto debe ser mayor a 0',
          detalles: null
        };
      }

      // Verificar cumplimiento de límites
      const resultadoVerificacion = await limiteTransaccionalRepository.verificarCumplimientoLimites(
        idCuenta,
        tipoTransaccion,
        monto
      );

      if (!resultadoVerificacion.cumple) {
        return {
          valido: false,
          mensaje: resultadoVerificacion.razon,
          detalles: {
            limiteMaximo: resultadoVerificacion.limiteMaximo,
            limiteDisponible: resultadoVerificacion.limiteDisponible,
            cantidadDisponible: resultadoVerificacion.cantidadDisponible
          }
        };
      }

      return {
        valido: true,
        mensaje: 'Transacción dentro de los límites permitidos',
        detalles: {
          montoPermitido: true
        }
      };
    } catch (error) {
      return {
        valido: false,
        mensaje: `Error al validar límites: ${error.message}`,
        detalles: null
      };
    }
  }

  /**
   * Obtiene los límites disponibles restantes de una cuenta
   * @param {string} idCuenta - ID de la cuenta
   * @param {string} tipoTransaccion - Tipo de transacción
   * @returns {Promise<Object>} Respuesta con límites disponibles
   */
  async obtenerLimitesDisponibles(idCuenta, tipoTransaccion) {
    try {
      const limite = await limiteTransaccionalRepository.obtenerLimitePorCuentaYTipo(
        idCuenta,
        tipoTransaccion
      );

      if (!limite) {
        return {
          exito: false,
          mensaje: 'No hay límite configurado',
          datos: null
        };
      }

      // Aquí se puede extender la lógica para obtener el total gastado del día
      // y calcular lo disponible restante
      const limiteFormateado = this._formatarLimite(limite);

      return {
        exito: true,
        mensaje: 'Límites disponibles obtenidos',
        datos: {
          montoMaximoDiario: limiteFormateado.montoMaximoDiario,
          montoMaximoTransaccion: limiteFormateado.montoMaximoTransaccion,
          cantidadMaximaDiaria: limiteFormateado.cantidadMaximaDiaria,
          // Estos valores se calcularían con información del repositorio
          montoDisponibleDiario: limiteFormateado.montoMaximoDiario,
          cantidadDisponibleDiaria: limiteFormateado.cantidadMaximaDiaria
        }
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al obtener límites disponibles: ${error.message}`,
        datos: null
      };
    }
  }

  /**
   * Formatea un límite para respuesta
   * @param {Object} limite - Datos del límite
   * @returns {Object} Límite formateado
   * @private
   */
  _formatarLimite(limite) {
    const tiposTransaccion = {
      '00': 'Transferencia',
      '01': 'Retiro',
      '02': 'Pago de Servicios'
    };

    return {
      id: limite.id_limite,
      tipoTransaccion: tiposTransaccion[limite.lim_tipo_transaccion] || limite.lim_tipo_transaccion,
      montoMaximoDiario: parseFloat(limite.lim_monto_maximo_diario),
      montoMaximoTransaccion: parseFloat(limite.lim_monto_maximo_transaccion),
      cantidadMaximaDiaria: limite.lim_cantidad_maxima_diaria,
      fechaActualizacion: limite.lim_fecha_actualizacion
    };
  }
}

module.exports = new LimiteTransaccionalService();
