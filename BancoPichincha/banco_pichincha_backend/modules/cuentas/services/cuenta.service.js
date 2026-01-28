const { v4: uuidv4 } = require('uuid');
const cuentaRepository = require('../repositories/cuenta.repository');

class CuentaService {
  /**
   * Genera un número de cuenta único de 10 dígitos
   */
  generateNumeroCuenta() {
    const prefix = '22'; // Prefijo para cuentas de ahorro
    const random = Math.floor(10000000 + Math.random() * 90000000).toString();
    return prefix + random;
  }

  /**
   * Crea una cuenta de ahorro flexible automáticamente
   * Inserta en CUENTA (tabla padre) y CUENTA_AHORRO (tabla hija)
   * @param {string} idPersona - ID de la persona
   * @returns {Object} Cuenta creada
   */
  async crearCuentaAhorroFlexible(idPersona) {
    if (!idPersona) {
      throw { status: 400, message: 'ID de persona es requerido' };
    }

    // Generar número de cuenta único
    let numeroCuenta;
    let cuentaExistente;
    do {
      numeroCuenta = this.generateNumeroCuenta();
      cuentaExistente = await cuentaRepository.findByNumero(numeroCuenta);
    } while (cuentaExistente);

    const idCuenta = uuidv4();
    const fechaApertura = new Date().toISOString().split('T')[0];

    // 1. Crear registro en tabla CUENTA (tabla padre)
    const cuenta = {
      id_cuenta: idCuenta,
      id_persona: idPersona,
      cue_numero: numeroCuenta,
      cue_saldo_disponible: 0,
      cue_estado: '00', // 00 = Activa
      cue_fecha_apertura: fechaApertura
    };

    await cuentaRepository.createCuenta(cuenta);

    // 2. Crear registro en tabla CUENTA_AHORRO (tabla hija - herencia)
    const cuentaAhorro = {
      id_cuenta: idCuenta,
      id_cue_ahorro: uuidv4(),
      id_persona: idPersona,
      cue_numero: numeroCuenta,
      cue_saldo_disponible: 0,
      cue_estado: '00',
      cue_fecha_apertura: fechaApertura,
      cueaho_tasa_interes: 2.50, // Tasa de interés por defecto 2.5%
      cueaho_meta_ahorro: 0,
      cueaho_acumulacion_interes: 0.00
    };

    const cuentaAhorroCreada = await cuentaRepository.createCuentaAhorro(cuentaAhorro);
    
    console.log('Cuenta de ahorro flexible creada:', {
      idCuenta: idCuenta,
      numero: numeroCuenta,
      idPersona: idPersona
    });

    return this._formatCuentaAhorro(cuentaAhorroCreada);
  }

  /**
   * Obtiene las cuentas de una persona
   */
  async getCuentasByPersona(idPersona) {
    if (!idPersona) {
      throw { status: 400, message: 'ID de persona es requerido' };
    }

    const cuentas = await cuentaRepository.findByPersona(idPersona);
    return cuentas.map(c => this._formatCuenta(c));
  }

  /**
   * Obtiene las cuentas de ahorro de una persona
   */
  async getCuentasAhorroByPersona(idPersona) {
    if (!idPersona) {
      throw { status: 400, message: 'ID de persona es requerido' };
    }

    const cuentas = await cuentaRepository.findCuentasAhorroByPersona(idPersona);
    return cuentas.map(c => this._formatCuentaAhorro(c));
  }

  /**
   * Obtiene una cuenta por ID
   */
  async getCuentaById(idCuenta) {
    const cuenta = await cuentaRepository.findById(idCuenta);
    if (!cuenta) {
      throw { status: 404, message: 'Cuenta no encontrada' };
    }
    return this._formatCuenta(cuenta);
  }

  _formatCuenta(cuenta) {
    const estados = {
      '00': 'ACTIVA',
      '01': 'INACTIVA'
    };

    return {
      id: cuenta.id_cuenta,
      idPersona: cuenta.id_persona,
      numero: cuenta.cue_numero,
      numeroOculto: '******' + (cuenta.cue_numero || '').slice(-4),
      tipo: 'CUENTA',
      saldoDisponible: parseFloat(cuenta.cue_saldo_disponible) || 0,
      fechaApertura: cuenta.cue_fecha_apertura,
      estado: estados[cuenta.cue_estado] || 'ACTIVA',
      estadoCodigo: cuenta.cue_estado
    };
  }

  _formatCuentaAhorro(cuenta) {
    const estados = {
      '00': 'ACTIVA',
      '01': 'INACTIVA'
    };

    return {
      id: cuenta.id_cuenta,
      idCueAhorro: cuenta.id_cue_ahorro,
      idPersona: cuenta.id_persona,
      numero: cuenta.cue_numero,
      numeroOculto: '******' + (cuenta.cue_numero || '').slice(-4),
      tipo: 'AHORRO FLEXIBLE',
      saldoDisponible: parseFloat(cuenta.cue_saldo_disponible) || 0,
      fechaApertura: cuenta.cue_fecha_apertura,
      estado: estados[cuenta.cue_estado] || 'ACTIVA',
      estadoCodigo: cuenta.cue_estado,
      tasaInteres: parseFloat(cuenta.cueaho_tasa_interes) || 0,
      metaAhorro: parseFloat(cuenta.cueaho_meta_ahorro) || 0,
      acumulacionInteres: parseFloat(cuenta.cueaho_acumulacion_interes) || 0
    };
  }
}

module.exports = new CuentaService();
