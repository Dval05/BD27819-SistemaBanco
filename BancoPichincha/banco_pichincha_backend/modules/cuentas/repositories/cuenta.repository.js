const { supabase } = require('../../../shared/config/database.config');

class CuentaRepository {
  /**
   * Crea una cuenta base en la tabla CUENTA
   */
  async createCuenta(cuenta) {
    const { data, error } = await supabase
      .from('cuenta')
      .insert(cuenta)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Crea una cuenta de ahorro en la tabla CUENTA_AHORRO (hereda de CUENTA)
   */
  async createCuentaAhorro(cuentaAhorro) {
    const { data, error } = await supabase
      .from('cuenta_ahorro')
      .insert(cuentaAhorro)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Crea una cuenta corriente en la tabla CUENTA_CORRIENTE (hereda de CUENTA)
   */
  async createCuentaCorriente(cuentaCorriente) {
    const { data, error } = await supabase
      .from('cuenta_corriente')
      .insert(cuentaCorriente)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async findById(idCuenta) {
    const { data, error } = await supabase
      .from('cuenta')
      .select('*')
      .eq('id_cuenta', idCuenta)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findCuentaAhorroById(idCuenta) {
    const { data, error } = await supabase
      .from('cuenta_ahorro')
      .select('*')
      .eq('id_cuenta', idCuenta)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByPersona(idPersona) {
    const { data, error } = await supabase
      .from('cuenta')
      .select('*')
      .eq('id_persona', idPersona);
    
    if (error) throw error;
    return data || [];
  }

  async findCuentasAhorroByPersona(idPersona) {
    // JOIN con tabla cuenta para obtener cuentas de ahorro de una persona
    const { data, error } = await supabase
      .from('cuenta_ahorro')
      .select(`
        *,
        cuenta!inner (
          id_persona,
          cue_numero,
          cue_saldo_disponible,
          cue_estado,
          cue_fecha_apertura
        )
      `)
      .eq('cuenta.id_persona', idPersona);
    
    if (error) throw error;
    
    // Aplanar la estructura para mantener compatibilidad
    return (data || []).map(ca => ({
      ...ca,
      id_persona: ca.cuenta?.id_persona,
      cue_numero: ca.cuenta?.cue_numero,
      cue_saldo_disponible: ca.cuenta?.cue_saldo_disponible,
      cue_estado: ca.cuenta?.cue_estado,
      cue_fecha_apertura: ca.cuenta?.cue_fecha_apertura
    }));
  }

  async findByNumero(numeroCuenta) {
    const { data, error } = await supabase
      .from('cuenta')
      .select('*')
      .eq('cue_numero', numeroCuenta)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateSaldo(idCuenta, nuevoSaldo) {
    // Actualizar en tabla base
    const { data, error } = await supabase
      .from('cuenta')
      .update({ cue_saldo_disponible: nuevoSaldo })
      .eq('id_cuenta', idCuenta)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateEstado(idCuenta, estado) {
    const { data, error } = await supabase
      .from('cuenta')
      .update({ cue_estado: estado })
      .eq('id_cuenta', idCuenta)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

module.exports = new CuentaRepository();
