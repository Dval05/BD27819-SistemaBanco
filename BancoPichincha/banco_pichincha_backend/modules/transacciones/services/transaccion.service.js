/**
 * Servicio de Transacciones
 * Lógica de negocio para transacciones
 */

const transaccionRepository = require('../repositories/transaccion.repository');

// Mapeo de tipos de transacción
const TIPOS_TRANSACCION = {
  '00': 'DEPOSITO',
  '01': 'RETIRO',
  '02': 'TRANSFERENCIA',
  '03': 'PAGO_SERVICIO'
};

// Mapeo de estados de transacción
const ESTADOS_TRANSACCION = {
  '00': 'PENDIENTE',
  '01': 'COMPLETADA',
  '02': 'RECHAZADA',
  '03': 'CANCELADA'
};

const transaccionService = {
  /**
   * Obtener movimientos de una cuenta
   * @param {string} idCuenta - ID de la cuenta
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Array>} Lista de movimientos formateados
   */
  obtenerMovimientos: async (idCuenta, filtros = {}) => {
    const { tipo, fechaInicio, fechaFin, limit, offset } = filtros;

    let transacciones;

    if (fechaInicio && fechaFin) {
      transacciones = await transaccionRepository.findByFechaRange(idCuenta, fechaInicio, fechaFin);
    } else if (tipo) {
      transacciones = await transaccionRepository.findByTipo(idCuenta, tipo);
    } else if (limit) {
      transacciones = await transaccionRepository.findByCuentaPaginated(idCuenta, limit, offset || 0);
    } else {
      transacciones = await transaccionRepository.findByCuenta(idCuenta);
    }

    // Formatear transacciones para el frontend
    return transacciones.map(t => transaccionService.formatearTransaccion(t));
  },

  /**
   * Formatear una transacción para el frontend
   * @param {Object} transaccion - Transacción de la BD
   * @returns {Object} Transacción formateada
   */
  formatearTransaccion: (transaccion) => {
    const tipoDescripcion = transaccionService.obtenerDescripcionTipo(transaccion.tra_tipo);
    const esIngreso = transaccion.tra_tipo === '00' || 
                      (transaccion.tra_tipo === '02' && transaccion.tra_monto > 0);
    
    return {
      id: transaccion.id_tra,
      fecha: transaccion.tra_fecha_hora,
      tipo: TIPOS_TRANSACCION[transaccion.tra_tipo] || 'OTROS',
      tipoDescripcion: tipoDescripcion,
      descripcion: transaccion.tra_descripcion || tipoDescripcion,
      monto: esIngreso ? Math.abs(transaccion.tra_monto) : -Math.abs(transaccion.tra_monto),
      montoOriginal: transaccion.tra_monto,
      estado: ESTADOS_TRANSACCION[transaccion.tra_estado] || 'DESCONOCIDO',
      estadoCodigo: transaccion.tra_estado,
      idCuenta: transaccion.id_cuenta,
      idInvMov: transaccion.id_invmov
    };
  },

  /**
   * Obtener descripción amigable del tipo de transacción
   * @param {string} tipoCodigo - Código del tipo
   * @returns {string} Descripción amigable
   */
  obtenerDescripcionTipo: (tipoCodigo) => {
    const descripciones = {
      '00': 'Depósito',
      '01': 'Retiro',
      '02': 'Transferencia Internet',
      '03': 'Pago de servicios'
    };
    return descripciones[tipoCodigo] || 'Movimiento';
  },

  /**
   * Obtener detalle de una transacción específica
   * @param {string} idTransaccion - ID de la transacción
   * @returns {Promise<Object>} Detalle de la transacción
   */
  obtenerDetalle: async (idTransaccion) => {
    const transaccion = await transaccionRepository.findById(idTransaccion);
    
    if (!transaccion) {
      throw new Error('Transacción no encontrada');
    }

    return transaccionService.formatearTransaccion(transaccion);
  },

  /**
   * Obtener resumen de transacciones de una cuenta
   * @param {string} idCuenta - ID de la cuenta
   * @returns {Promise<Object>} Resumen con totales
   */
  obtenerResumen: async (idCuenta) => {
    const transacciones = await transaccionRepository.findByCuenta(idCuenta);
    const total = await transaccionRepository.countByCuenta(idCuenta);

    const resumen = {
      totalTransacciones: total,
      ingresos: 0,
      egresos: 0,
      porTipo: {}
    };

    transacciones.forEach(t => {
      const tipo = TIPOS_TRANSACCION[t.tra_tipo] || 'OTROS';
      
      // Contabilizar por tipo
      if (!resumen.porTipo[tipo]) {
        resumen.porTipo[tipo] = { cantidad: 0, monto: 0 };
      }
      resumen.porTipo[tipo].cantidad++;
      resumen.porTipo[tipo].monto += parseFloat(t.tra_monto);

      // Contabilizar ingresos/egresos
      if (t.tra_tipo === '00' || (t.tra_tipo === '02' && t.tra_monto > 0)) {
        resumen.ingresos += parseFloat(t.tra_monto);
      } else {
        resumen.egresos += Math.abs(parseFloat(t.tra_monto));
      }
    });

    return resumen;
  },

  /**
   * Obtener tipos de transacción disponibles
   * @returns {Object} Mapeo de tipos
   */
  obtenerTipos: () => {
    return Object.entries(TIPOS_TRANSACCION).map(([codigo, nombre]) => ({
      codigo,
      nombre,
      descripcion: transaccionService.obtenerDescripcionTipo(codigo)
    }));
  }
};

module.exports = transaccionService;
