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
      
      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }
      
      return data;
    } catch (error) {
      // Si no existe la tabla o hay error, retornar null
      console.log('Limite no encontrado o tabla no existe:', error.message);
      return null;
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
      
      if (error) throw new Error(error.message);
      return data || [];
    } catch (error) {
      console.log('Error al obtener límites:', error.message);
      return [];
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

      if (error) throw new Error(error.message);
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
      const updateData = {
        lim_fecha_actualizacion: new Date().toISOString()
      };

      if (datosActualizacion.limMontoMaximoDiario !== undefined) {
        updateData.lim_monto_maximo_diario = datosActualizacion.limMontoMaximoDiario;
      }
      if (datosActualizacion.limMontoMaximoTransaccion !== undefined) {
        updateData.lim_monto_maximo_transaccion = datosActualizacion.limMontoMaximoTransaccion;
      }
      if (datosActualizacion.limCantidadMaximaDiaria !== undefined) {
        updateData.lim_cantidad_maxima_diaria = datosActualizacion.limCantidadMaximaDiaria;
      }

      const { data, error } = await supabase
        .from('limite_transaccional')
        .update(updateData)
        .eq('id_limite', idLimite)
        .select()
        .single();

      if (error) throw new Error(error.message);
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
      const limite = await this.obtenerLimitePorCuentaYTipo(idCuenta, tipoTransaccion);

      if (!limite) {
        // Sin límite configurado, permitir con valores por defecto
        return {
          cumple: true,
          mensaje: 'Sin límite configurado, usando valores por defecto'
        };
      }

      if (monto > limite.lim_monto_maximo_transaccion) {
        return {
          cumple: false,
          razon: `Monto excede el límite máximo por transacción: $${limite.lim_monto_maximo_transaccion}`,
          limiteMaximo: limite.lim_monto_maximo_transaccion
        };
      }

      // Verificar límite diario usando Supabase
      const hoy = new Date().toISOString().split('T')[0];
      const { data: transaccionesHoy, error: errorTrans } = await supabase
        .from('transaccion')
        .select('tra_monto')
        .eq('id_cuenta', idCuenta)
        .gte('tra_fecha_hora', `${hoy}T00:00:00`)
        .in('tra_estado', ['00', '01']);

      let totalDiario = 0;
      let cantidadDiaria = 0;
      
      if (!errorTrans && transaccionesHoy) {
        cantidadDiaria = transaccionesHoy.length;
        totalDiario = transaccionesHoy.reduce((sum, t) => sum + Math.abs(parseFloat(t.tra_monto || 0)), 0);
      }

      if ((totalDiario + monto) > limite.lim_monto_maximo_diario) {
        return {
          cumple: false,
          razon: `Transacción excedería el límite diario. Disponible: $${(limite.lim_monto_maximo_diario - totalDiario).toFixed(2)}`,
          limiteDisponible: limite.lim_monto_maximo_diario - totalDiario
        };
      }

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
      // En caso de error, permitir la transacción
      console.log('Error al verificar límites:', error.message);
      return {
        cumple: true,
        mensaje: 'Verificación de límites omitida por error'
      };
    }
  }
}

module.exports = new LimiteTransaccionalRepository();
