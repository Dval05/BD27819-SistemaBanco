const connection = require('../../../shared/config/database.config');

/**
 * Limite Transaccional Repository
 * Gestiona operaciones de límites de transacciones por cuenta
 */
class LimiteTransaccionalRepository {
  /**
   * Obtiene el límite transaccional de una cuenta para un tipo de transacción
   * @param {string} idCuenta - ID de la cuenta
   * @param {string} tipoTransaccion - Tipo de transacción ('00'=Transferencia, '01'=Retiro, '02'=Pago Servicios)
   * @returns {Promise<Object>} Límite transaccional
   */
  async obtenerLimitePorCuentaYTipo(idCuenta, tipoTransaccion) {
    try {
      const query = `
        SELECT 
          id_limite,
          id_cuenta,
          lim_tipo_transaccion,
          lim_monto_maximo_diario,
          lim_monto_maximo_transaccion,
          lim_cantidad_maxima_diaria,
          lim_fecha_actualizacion
        FROM LIMITE_TRANSACCIONAL
        WHERE id_cuenta = $1 AND lim_tipo_transaccion = $2
      `;
      const result = await connection.query(query, [idCuenta, tipoTransaccion]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al obtener límite transaccional: ${error.message}`);
    }
  }

  /**
   * Obtiene todos los límites de una cuenta
   * @param {string} idCuenta - ID de la cuenta
   * @returns {Promise<Array>} Lista de límites transaccionales
   */
  async obtenerLimitesPorCuenta(idCuenta) {
    try {
      const query = `
        SELECT 
          id_limite,
          id_cuenta,
          lim_tipo_transaccion,
          lim_monto_maximo_diario,
          lim_monto_maximo_transaccion,
          lim_cantidad_maxima_diaria,
          lim_fecha_actualizacion
        FROM LIMITE_TRANSACCIONAL
        WHERE id_cuenta = $1
        ORDER BY lim_tipo_transaccion ASC
      `;
      const result = await connection.query(query, [idCuenta]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener límites de la cuenta: ${error.message}`);
    }
  }

  /**
   * Crea un nuevo límite transaccional
   * @param {Object} datosLimite - Datos del límite
   * @returns {Promise<Object>} Límite creado
   */
  async crearLimite(datosLimite) {
    try {
      const {
        idLimite,
        idCuenta,
        limTipoTransaccion,
        limMontoMaximoDiario,
        limMontoMaximoTransaccion,
        limCantidadMaximaDiaria
      } = datosLimite;

      const query = `
        INSERT INTO LIMITE_TRANSACCIONAL (
          id_limite,
          id_cuenta,
          lim_tipo_transaccion,
          lim_monto_maximo_diario,
          lim_monto_maximo_transaccion,
          lim_cantidad_maxima_diaria
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await connection.query(query, [
        idLimite,
        idCuenta,
        limTipoTransaccion,
        limMontoMaximoDiario,
        limMontoMaximoTransaccion,
        limCantidadMaximaDiaria
      ]);

      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al crear límite transaccional: ${error.message}`);
    }
  }

  /**
   * Actualiza un límite transaccional
   * @param {string} idLimite - ID del límite
   * @param {Object} datosActualizacion - Datos a actualizar
   * @returns {Promise<Object>} Límite actualizado
   */
  async actualizarLimite(idLimite, datosActualizacion) {
    try {
      const campos = [];
      const valores = [];
      let parametro = 1;

      if (datosActualizacion.limMontoMaximoDiario !== undefined) {
        campos.push(`lim_monto_maximo_diario = $${parametro}`);
        valores.push(datosActualizacion.limMontoMaximoDiario);
        parametro++;
      }
      if (datosActualizacion.limMontoMaximoTransaccion !== undefined) {
        campos.push(`lim_monto_maximo_transaccion = $${parametro}`);
        valores.push(datosActualizacion.limMontoMaximoTransaccion);
        parametro++;
      }
      if (datosActualizacion.limCantidadMaximaDiaria !== undefined) {
        campos.push(`lim_cantidad_maxima_diaria = $${parametro}`);
        valores.push(datosActualizacion.limCantidadMaximaDiaria);
        parametro++;
      }

      if (campos.length === 0) {
        throw new Error('No hay datos para actualizar');
      }

      campos.push(`lim_fecha_actualizacion = NOW()`);
      valores.push(idLimite);

      const query = `
        UPDATE LIMITE_TRANSACCIONAL
        SET ${campos.join(', ')}
        WHERE id_limite = $${parametro}
        RETURNING *
      `;

      const result = await connection.query(query, valores);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al actualizar límite transaccional: ${error.message}`);
    }
  }

  /**
   * Verifica si una transacción cumple con los límites configurados
   * @param {string} idCuenta - ID de la cuenta
   * @param {string} tipoTransaccion - Tipo de transacción
   * @param {number} monto - Monto de la transacción
   * @returns {Promise<Object>} Objeto con cumplimiento y detalles
   */
  async verificarCumplimientoLimites(idCuenta, tipoTransaccion, monto) {
    try {
      const limite = await this.obtenerLimitePorCuentaYTipo(idCuenta, tipoTransaccion);

      if (!limite) {
        return {
          cumple: false,
          razon: 'No existe límite configurado para este tipo de transacción'
        };
      }

      if (monto > limite.lim_monto_maximo_transaccion) {
        return {
          cumple: false,
          razon: `Monto excede el límite máximo por transacción: $${limite.lim_monto_maximo_transaccion}`,
          limiteMaximo: limite.lim_monto_maximo_transaccion
        };
      }

      // Verificar límite diario
      const queryDiario = `
        SELECT COALESCE(SUM(tra_monto), 0) as total_diario
        FROM TRANSACCION
        WHERE id_cuenta = $1 
          AND DATE(tra_fecha_hora) = CURRENT_DATE
          AND tra_estado IN ('00', '01')
      `;
      const resultDiario = await connection.query(queryDiario, [idCuenta]);
      const totalDiario = Math.abs(parseFloat(resultDiario.rows[0].total_diario || 0));

      if ((totalDiario + monto) > limite.lim_monto_maximo_diario) {
        return {
          cumple: false,
          razon: `Transacción excedería el límite diario. Disponible: $${(limite.lim_monto_maximo_diario - totalDiario).toFixed(2)}`,
          limiteDisponible: limite.lim_monto_maximo_diario - totalDiario
        };
      }

      // Verificar cantidad diaria
      const queryCantidad = `
        SELECT COUNT(*) as cantidad_diaria
        FROM TRANSACCION
        WHERE id_cuenta = $1 
          AND DATE(tra_fecha_hora) = CURRENT_DATE
          AND tra_estado IN ('00', '01')
      `;
      const resultCantidad = await connection.query(queryCantidad, [idCuenta]);
      const cantidadDiaria = parseInt(resultCantidad.rows[0].cantidad_diaria || 0);

      if ((cantidadDiaria + 1) > limite.lim_cantidad_maxima_diaria) {
        return {
          cumple: false,
          razon: `Se ha alcanzado la cantidad máxima de transacciones diarias: ${limite.lim_cantidad_maxima_diaria}`,
          cantidadDisponible: 0
        };
      }

      return {
        cumple: true,
        mensaje: 'Transacción cumple con todos los límites'
      };
    } catch (error) {
      throw new Error(`Error al verificar límites: ${error.message}`);
    }
  }
}

module.exports = new LimiteTransaccionalRepository();
