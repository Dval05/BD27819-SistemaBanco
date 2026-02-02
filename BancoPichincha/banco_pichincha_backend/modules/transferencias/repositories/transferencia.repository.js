const connection = require('../../../shared/config/database.config');

/**
 * Transferencia Repository
 * Gestiona operaciones CRUD de transferencias bancarias internas e interbancarias
 */
class TransferenciaRepository {
  /**
   * Obtiene todas las transferencias de una cuenta
   * @param {string} idCuenta - ID de la cuenta
   * @param {number} limite - Límite de registros
   * @param {number} offset - Desplazamiento
   * @returns {Promise<Array>} Lista de transferencias
   */
  async obtenerTransferenciasPorCuenta(idCuenta, limite = 20, offset = 0) {
    try {
      const query = `
        SELECT 
          t.id_tra,
          t.id_trf,
          t.id_cuenta,
          t.tra_fecha_hora,
          t.tra_monto,
          t.tra_tipo,
          t.tra_descripcion,
          t.tra_estado,
          t.id_banco_destino,
          t.id_contacto,
          t.trf_numero_cuenta_destino,
          t.trf_email_destino,
          t.trf_tipo_transferencia,
          t.trf_fecha_procesamiento,
          t.trf_comision,
          b.ban_nombre,
          c.con_alias,
          c.con_nombre_beneficiario
        FROM TRANSFERENCIA t
        LEFT JOIN BANCO b ON t.id_banco_destino = b.id_banco
        LEFT JOIN CONTACTO c ON t.id_contacto = c.id_contacto
        WHERE t.id_cuenta = $1
        ORDER BY t.tra_fecha_hora DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await connection.query(query, [idCuenta, limite, offset]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener transferencias: ${error.message}`);
    }
  }

  /**
   * Obtiene una transferencia específica
   * @param {string} idTra - ID de la transacción
   * @param {string} idTrf - ID de la transferencia
   * @returns {Promise<Object>} Datos de la transferencia
   */
  async obtenerTransferenciaPorId(idTra, idTrf) {
    try {
      const query = `
        SELECT 
          t.id_tra,
          t.id_trf,
          t.id_cuenta,
          t.tra_fecha_hora,
          t.tra_monto,
          t.tra_tipo,
          t.tra_descripcion,
          t.tra_estado,
          t.id_banco_destino,
          t.id_contacto,
          t.trf_numero_cuenta_destino,
          t.trf_email_destino,
          t.trf_tipo_identificacion_destino,
          t.trf_identificacion_destino,
          t.trf_tipo_cuenta_destino,
          t.trf_tipo_transferencia,
          t.trf_fecha_procesamiento,
          t.trf_comision,
          t.id_tra_destino,
          b.ban_nombre,
          b.ban_codigo,
          c.con_nombre_beneficiario,
          c.con_alias
        FROM TRANSFERENCIA t
        LEFT JOIN BANCO b ON t.id_banco_destino = b.id_banco
        LEFT JOIN CONTACTO c ON t.id_contacto = c.id_contacto
        WHERE t.id_tra = $1 AND t.id_trf = $2
      `;
      const result = await connection.query(query, [idTra, idTrf]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al obtener transferencia: ${error.message}`);
    }
  }

  /**
   * Crea una nueva transferencia
   * @param {Object} datosTransferencia - Datos de la transferencia
   * @returns {Promise<Object>} Transferencia creada
   */
  async crearTransferencia(datosTransferencia) {
    try {
      const {
        idTra,
        idTrf,
        idCuenta,
        idInvmov,
        traFechaHora,
        traMonto,
        traTipo,
        traDescripcion,
        traEstado,
        idBancoDestino,
        idContacto,
        trfNumeroCuentaDestino,
        trfEmailDestino,
        trfTipoIdentificacionDestino,
        trfIdentificacionDestino,
        trfTipoCuentaDestino,
        trfTipoTransferencia,
        trfComision,
        idTraDestino
      } = datosTransferencia;

      const query = `
        INSERT INTO TRANSFERENCIA (
          id_tra,
          id_trf,
          id_cuenta,
          id_invmov,
          tra_fecha_hora,
          tra_monto,
          tra_tipo,
          tra_descripcion,
          tra_estado,
          id_banco_destino,
          id_contacto,
          trf_numero_cuenta_destino,
          trf_email_destino,
          trf_tipo_identificacion_destino,
          trf_identificacion_destino,
          trf_tipo_cuenta_destino,
          trf_tipo_transferencia,
          trf_comision,
          id_tra_destino
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *
      `;

      const result = await connection.query(query, [
        idTra,
        idTrf,
        idCuenta,
        idInvmov,
        traFechaHora,
        traMonto,
        traTipo,
        traDescripcion,
        traEstado,
        idBancoDestino,
        idContacto,
        trfNumeroCuentaDestino,
        trfEmailDestino,
        trfTipoIdentificacionDestino,
        trfIdentificacionDestino,
        trfTipoCuentaDestino,
        trfTipoTransferencia,
        trfComision,
        idTraDestino
      ]);

      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al crear transferencia: ${error.message}`);
    }
  }

  /**
   * Actualiza el estado de una transferencia
   * @param {string} idTra - ID de la transacción
   * @param {string} idTrf - ID de la transferencia
   * @param {string} nuevoEstado - Nuevo estado
   * @returns {Promise<Object>} Transferencia actualizada
   */
  async actualizarEstadoTransferencia(idTra, idTrf, nuevoEstado) {
    try {
      const query = `
        UPDATE TRANSFERENCIA
        SET tra_estado = $1, trf_fecha_procesamiento = NOW()
        WHERE id_tra = $2 AND id_trf = $3
        RETURNING *
      `;
      const result = await connection.query(query, [nuevoEstado, idTra, idTrf]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al actualizar estado de transferencia: ${error.message}`);
    }
  }

  /**
   * Obtiene transferencias pendientes de procesar
   * @param {number} limite - Límite de registros
   * @returns {Promise<Array>} Lista de transferencias pendientes
   */
  async obtenerTransferenciasPendientes(limite = 50) {
    try {
      const query = `
        SELECT 
          t.id_tra,
          t.id_trf,
          t.id_cuenta,
          t.tra_monto,
          t.tra_descripcion,
          t.trf_numero_cuenta_destino,
          t.trf_email_destino,
          t.trf_tipo_transferencia,
          t.trf_comision,
          b.ban_nombre
        FROM TRANSFERENCIA t
        LEFT JOIN BANCO b ON t.id_banco_destino = b.id_banco
        WHERE t.tra_estado = '00'
        ORDER BY t.tra_fecha_hora ASC
        LIMIT $1
      `;
      const result = await connection.query(query, [limite]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener transferencias pendientes: ${error.message}`);
    }
  }

  /**
   * Obtiene el total de transferencias por estado en un período
   * @param {string} idCuenta - ID de la cuenta
   * @param {Date} fechaInicio - Fecha de inicio
   * @param {Date} fechaFin - Fecha de fin
   * @returns {Promise<Object>} Resumen de transferencias
   */
  async obtenerResumenTransferencias(idCuenta, fechaInicio, fechaFin) {
    try {
      const query = `
        SELECT 
          tra_estado,
          COUNT(*) as cantidad,
          SUM(ABS(tra_monto)) as monto_total,
          SUM(trf_comision) as comision_total,
          CASE 
            WHEN tra_estado = '00' THEN 'Pendiente'
            WHEN tra_estado = '01' THEN 'Completada'
            WHEN tra_estado = '02' THEN 'Fallida'
            WHEN tra_estado = '03' THEN 'Reversada'
          END as estado_descripcion
        FROM TRANSFERENCIA
        WHERE id_cuenta = $1 
          AND tra_fecha_hora BETWEEN $2 AND $3
        GROUP BY tra_estado
      `;
      const result = await connection.query(query, [idCuenta, fechaInicio, fechaFin]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener resumen de transferencias: ${error.message}`);
    }
  }

  /**
   * Obtiene transferencias internas enviadas a otro usuario
   * @param {string} idCuenta - ID de la cuenta origen
   * @param {number} limite - Límite de registros
   * @returns {Promise<Array>} Lista de transferencias internas
   */
  async obtenerTransferenciasInternas(idCuenta, limite = 20) {
    try {
      const query = `
        SELECT 
          t.id_tra,
          t.id_trf,
          t.tra_monto,
          t.tra_descripcion,
          t.tra_fecha_hora,
          t.tra_estado,
          c.con_nombre_beneficiario,
          c.con_alias,
          ct.cta_numero
        FROM TRANSFERENCIA t
        LEFT JOIN CONTACTO c ON t.id_contacto = c.id_contacto
        LEFT JOIN CUENTA ct ON c.con_numero_cuenta = ct.cta_numero
        WHERE t.id_cuenta = $1 
          AND t.trf_tipo_transferencia = '00'
          AND t.id_banco_destino IS NULL
        ORDER BY t.tra_fecha_hora DESC
        LIMIT $2
      `;
      const result = await connection.query(query, [idCuenta, limite]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener transferencias internas: ${error.message}`);
    }
  }

  /**
   * Obtiene transferencias interbancarias
   * @param {string} idCuenta - ID de la cuenta
   * @param {number} limite - Límite de registros
   * @returns {Promise<Array>} Lista de transferencias interbancarias
   */
  async obtenerTransferenciasInterbancarias(idCuenta, limite = 20) {
    try {
      const query = `
        SELECT 
          t.id_tra,
          t.id_trf,
          t.tra_monto,
          t.tra_descripcion,
          t.tra_fecha_hora,
          t.tra_estado,
          t.trf_comision,
          b.ban_nombre,
          b.ban_codigo,
          c.con_nombre_beneficiario,
          c.con_alias
        FROM TRANSFERENCIA t
        LEFT JOIN BANCO b ON t.id_banco_destino = b.id_banco
        LEFT JOIN CONTACTO c ON t.id_contacto = c.id_contacto
        WHERE t.id_cuenta = $1 
          AND t.trf_tipo_transferencia = '01'
          AND t.id_banco_destino IS NOT NULL
        ORDER BY t.tra_fecha_hora DESC
        LIMIT $2
      `;
      const result = await connection.query(query, [idCuenta, limite]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener transferencias interbancarias: ${error.message}`);
    }
  }

  /**
   * Verifica si existe una transferencia duplicada (prevención de duplicados)
   * @param {string} idCuenta - ID de la cuenta
   * @param {number} monto - Monto
   * @param {string} numeroCuentaDestino - Número de cuenta destino
   * @param {Date} fechaHora - Fecha y hora
   * @returns {Promise<boolean>} True si existe duplicado
   */
  async existeTransferenciaDuplicada(idCuenta, monto, numeroCuentaDestino, fechaHora) {
    try {
      const query = `
        SELECT 1
        FROM TRANSFERENCIA
        WHERE id_cuenta = $1 
          AND tra_monto = $2
          AND trf_numero_cuenta_destino = $3
          AND DATE(tra_fecha_hora) = DATE($4)
          AND EXTRACT(HOUR FROM tra_fecha_hora) = EXTRACT(HOUR FROM $4)
        LIMIT 1
      `;
      const result = await connection.query(query, [idCuenta, monto, numeroCuentaDestino, fechaHora]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Error al verificar duplicados: ${error.message}`);
    }
  }

  /**
   * Busca una cuenta por su número
   * @param {string} numeroCuenta - Número de cuenta (10 dígitos)
   * @returns {Promise<Object|null>} Datos de la cuenta o null si no existe
   */
  async buscarCuentaPorNumero(numeroCuenta) {
    try {
      const { supabase } = require('../../../shared/config/database.config');
      
      const { data, error } = await supabase
        .from('cuenta')
        .select(`
          id_cuenta,
          cta_numero,
          cta_tipo,
          cta_estado,
          persona:id_persona (
            per_nombre,
            per_apellido
          )
        `)
        .eq('cta_numero', numeroCuenta)
        .eq('cta_estado', '00')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error buscando cuenta:', error);
        return null;
      }

      if (data) {
        return {
          id_cuenta: data.id_cuenta,
          cta_numero: data.cta_numero,
          cta_tipo: data.cta_tipo,
          nombre_titular: data.persona 
            ? `${data.persona.per_nombre || ''} ${data.persona.per_apellido || ''}`.trim()
            : null
        };
      }

      return null;
    } catch (error) {
      console.error('Error en buscarCuentaPorNumero:', error);
      return null;
    }
  }
}

module.exports = new TransferenciaRepository();
