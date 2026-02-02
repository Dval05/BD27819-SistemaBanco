const { supabase } = require('../../../shared/config/database.config');

class BancoRepository {
  /**
   * Obtiene todos los bancos activos
   * @returns {Promise<Array>} Lista de bancos activos
   */
  async obtenerTodosBancos() {
    try {
      const { data, error } = await supabase
        .from('banco')
        .select('*')
        .eq('ban_estado', '00')
        .order('ban_nombre', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Error al obtener bancos: ${error.message}`);
    }
  }

  /**
   * Obtiene un banco por su ID
   * @param {string} idBanco - ID del banco
   * @returns {Promise<Object>} Datos del banco
   */
  async obtenerBancoPorId(idBanco) {
    try {
      const { data, error } = await supabase
        .from('banco')
        .select('*')
        .eq('id_banco', idBanco)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      throw new Error(`Error al obtener banco: ${error.message}`);
    }
  }

  /**
   * Obtiene un banco por su código
   * @param {string} codigo - Código del banco
   * @returns {Promise<Object>} Datos del banco
   */
  async obtenerBancoPorCodigo(codigo) {
    try {
      const { data, error } = await supabase
        .from('banco')
        .select('*')
        .eq('ban_codigo', codigo)
        .eq('ban_estado', '00')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      throw new Error(`Error al obtener banco por código: ${error.message}`);
    }
  }

  /**
   * Crea un nuevo banco
   * @param {Object} datoBanco - Datos del banco
   * @returns {Promise<Object>} Banco creado
   */
  async crearBanco(datoBanco) {
    try {
      const { idBanco, banNombre, banCodigo, banEstado } = datoBanco;
      
      const { data, error } = await supabase
        .from('banco')
        .insert({
          id_banco: idBanco,
          ban_nombre: banNombre,
          ban_codigo: banCodigo,
          ban_estado: banEstado
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error al crear banco: ${error.message}`);
    }
  }

  /**
   * Actualiza el estado de un banco
   * @param {string} idBanco - ID del banco
   * @param {string} nuevoEstado - Nuevo estado ('00' = Activo, '01' = Inactivo)
   * @returns {Promise<Object>} Banco actualizado
   */
  async actualizarEstadoBanco(idBanco, nuevoEstado) {
    try {
      const { data, error } = await supabase
        .from('banco')
        .update({ ban_estado: nuevoEstado })
        .eq('id_banco', idBanco)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error al actualizar estado del banco: ${error.message}`);
    }
  }
}

module.exports = new BancoRepository();
