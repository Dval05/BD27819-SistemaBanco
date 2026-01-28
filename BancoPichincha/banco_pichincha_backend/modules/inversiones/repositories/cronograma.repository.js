const { supabase } = require('../../../shared/config/database.config');

const TABLE = 'inversion_cronograma';

class CronogramaRepository {
  async findByInversion(idInv) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id_inv', idInv)
      .order('invcr_fecha_programada', { ascending: true });
    if (error) throw error;
    return data;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id_invcr', id)
      .single();
    if (error) throw error;
    return data;
  }

  async findPendientes(idInv) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id_inv', idInv)
      .eq('invcr_estado', '00')
      .order('invcr_fecha_programada', { ascending: true });
    if (error) throw error;
    return data;
  }

  async create(cronograma) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(cronograma)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async createBatch(cronogramas) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(cronogramas)
      .select();
    if (error) throw error;
    return data;
  }

  async update(id, cronograma) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(cronograma)
      .eq('id_invcr', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateEstado(id, estado) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ invcr_estado: estado })
      .eq('id_invcr', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

module.exports = new CronogramaRepository();
