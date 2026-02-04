// Repositorio para depósitos
const db = require('../../../shared/config/database.config');

exports.registrarDeposito = async (cuentaId, monto) => {
  return true;
};
const { supabase } = require('../../../shared/config/database.config');

class DepositosRepository {

  async registrarDeposito(cuenta_id, monto) {
    try {
      console.log('💾 Repository: Registrando depósito', { cuenta_id, monto });

      const depositoData = {
        cuenta_id: cuenta_id,
        monto: monto,
        fecha: new Date().toISOString(),
        estado: 'activo'
      };

      const { data, error } = await supabase
        .from('deposito')
        .insert(depositoData)
        .select()
        .single();

      if (error) {
        console.error('❌ Repository: Error en Supabase:', error);
        throw error;
      }

      console.log('✅ Repository: Depósito registrado exitosamente');
      return data;
    } catch (error) {
      console.error('❌ Repository: Error completo:', error);
      throw new Error(`Error al registrar depósito: ${error.message}`);
    }
  }


  async obtenerDepositosPorCuenta(idCuenta) {
    try {
      console.log('📋 Repository: Obteniendo depósitos de cuenta', idCuenta);

      const { data, error } = await supabase
        .from('deposito')
        .select('*')
        .eq('cuenta_id', idCuenta)
        .order('fecha', { ascending: false });

      if (error) {
        console.error('❌ Repository: Error en Supabase:', error);
        throw error;
      }

      console.log(`✅ Repository: ${data?.length || 0} depósitos encontrados`);
      return data || [];
    } catch (error) {
      console.error('❌ Repository: Error completo:', error);
      throw new Error(`Error al obtener depósitos: ${error.message}`);
    }
  }


  async obtenerDepositoPorId(id) {
    try {
      const { data, error } = await supabase
        .from('deposito')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Repository: Error al obtener depósito:', error);
      throw new Error(`Error al obtener depósito: ${error.message}`);
    }
  }

  async actualizarEstado(id, nuevoEstado) {
    try {
      console.log('🔄 Repository: Actualizando estado de depósito', { id, nuevoEstado });

      const { data, error } = await supabase
        .from('deposito')
        .update({ estado: nuevoEstado })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Repository: Error en Supabase:', error);
        throw error;
      }

      console.log('✅ Repository: Estado actualizado');
      return data;
    } catch (error) {
      console.error('❌ Repository: Error completo:', error);
      throw new Error(`Error al actualizar estado: ${error.message}`);
    }
  }
}

module.exports = new DepositosRepository();