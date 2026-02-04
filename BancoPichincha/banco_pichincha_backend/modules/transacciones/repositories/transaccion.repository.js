/**
 * Repositorio de Transacciones
 * Acceso a datos de la tabla TRANSACCION y sus hijas
 */

const { supabase } = require('../../../shared/config/database.config');

const transaccionRepository = {
  /**
   * Obtener todas las transacciones de una cuenta
   * @param {string} idCuenta - ID de la cuenta
   * @returns {Promise<Array>} Lista de transacciones
   */
  findByCuenta: async (idCuenta) => {
    const { data, error } = await supabase
      .from('transaccion')
      .select('*')
      .eq('id_cuenta', idCuenta)
      .order('tra_fecha_hora', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Obtener transacciones de una cuenta con paginación
   * @param {string} idCuenta - ID de la cuenta
   * @param {number} limit - Cantidad de registros
   * @param {number} offset - Desplazamiento
   * @returns {Promise<Array>} Lista de transacciones
   */
  findByCuentaPaginated: async (idCuenta, limit = 50, offset = 0) => {
    const { data, error } = await supabase
      .from('transaccion')
      .select('*')
      .eq('id_cuenta', idCuenta)
      .order('tra_fecha_hora', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  },

  /**
   * Obtener transacciones por rango de fechas
   * @param {string} idCuenta - ID de la cuenta
   * @param {string} fechaInicio - Fecha inicio (YYYY-MM-DD)
   * @param {string} fechaFin - Fecha fin (YYYY-MM-DD)
   * @returns {Promise<Array>} Lista de transacciones
   */
  findByFechaRange: async (idCuenta, fechaInicio, fechaFin) => {
    const { data, error } = await supabase
      .from('transaccion')
      .select('*')
      .eq('id_cuenta', idCuenta)
      .gte('tra_fecha_hora', fechaInicio)
      .lte('tra_fecha_hora', fechaFin)
      .order('tra_fecha_hora', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Obtener transacciones por tipo
   * Tipos: '00' = Depósito, '01' = Retiro, '02' = Transferencia, '03' = Pago
   * @param {string} idCuenta - ID de la cuenta
   * @param {string} tipo - Tipo de transacción
   * @returns {Promise<Array>} Lista de transacciones
   */
  findByTipo: async (idCuenta, tipo) => {
    const { data, error } = await supabase
      .from('transaccion')
      .select('*')
      .eq('id_cuenta', idCuenta)
      .eq('tra_tipo', tipo)
      .order('tra_fecha_hora', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Obtener una transacción por ID
   * @param {string} idTra - ID de la transacción
   * @returns {Promise<Object|null>} Transacción encontrada
   */
  findById: async (idTra) => {
    const { data, error } = await supabase
      .from('transaccion')
      .select('*')
      .eq('id_tra', idTra)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Crear una nueva transacción
   * @param {Object} transaccion - Datos de la transacción
   * @returns {Promise<Object>} Transacción creada
   */
  create: async (transaccion) => {
    const { data, error } = await supabase
      .from('transaccion')
      .insert(transaccion)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Obtener depósitos de una cuenta (tabla DEPOSITO)
   * @param {string} idCuenta - ID de la cuenta
   * @returns {Promise<Array>} Lista de depósitos
   */
  findDepositosByCuenta: async (idCuenta) => {
    const { data, error } = await supabase
      .from('deposito')
      .select('*')
      .eq('id_cuenta', idCuenta)
      .order('tra_fecha_hora', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Obtener transferencias de una cuenta (tabla TRANSFERENCIA)
   * @param {string} idCuenta - ID de la cuenta
   * @returns {Promise<Array>} Lista de transferencias
   */
  findTransferenciasByCuenta: async (idCuenta) => {
    const { data, error } = await supabase
      .from('transferencia')
      .select('*')
      .eq('id_cuenta', idCuenta)
      .order('tra_fecha_hora', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Obtener retiros sin tarjeta de una cuenta
   * @param {string} idCuenta - ID de la cuenta
   * @returns {Promise<Array>} Lista de retiros
   */
  findRetirosSinTarjetaByCuenta: async (idCuenta) => {
    const { data, error } = await supabase
      .from('retiro_sin_tarjeta')
      .select('*')
      .eq('id_cuenta', idCuenta)
      .order('tra_fecha_hora', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Obtener pagos de servicios de una cuenta
   * @param {string} idCuenta - ID de la cuenta
   * @returns {Promise<Array>} Lista de pagos
   */
  findPagoServiciosByCuenta: async (idCuenta) => {
    const { data, error } = await supabase
      .from('transaccion')
      .select(`
        id_tra,
        tra_fecha_hora,
        tra_monto,
        tra_descripcion,
        tra_estado,
        pago_servicios!inner (
          id_pagser,
          id_srv,
          id_subtipo,
          pagser_estado,
          pagser_comprobante,
          pagser_referencia
        )
      `)
      .eq('id_cuenta', idCuenta)
      .eq('tra_tipo', '03')
      .order('tra_fecha_hora', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Contar transacciones de una cuenta
   * @param {string} idCuenta - ID de la cuenta
   * @returns {Promise<number>} Total de transacciones
   */
  countByCuenta: async (idCuenta) => {
    const { count, error } = await supabase
      .from('transaccion')
      .select('*', { count: 'exact', head: true })
      .eq('id_cuenta', idCuenta);

    if (error) throw error;
    return count || 0;
  }
};

module.exports = transaccionRepository;
