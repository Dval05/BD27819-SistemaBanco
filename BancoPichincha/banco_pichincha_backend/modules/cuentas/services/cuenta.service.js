const { v4: uuidv4 } = require('uuid');
const cuentaRepository = require('../repositories/cuenta.repository');

class CuentaService {
  generateNumeroCuenta() {
    const prefix = '22';
    const random = Math.floor(10000000 + Math.random() * 90000000).toString();
    return prefix + random;
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

    const idCuenta = uuidv4();
    const fechaApertura = new Date().toISOString().split('T')[0];

    const cuenta = {
      id_cuenta: idCuenta,
      id_persona: idPersona,
      cue_numero: numeroCuenta,
      cue_saldo_disponible: 0,
      cue_estado: '00',
      cue_fecha_apertura: fechaApertura
    };

    await cuentaRepository.createCuenta(cuenta);

    const cuentaAhorro = {
      id_cuenta: idCuenta,
      id_cue_ahorro: uuidv4(),
      id_persona: idPersona,
      cue_numero: numeroCuenta,
      cue_saldo_disponible: 0,
      cue_estado: '00',
      cue_fecha_apertura: fechaApertura,
      cueaho_tasa_interes: 2.50,
      cueaho_meta_ahorro: 0,
      cueaho_acumulacion_interes: 0.00
    };

    const cuentaAhorroCreada = await cuentaRepository.createCuentaAhorro(cuentaAhorro);
    
    return this._formatCuentaAhorro(cuentaAhorroCreada);
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
}

module.exports = new CuentaService();
