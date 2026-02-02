const { supabase } = require('../../../shared/config/database.config');

class ProductosRepository {
  async findCuentasByPersona(idPersona) {
    const { data, error } = await supabase
      .from('cuenta')
      .select('*')
      .eq('id_persona', idPersona)
      .eq('cue_estado', '00');
    
    if (error) throw error;
    return data || [];
  }

  async findTarjetasByCuenta(idCuenta) {
    // Obtener solo tarjetas de crédito (no débito) excepto las canceladas (03)
    const { data, error } = await supabase
      .from('tarjeta')
      .select(`
        *,
        tarjeta_credito(
          id_tarcre,
          tarcre_cupo_disponible,
          tarcre_saldo_actual,
          tarcre_fecha_corte,
          tarcre_fecha_maxima_pago,
          tarcre_pago_minimo,
          tarcre_tasa_interes
        )
      `)
      .eq('id_cuenta', idCuenta)
      .neq('tar_estado', '03') // Excluir canceladas
      .not('tarjeta_credito', 'is', null); // Solo tarjetas con registro en tarjeta_credito
    
    if (error) throw error;
    return data || [];
  }

  async findInversionesByCuenta(idCuenta) {
    const { data, error } = await supabase
      .from('inversion')
      .select('*')
      .eq('id_cuenta', idCuenta);
    
    if (error) throw error;
    return data || [];
  }

  async findAllProductosByPersona(idPersona) {
    const cuentas = await this.findCuentasByPersona(idPersona);
    
    let tarjetas = [];
    let inversiones = [];

    for (const cuenta of cuentas) {
      const tarjetasCuenta = await this.findTarjetasByCuenta(cuenta.id_cuenta);
      tarjetas = tarjetas.concat(tarjetasCuenta);

      const inversionesCuenta = await this.findInversionesByCuenta(cuenta.id_cuenta);
      inversiones = inversiones.concat(inversionesCuenta);
    }

    return { cuentas, tarjetas, inversiones };
  }
}

module.exports = new ProductosRepository();
