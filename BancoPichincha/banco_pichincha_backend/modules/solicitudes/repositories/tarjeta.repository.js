const { supabase } = require('../../../shared/config/database.config');

class TarjetaRepository {
  /**
   * Crea una tarjeta base en la tabla TARJETA
   */
  async createTarjeta(tarjeta) {
    const { data, error } = await supabase
      .from('tarjeta')
      .insert(tarjeta)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Crea una tarjeta de débito en la tabla TARJETA_DEBITO (hereda de TARJETA)
   */
  async createTarjetaDebito(tarjetaDebito) {
    const { data, error } = await supabase
      .from('tarjeta_debito')
      .insert(tarjetaDebito)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Crea una tarjeta de crédito en la tabla TARJETA_CREDITO (hereda de TARJETA)
   */
  async createTarjetaCredito(tarjetaCredito) {
    const { data, error } = await supabase
      .from('tarjeta_credito')
      .insert(tarjetaCredito)
      .select()
      .single();
    
    if (error) throw error;
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

  async findByNumero(numeroTarjeta) {
    const { data, error } = await supabase
      .from('tarjeta')
      .select('*')
      .eq('tar_numero', numeroTarjeta)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateEstado(idTarjeta, estado) {
    const { data, error } = await supabase
      .from('tarjeta')
      .update({ tar_estado: estado })
      .eq('id_tarjeta', idTarjeta)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

module.exports = new TarjetaRepository();
