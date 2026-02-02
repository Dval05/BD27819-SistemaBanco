const { supabase } = require('../../../shared/config/database.config');

/**
 * Contacto Repository
 * Gestiona operaciones CRUD de contactos guardados para transferencias rápidas
 * Usa Supabase client
 */
class ContactoRepository {
  /**
   * Obtiene todos los contactos activos de una persona
   * @param {string} idPersona - ID de la persona
   * @returns {Promise<Array>} Lista de contactos activos
   */
  async obtenerContactosPorPersona(idPersona) {
    try {
      const { data, error } = await supabase
        .from('contacto')
        .select('*')
        .eq('id_persona', idPersona)
        .eq('con_estado', '00')
        .order('con_fecha_creacion', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Error al obtener contactos: ${error.message}`);
    }
  }

  /**
   * Obtiene un contacto específico por su ID
   * @param {string} idContacto - ID del contacto
   * @returns {Promise<Object>} Datos del contacto
   */
  async obtenerContactoPorId(idContacto) {
    try {
      const { data, error } = await supabase
        .from('contacto')
        .select('*')
        .eq('id_contacto', idContacto)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      throw new Error(`Error al obtener contacto: ${error.message}`);
    }
  }

  /**
   * Crea un nuevo contacto
   * @param {Object} datosContacto - Datos del contacto
   * @returns {Promise<Object>} Contacto creado
   */
  async crearContacto(datosContacto) {
    try {
      const {
        idContacto,
        idPersona,
        idBanco,
        conNombreBeneficiario,
        conAlias,
        conTipoIdentificacion,
        conIdentificacion,
        conNumeroCuenta,
        conEmail,
        conTipoCuenta
      } = datosContacto;

      const { data, error } = await supabase
        .from('contacto')
        .insert({
          id_contacto: idContacto,
          id_persona: idPersona,
          id_banco: idBanco,
          con_nombre_beneficiario: conNombreBeneficiario,
          con_alias: conAlias,
          con_tipo_identificacion: conTipoIdentificacion,
          con_identificacion: conIdentificacion,
          con_numero_cuenta: conNumeroCuenta,
          con_email: conEmail,
          con_tipo_cuenta: conTipoCuenta,
          con_estado: '00'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error al crear contacto: ${error.message}`);
    }
  }

  /**
   * Actualiza un contacto existente
   * @param {string} idContacto - ID del contacto
   * @param {Object} datosActualizacion - Datos a actualizar
   * @returns {Promise<Object>} Contacto actualizado
   */
  async actualizarContacto(idContacto, datosActualizacion) {
    try {
      const updateData = {};
      
      if (datosActualizacion.conAlias !== undefined) {
        updateData.con_alias = datosActualizacion.conAlias;
      }
      if (datosActualizacion.conNombreBeneficiario !== undefined) {
        updateData.con_nombre_beneficiario = datosActualizacion.conNombreBeneficiario;
      }
      if (datosActualizacion.conEmail !== undefined) {
        updateData.con_email = datosActualizacion.conEmail;
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error('No hay datos para actualizar');
      }

      const { data, error } = await supabase
        .from('contacto')
        .update(updateData)
        .eq('id_contacto', idContacto)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error al actualizar contacto: ${error.message}`);
    }
  }

  /**
   * Desactiva un contacto (cambio de estado a inactivo)
   * @param {string} idContacto - ID del contacto
   * @returns {Promise<Object>} Contacto desactivado
   */
  async desactivarContacto(idContacto) {
    try {
      const { data, error } = await supabase
        .from('contacto')
        .update({ con_estado: '01' })
        .eq('id_contacto', idContacto)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error al desactivar contacto: ${error.message}`);
    }
  }

  /**
   * Verifica si existe un contacto con el mismo número de cuenta
   * @param {string} idPersona - ID de la persona
   * @param {string} numeroCuenta - Número de cuenta
   * @returns {Promise<boolean>} True si existe, false en caso contrario
   */
  async existeContactoConCuenta(idPersona, numeroCuenta) {
    try {
      const { data, error } = await supabase
        .from('contacto')
        .select('id_contacto')
        .eq('id_persona', idPersona)
        .eq('con_numero_cuenta', numeroCuenta)
        .eq('con_estado', '00')
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      throw new Error(`Error al verificar contacto: ${error.message}`);
    }
  }
}

module.exports = new ContactoRepository();
