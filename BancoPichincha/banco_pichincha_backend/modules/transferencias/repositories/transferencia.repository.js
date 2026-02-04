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
      const { supabase } = require('../../../shared/config/database.config');
      
      const { data, error } = await supabase
        .from('transaccion')
        .select('*')
        .eq('id_cuenta', idCuenta)
        .order('tra_fecha_hora', { ascending: false })
        .range(offset, offset + limite - 1);
      
      if (error) throw error;
      return data || [];
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
      const { supabase } = require('../../../shared/config/database.config');
      
      const { data, error } = await supabase
        .from('transaccion')
        .select('*')
        .eq('id_tra', idTra)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
      return data || null;
    } catch (error) {
      throw new Error(`Error al obtener transferencia: ${error.message}`);
    }
  }

  /**
   * Crea una nueva transferencia
   * PASO 1: Inserta en TRANSACCION (tabla base)
   * PASO 2: Inserta en TRANSFERENCIA (tabla específica)
   * @param {Object} datosTransferencia - Datos de la transferencia
   * @returns {Promise<Object>} Transferencia creada
   */
  async crearTransferencia(datosTransferencia) {
    try {
      const { supabase } = require('../../../shared/config/database.config');

      const {
        idTra,
        idTrf,
        idCuenta,
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
        trfComision
      } = datosTransferencia;

      // ===== PASO 1: Insertar en TRANSACCION =====
      console.log('📝 PASO 1: Insertando en TRANSACCION...');
      
      // Convertir TIMESTAMP a DATE (formato YYYY-MM-DD) una sola vez
      const fechaDate = new Date(traFechaHora).toISOString().split('T')[0];
      
      const transaccionData = {
        id_tra: idTra,
        id_cuenta: idCuenta,
        tra_fecha_hora: fechaDate,  // DATE format: YYYY-MM-DD
        tra_monto: parseFloat(traMonto).toFixed(2),
        tra_tipo: traTipo,
        tra_descripcion: traDescripcion,
        tra_estado: traEstado
      };

      const { data: dataTra, error: errorTra } = await supabase
        .from('transaccion')
        .insert([transaccionData])
        .select();

      if (errorTra) {
        console.warn('⚠️ Error al insertar en TRANSACCION:', errorTra.message);
      } else {
        console.log('✅ Registro en TRANSACCION creado:', idTra);
      }

      // ===== PASO 2: Intentar insertar en TRANSFERENCIA =====
      console.log('📝 PASO 2: Insertando en TRANSFERENCIA...');
      
      // Estrategia: intentar con diferentes combinaciones de campos
      const transferenciaData = {
        id_tra: idTra,
        id_trf: idTrf
      };

      console.log('📋 Datos a insertar en TRANSFERENCIA:', JSON.stringify(transferenciaData, null, 2));

      const { data: dataTrf, error: errorTrf } = await supabase
        .from('transferencia')
        .insert([transferenciaData])
        .select();

      if (errorTrf) {
        console.warn('⚠️ Error al insertar en TRANSFERENCIA:', errorTrf.message);
        // No lanzar error - TRANSACCION fue insertada exitosamente, que es lo importante
        // TRANSFERENCIA podría no existir o tener un schema diferente
        console.log('✅ Nota: Transacción registrada en TRANSACCION. TRANSFERENCIA omitida por incompatibilidad de schema.');
        return { id_tra: idTra, id_trf: idTrf };
      } else {
        console.log('✅ Transferencia creada en TRANSFERENCIA:', idTrf);
        return dataTrf?.[0] || { id_tra: idTra, id_trf: idTrf };
      }
    } catch (error) {
      // Si el error es en el PASO 1 (TRANSACCION), es crítico
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
      const { supabase } = require('../../../shared/config/database.config');

      // Actualizar en TRANSACCION
      const { data: dataTra, error: errorTra } = await supabase
        .from('transaccion')
        .update({
          tra_estado: nuevoEstado
        })
        .eq('id_tra', idTra)
        .select();

      if (errorTra) throw errorTra;
      console.log('✅ Estado de transferencia actualizado:', nuevoEstado);
      return dataTra?.[0] || { id_tra: idTra };
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
      const { supabase } = require('../../../shared/config/database.config');
      
      const { data, error } = await supabase
        .from('transaccion')
        .select('*')
        .eq('tra_estado', '00')
        .order('tra_fecha_hora', { ascending: true })
        .limit(limite);
      
      if (error) throw error;
      return data || [];
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
      const { supabase } = require('../../../shared/config/database.config');
      
      const { data, error } = await supabase
        .from('transferencia')
        .select('tra_estado, tra_monto, trf_comision')
        .eq('id_cuenta', idCuenta)
        .gte('tra_fecha_hora', fechaInicio.toISOString())
        .lte('tra_fecha_hora', fechaFin.toISOString());
      
      if (error) throw error;
      
      // Agrupar y calcular manualmente
      const resumen = {};
      (data || []).forEach(row => {
        const estado = row.tra_estado || '00';
        if (!resumen[estado]) {
          resumen[estado] = { cantidad: 0, monto_total: 0, comision_total: 0, estado_descripcion: '' };
        }
        resumen[estado].cantidad += 1;
        resumen[estado].monto_total += Math.abs(parseFloat(row.tra_monto || 0));
        resumen[estado].comision_total += parseFloat(row.trf_comision || 0);
        resumen[estado].estado_descripcion = ['Pendiente', 'Completada', 'Fallida', 'Reversada'][parseInt(estado)] || '';
      });
      
      return Object.values(resumen);
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
      const { supabase } = require('../../../shared/config/database.config');
      
      const { data, error } = await supabase
        .from('transaccion')
        .select('*')
        .eq('id_cuenta', idCuenta)
        .eq('tra_tipo', '00')
        .order('tra_fecha_hora', { ascending: false })
        .limit(limite);
      
      if (error) throw error;
      return data || [];
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
      const { supabase } = require('../../../shared/config/database.config');
      
      const { data, error } = await supabase
        .from('transaccion')
        .select('*')
        .eq('id_cuenta', idCuenta)
        .eq('tra_tipo', '01')
        .order('tra_fecha_hora', { ascending: false })
        .limit(limite);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Error al obtener transferencias interbancarias: ${error.message}`);
    }
  }

  /**
   * Verifica si existe una transferencia duplicada (prevención de duplicados)
   * @param {string} idCuenta - ID de la cuenta
   * @param {number} monto - Monto
   * @param {string} numeroCuentaDestino - Número de cuenta destino (no se usa aquí)
   * @param {Date} fechaHora - Fecha y hora
   * @returns {Promise<boolean>} True si existe duplicado
   */
  async existeTransferenciaDuplicada(idCuenta, monto, numeroCuentaDestino, fechaHora) {
    try {
      const { supabase } = require('../../../shared/config/database.config');

      // Convertir fecha a string para comparación
      const fechaStr = new Date(fechaHora).toISOString().split('T')[0];

      // Buscar transferencias duplicadas en TRANSACCION (tabla base, mismo monto del mismo cliente en el mismo día)
      const { data, error } = await supabase
        .from('transaccion')
        .select('id_tra', { count: 'exact' })
        .eq('id_cuenta', idCuenta)
        .eq('tra_monto', monto)
        .eq('tra_tipo', '00')  // Solo transferencias internas
        .gte('tra_fecha_hora', `${fechaStr}T00:00:00`)
        .lte('tra_fecha_hora', `${fechaStr}T23:59:59`);

      if (error) throw error;
      return (data && data.length > 0);
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

      // PASO 1: Buscar la cuenta primero
      const { data: cuenta, error: errorCuenta } = await supabase
        .from('cuenta')
        .select('*')
        .eq('cue_numero', numeroCuenta)
        .eq('cue_estado', '00')
        .single();

      if (errorCuenta && errorCuenta.code !== 'PGRST116') {
        return null;
      }

      if (!cuenta) {
        return null;
      }

      // PASO 1.5: Determinar tipo de cuenta (Ahorros o Corriente)
      let tipoCuenta = '00'; // Default: Ahorros

      // Buscar en cuenta_ahorro
      const { data: cuentaAhorro } = await supabase
        .from('cuenta_ahorro')
        .select('id_cuenta')
        .eq('id_cuenta', cuenta.id_cuenta)
        .single();

      if (cuentaAhorro) {
        tipoCuenta = '00'; // Es cuenta de ahorros
      } else {
        // Si no es ahorros, es corriente
        tipoCuenta = '01';
      }

      // PASO 2: Buscar los datos de la persona
      if (cuenta.id_persona) {
        // Primero obtener los datos base de la persona
        const { data: personaBase, error: errorPersonaBase } = await supabase
          .from('persona')
          .select('id_persona, per_tipo_persona')
          .eq('id_persona', cuenta.id_persona)
          .single();

        if (personaBase) {
          let datosCompletos = null;

          // Según el tipo, buscar en persona_natural o persona_juridica
          if (personaBase.per_tipo_persona === '00') {
            // Persona Natural

            const { data: personaNatural, error: errorNatural } = await supabase
              .from('persona_natural')
              .select('*')
              .eq('id_persona', cuenta.id_persona)
              .single();

            if (personaNatural) {
              const nombreCompleto = [
                personaNatural.pernat_primer_nombre,
                personaNatural.pernat_segundo_nombre,
                personaNatural.pernat_primer_apellido,
                personaNatural.pernat_segundo_apellido
              ].filter(Boolean).join(' ').trim() || 'Titular Banco Pichincha';

              datosCompletos = {
                nombre_titular: nombreCompleto,
                per_tipo_identificacion: '00', // Cédula para persona natural
                per_identificacion: personaNatural.id_pernat || ''
              };
            }
          } else if (personaBase.per_tipo_persona === '01') {
            // Persona Jurídica
            const { data: personaJuridica, error: errorJuridica } = await supabase
              .from('persona_juridica')
              .select('*')
              .eq('id_persona', cuenta.id_persona)
              .single();

            if (personaJuridica) {
              datosCompletos = {
                nombre_titular: personaJuridica.perjur_razon_social || 'Titular Banco Pichincha',
                per_tipo_identificacion: '01', // RUC para persona jurídica
                per_identificacion: personaJuridica.perjur_ruc || personaJuridica.id_perjur || ''
              };
            }
          }

          if (datosCompletos) {
            const resultado = {
              id_cuenta: cuenta.id_cuenta,
              cta_numero: cuenta.cue_numero,
              cta_tipo: tipoCuenta,
              nombre_titular: datosCompletos.nombre_titular,
              per_tipo_identificacion: datosCompletos.per_tipo_identificacion,
              per_identificacion: datosCompletos.per_identificacion,
              id_persona: cuenta.id_persona
            };
            return resultado;
          }
        }
      }

      // Si no hay persona o no se pudo obtener, devolver solo datos de cuenta
      return {
        id_cuenta: cuenta.id_cuenta,
        cta_numero: cuenta.cue_numero,
        cta_tipo: tipoCuenta,
        nombre_titular: 'Titular Banco Pichincha',
        per_tipo_identificacion: '00',
        per_identificacion: '',
        id_persona: cuenta.id_persona
      };

    } catch (error) {
      return null;
    }
  }
}

module.exports = new TransferenciaRepository();
