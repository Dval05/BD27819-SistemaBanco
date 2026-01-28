const { supabase } = require('../../../shared/config/database.config');

const TABLE = 'inversion_movimiento';

class MovimientoRepository {
  async findByInversion(idInv) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id_inv', idInv)
      .order('id_invmov', { ascending: false });
    if (error) throw error;
    return data;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id_invmov', id)
      .single();
    if (error) throw error;
    return data;
  }

  async findByTransaccion(idTra) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id_tra', idTra);
    if (error) throw error;
    return data;
  }

  async create(movimiento) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(movimiento)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

module.exports = new MovimientoRepository();
