const { supabase } = require('../../../shared/config/database.config');

class ProductosRepository {
  async findCuentasByPersona(idPersona) {
    // Obtener todas las cuentas activas
    const { data: cuentas, error } = await supabase
      .from('cuenta')
      .select('*')
      .eq('id_persona', idPersona)
      .eq('cue_estado', '00');
    
    if (error) throw error;
    if (!cuentas || cuentas.length === 0) return [];

    // Para cada cuenta, determinar su tipo verificando en cuenta_ahorro y cuenta_corriente
    const cuentasConTipo = await Promise.all(
      cuentas.map(async (cuenta) => {
        // Verificar si es cuenta de ahorro
        const { data: ahorro } = await supabase
          .from('cuenta_ahorro')
          .select('*')
          .eq('id_cuenta', cuenta.id_cuenta)
          .maybeSingle();

        if (ahorro) {
          return { ...cuenta, ...ahorro, tipo: 'ahorro' };
        }

        // Verificar si es cuenta corriente
        const { data: corriente } = await supabase
          .from('cuenta_corriente')
          .select('*')
          .eq('id_cuenta', cuenta.id_cuenta)
          .maybeSingle();

        if (corriente) {
          return { ...cuenta, ...corriente, tipo: 'corriente' };
        }

        // Si no está en ninguna, es cuenta base (no debería pasar)
        return { ...cuenta, tipo: 'base' };
      })
    );

    return cuentasConTipo;
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
