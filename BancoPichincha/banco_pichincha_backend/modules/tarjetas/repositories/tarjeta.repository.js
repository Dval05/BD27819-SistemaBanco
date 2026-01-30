const { supabase } = require('../../../shared/config/database.config');

class TarjetaRepository {
  async createTarjeta(tarjeta) {
    const { data, error } = await supabase
      .from('tarjeta')
      .insert(tarjeta)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async createTarjetaDebito(tarjetaDebito) {
    const { data, error } = await supabase
      .from('tarjeta_debito')
      .insert(tarjetaDebito)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async findByNumero(numeroTarjeta) {
    const { data, error } = await supabase
      .from('tarjeta')
      .select('*')
      .eq('tar_numero', numeroTarjeta)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findById(idTarjeta) {
    const { data, error } = await supabase
      .from('tarjeta')
      .select('*')
      .eq('id_tarjeta', idTarjeta)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByCuenta(idCuenta) {
    const { data, error } = await supabase
      .from('tarjeta')
      .select('*')
      .eq('id_cuenta', idCuenta);
    
    if (error) throw error;
    return data || [];
  }
}

module.exports = new TarjetaRepository();
