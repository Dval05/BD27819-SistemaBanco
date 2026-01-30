const cuentaRepository = require('../repositories/cuenta.repository');

class CuentaService {
  generateNumeroCuenta() {
    const prefix = '220';
    const random = Math.floor(1000000 + Math.random() * 9000000).toString();
    return prefix + random;
  }

  generateIdCuenta() {
    return 'CTA' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
  }

  generateIdCueAhorro() {
    return 'CAH' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
  }

  async crearCuentaAhorroFlexible(idPersona) {
    if (!idPersona) {
      throw { status: 400, message: 'ID de persona es requerido' };
    }

    let numeroCuenta;
    let cuentaExistente;
    do {
      numeroCuenta = this.generateNumeroCuenta();
      cuentaExistente = await cuentaRepository.findByNumero(numeroCuenta);
    } while (cuentaExistente);

    const idCuenta = this.generateIdCuenta();
    const fechaApertura = new Date().toISOString().split('T')[0];

    // Crear cuenta base
    const cuenta = {
      id_cuenta: idCuenta,
      id_persona: idPersona,
      cue_numero: numeroCuenta,
      cue_saldo_disponible: 0.00,
      cue_estado: '00',
      cue_fecha_apertura: fechaApertura
    };

    await cuentaRepository.createCuenta(cuenta);

    // Crear cuenta ahorro solo con sus columnas específicas
    const cuentaAhorro = {
      id_cuenta: idCuenta,
      id_cue_ahorro: this.generateIdCueAhorro(),
      cueaho_tasa_interes: 2.50,
      cueaho_meta_ahorro: 0,
      cueaho_acumulacion_interes: 0.00
    };

    await cuentaRepository.createCuentaAhorro(cuentaAhorro);
    
    // Retornar la cuenta base con info formateada
    return this._formatCuenta(cuenta);
  }

  async getCuentasByPersona(idPersona) {
    if (!idPersona) {
      throw { status: 400, message: 'ID de persona es requerido' };
    }

    const cuentas = await cuentaRepository.findByPersona(idPersona);
    return cuentas.map(c => this._formatCuenta(c));
  }

  async getCuentasAhorroByPersona(idPersona) {
    if (!idPersona) {
      throw { status: 400, message: 'ID de persona es requerido' };
    }

    const cuentas = await cuentaRepository.findCuentasAhorroByPersona(idPersona);
    return cuentas.map(c => this._formatCuentaAhorro(c));
  }

  async getCuentaById(idCuenta) {
    const cuenta = await cuentaRepository.findById(idCuenta);
    if (!cuenta) {
      throw { status: 404, message: 'Cuenta no encontrada' };
    }
    return this._formatCuenta(cuenta);
  }

  // ✅ FORMATO CORREGIDO - USA SNAKE_CASE COMO EL FRONTEND ESPERA
  _formatCuenta(cuenta) {
    const saldoNumerico = parseFloat(cuenta.cue_saldo_disponible) || 0;
    
    return {
      id_cuenta: cuenta.id_cuenta,
      id_persona: cuenta.id_persona,
      cue_numero: cuenta.cue_numero,
      cue_saldo_disponible: saldoNumerico, // ✅ SNAKE_CASE
      cue_estado: cuenta.cue_estado,
      cue_fecha_apertura: cuenta.cue_fecha_apertura,
      tipo: 'ahorro', // ✅ LOWERCASE
      // Info adicional
      numeroOculto: '******' + (cuenta.cue_numero || '').slice(-4),
      estadoTexto: cuenta.cue_estado === '00' ? 'ACTIVA' : 'INACTIVA'
    };
  }

  _formatCuentaAhorro(cuenta) {
    const saldoNumerico = parseFloat(cuenta.cue_saldo_disponible) || 0;
    
    return {
      id_cuenta: cuenta.id_cuenta,
      id_cue_ahorro: cuenta.id_cue_ahorro,
      id_persona: cuenta.id_persona,
      cue_numero: cuenta.cue_numero,
      cue_saldo_disponible: saldoNumerico, // ✅ SNAKE_CASE
      cue_estado: cuenta.cue_estado,
      cue_fecha_apertura: cuenta.cue_fecha_apertura,
      tipo: 'ahorro', // ✅ LOWERCASE
      // Info adicional
      numeroOculto: '******' + (cuenta.cue_numero || '').slice(-4),
      estadoTexto: cuenta.cue_estado === '00' ? 'ACTIVA' : 'INACTIVA',
      cueaho_tasa_interes: parseFloat(cuenta.cueaho_tasa_interes) || 0,
      cueaho_meta_ahorro: parseFloat(cuenta.cueaho_meta_ahorro) || 0,
      cueaho_acumulacion_interes: parseFloat(cuenta.cueaho_acumulacion_interes) || 0
    };
  }

  async obtenerCuentaPorPersona(idPersona) {
    if (!idPersona) return null;
    try {
      const cuentas = await cuentaRepository.findByPersona(idPersona);
      // Devolver la primera cuenta activa
      if (cuentas && cuentas.length > 0) {
        return cuentas.find(c => c.cue_estado === '00') || cuentas[0];
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo cuenta por persona:', error);
      return null;
    }
  }
}

module.exports = new CuentaService();
