const { supabase } = require('../../../shared/config/database.config');

const TABLE = 'inversion';

class InversionRepository {
  async findAll(filters = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filters.estado) query = query.eq('inv_estado', filters.estado);
    if (filters.producto) query = query.eq('inv_producto', filters.producto);
    if (filters.idCuenta) query = query.eq('id_cuenta', filters.idCuenta);

    const { data, error } = await query.order('inv_fecha_apertura', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id_inv', id)
      .single();

    if (error) throw error;
    return data;
  }

  async findByCuenta(idCuenta) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id_cuenta', idCuenta)
      .order('inv_fecha_apertura', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findByPersona(idPersona) {
    console.log('Repository - findByPersona - idPersona:', idPersona);
    
    // Join con tabla cuenta para obtener inversiones por persona
    // Usando la sintaxis correcta de Supabase con !inner para forzar el filtrado
    const { data, error } = await supabase
      .from(TABLE)
      .select(`
        *,
        cuenta!inner (
          id_cuenta,
          id_persona,
          cue_numero
        )
      `)
      .eq('cuenta.id_persona', idPersona)
      .order('inv_fecha_apertura', { ascending: false });

    console.log('Repository - findByPersona - data:', data);
    console.log('Repository - findByPersona - error:', error);
    
    if (error) throw error;
    
    // Debug: verificar que todas las inversiones pertenecen a la persona correcta
    if (data) {
      data.forEach(inv => {
        console.log(`Inversión ${inv.id_inv}: cuenta.id_persona = ${inv.cuenta?.id_persona}`);
      });
    }
    
    return data;
  }

  async create(inversion) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(inversion)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id, inversion) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(inversion)
      .eq('id_inv', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateEstado(id, estado) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ inv_estado: estado })
      .eq('id_inv', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id) {
    const { error } = await supabase.from(TABLE).delete().eq('id_inv', id);

    if (error) throw error;
    return true;
  }
}

module.exports = new InversionRepository();
