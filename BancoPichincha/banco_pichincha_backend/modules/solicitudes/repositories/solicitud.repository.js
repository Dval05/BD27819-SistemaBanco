const { supabase } = require('../../../shared/config/database.config');

class SolicitudRepository {
  async create(solicitud) {
    const { data, error } = await supabase
      .from('solicitud_tarjeta')
      .insert(solicitud)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async findById(idSolicitud) {
    const { data, error } = await supabase
      .from('solicitud_tarjeta')
      .select('*')
      .eq('id_solicitud', idSolicitud)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByPersona(idPersona) {
    const { data, error } = await supabase
      .from('solicitud_tarjeta')
      .select('*')
      .eq('id_persona', idPersona)
      .order('sol_fecha_solicitud', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async findByCuenta(idCuenta) {
    const { data, error } = await supabase
      .from('solicitud_tarjeta')
      .select('*')
      .eq('id_cuenta', idCuenta)
      .order('sol_fecha_solicitud', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async findPendientes() {
    const { data, error } = await supabase
      .from('solicitud_tarjeta')
      .select('*')
      .eq('sol_estado', '00')
      .order('sol_fecha_solicitud', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async updateEstado(idSolicitud, estado, observacion = null) {
    const updateData = { 
      sol_estado: estado,
      sol_fecha_respuesta: new Date().toISOString()
    };
    
    if (observacion) {
      updateData.sol_observacion = observacion;
    }

    const { data, error } = await supabase
      .from('solicitud_tarjeta')
      .update(updateData)
      .eq('id_solicitud', idSolicitud)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

module.exports = new SolicitudRepository();
