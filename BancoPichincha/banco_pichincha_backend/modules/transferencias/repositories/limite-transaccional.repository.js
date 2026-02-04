const { supabase } = require('../../../shared/config/database.config');

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
      const { data, error } = await supabase
        .from('limite_transaccional')
        .select('*')
        .eq('id_cuenta', idCuenta)
        .eq('lim_tipo_transaccion', tipoTransaccion)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
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
      const { data, error } = await supabase
        .from('limite_transaccional')
        .select('*')
        .eq('id_cuenta', idCuenta)
        .order('lim_tipo_transaccion', { ascending: true });

      if (error) throw error;
      return data || [];
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

      const { data, error } = await supabase
        .from('limite_transaccional')
        .insert({
          id_limite: idLimite,
          id_cuenta: idCuenta,
          lim_tipo_transaccion: limTipoTransaccion,
          lim_monto_maximo_diario: limMontoMaximoDiario,
          lim_monto_maximo_transaccion: limMontoMaximoTransaccion,
          lim_cantidad_maxima_diaria: limCantidadMaximaDiaria
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const updateData = {};

      if (datosActualizacion.limMontoMaximoDiario !== undefined) {
        updateData.lim_monto_maximo_diario = datosActualizacion.limMontoMaximoDiario;
      }
      if (datosActualizacion.limMontoMaximoTransaccion !== undefined) {
        updateData.lim_monto_maximo_transaccion = datosActualizacion.limMontoMaximoTransaccion;
      }
      if (datosActualizacion.limCantidadMaximaDiaria !== undefined) {
        updateData.lim_cantidad_maxima_diaria = datosActualizacion.limCantidadMaximaDiaria;
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error('No hay datos para actualizar');
      }

      const { data, error } = await supabase
        .from('limite_transaccional')
        .update(updateData)
        .eq('id_limite', idLimite)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      let limite = await this.obtenerLimitePorCuentaYTipo(idCuenta, tipoTransaccion);

      // Si no existe límite configurado, usar límites por defecto
      if (!limite) {
        console.log('⚠️ No existe límite configurado, usando límites por defecto');
        limite = {
          lim_monto_maximo_transaccion: 5000,
          lim_monto_maximo_diario: 15000,
          lim_cantidad_maxima_diaria: 20
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
      const hoy = new Date().toISOString().split('T')[0];
      const { data: dataDiario, error: errorDiario } = await supabase
        .from('transaccion')
        .select('tra_monto')
        .eq('id_cuenta', idCuenta)
        .gte('tra_fecha_hora', hoy)
        .in('tra_estado', ['00', '01']);

      if (errorDiario) throw errorDiario;
      const totalDiario = Math.abs(
        (dataDiario || []).reduce((sum, t) => sum + parseFloat(t.tra_monto || 0), 0)
      );

      if ((totalDiario + monto) > limite.lim_monto_maximo_diario) {
        return {
          cumple: false,
          razon: `Transacción excedería el límite diario. Disponible: $${(limite.lim_monto_maximo_diario - totalDiario).toFixed(2)}`,
          limiteDisponible: limite.lim_monto_maximo_diario - totalDiario
        };
      }

      // Verificar cantidad diaria
      const { data: dataCantidad, error: errorCantidad } = await supabase
        .from('transaccion')
        .select('id_tra', { count: 'exact' })
        .eq('id_cuenta', idCuenta)
        .gte('tra_fecha_hora', hoy)
        .in('tra_estado', ['00', '01']);

      if (errorCantidad) throw errorCantidad;
      const cantidadDiaria = dataCantidad?.length || 0;

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

  /**
   * Obtiene las cuentas de una persona
   * @param {string} idPersona - ID de la persona
   * @returns {Promise<Array>} Lista de cuentas
   */
  async obtenerCuentasPorPersona(idPersona) {
    try {
      const { data, error } = await supabase
        .from('cuenta')
        .select('*')
        .eq('id_persona', idPersona)
        .eq('cue_estado', '00')
        .order('cue_fecha_apertura', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Error al obtener cuentas por persona: ${error.message}`);
    }
  }

  /**
   * Guarda o actualiza los límites de una cuenta
   * Si existe, actualiza; si no, crea
   * @param {string} idCuenta - ID de la cuenta
   * @param {string} tipoTransaccion - Tipo de transacción ('00'=Transferencia)
   * @param {number} montoMaximoDiario - Monto máximo diario
   * @param {number} montoMaximoTransaccion - Monto máximo por transacción
   * @param {number} cantidadMaximaDiaria - Cantidad máxima diaria
   * @returns {Promise<Object>} Límite guardado/actualizado
   */
  async guardarLimitePorCuenta(
    idCuenta,
    tipoTransaccion,
    montoMaximoDiario,
    montoMaximoTransaccion,
    cantidadMaximaDiaria
  ) {
    try {
      console.log('=== DEBUG guardarLimitePorCuenta ===');
      console.log('idCuenta:', idCuenta);
      console.log('tipoTransaccion:', tipoTransaccion);

      // Verificar si existe límite para esta cuenta y tipo
      const limiteExistente = await this.obtenerLimitePorCuentaYTipo(idCuenta, tipoTransaccion);

      if (limiteExistente) {
        // Actualizar límite existente
        console.log('Actualizando límite existente:', limiteExistente.id_limite);
        const { data, error } = await supabase
          .from('limite_transaccional')
          .update({
            lim_monto_maximo_diario: montoMaximoDiario,
            lim_monto_maximo_transaccion: montoMaximoTransaccion,
            lim_cantidad_maxima_diaria: cantidadMaximaDiaria,
            lim_fecha_actualizacion: new Date().toISOString()
          })
          .eq('id_limite', limiteExistente.id_limite)
          .select()
          .single();

        if (error) throw error;
        console.log('Límite actualizado exitosamente');
        return data;
      } else {
        // Crear nuevo límite
        console.log('Creando nuevo límite');
        
        // Generar ID corto de 20 caracteres: timestamp (13) + caracteres aleatorios (7)
        const timestamp = Date.now().toString().slice(-13);
        const random = Math.random().toString(36).substring(2, 9);
        const idLimite = (timestamp + random).substring(0, 20);

        const { data, error } = await supabase
          .from('limite_transaccional')
          .insert({
            id_limite: idLimite,
            id_cuenta: idCuenta,
            lim_tipo_transaccion: tipoTransaccion,
            lim_monto_maximo_diario: montoMaximoDiario,
            lim_monto_maximo_transaccion: montoMaximoTransaccion,
            lim_cantidad_maxima_diaria: cantidadMaximaDiaria,
            lim_fecha_actualizacion: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        console.log('Límite creado exitosamente');
        return data;
      }
    } catch (error) {
      console.error('Error en guardarLimitePorCuenta:', error);
      throw new Error(`Error al guardar límite: ${error.message}`);
    }
  }}

module.exports = new LimiteTransaccionalRepository();