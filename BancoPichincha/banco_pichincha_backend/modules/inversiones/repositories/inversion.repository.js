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
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id_inv', id);
    if (error) throw error;
    return true;
  }
}

module.exports = new InversionRepository();
