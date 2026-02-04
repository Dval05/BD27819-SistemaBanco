const cuentaRepository = require('../repositories/cuenta.repository');
const crypto = require('crypto');

class CuentaService {
  generateId(prefix = 'ID') {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `${prefix}${timestamp}${random}`.substring(0, 20);
  }

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

  generateIdCueCorriente() {
    return 'CCO' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
  }

  async crearCuentaAhorroFlexible(idPersona) {
    console.log('🔵 Iniciando creación de cuenta de ahorro para persona:', idPersona);
    
    if (!idPersona) {
      throw { status: 400, message: 'ID de persona es requerido' };
    }

    let numeroCuenta;
    let cuentaExistente;
    do {
      numeroCuenta = this.generateNumeroCuenta();
      cuentaExistente = await cuentaRepository.findByNumero(numeroCuenta);
    } while (cuentaExistente);

    console.log('🔵 Número de cuenta generado:', numeroCuenta);

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

    console.log('🔵 Creando cuenta base:', cuenta);
    await cuentaRepository.createCuenta(cuenta);
    console.log('✅ Cuenta base creada exitosamente');

    // Crear cuenta ahorro solo con sus columnas específicas
    const cuentaAhorro = {
      id_cuenta: idCuenta,
      id_cue_ahorro: this.generateIdCueAhorro(),
      cueaho_tasa_interes: 2.50,
      cueaho_meta_ahorro: 0,
      cueaho_acumulacion_interes: 0.00
    };

    console.log('🔵 Creando cuenta de ahorro:', cuentaAhorro);
    await cuentaRepository.createCuentaAhorro(cuentaAhorro);
    console.log('✅ Cuenta de ahorro creada exitosamente');
    
    // Retornar la cuenta base con info formateada
    return this._formatCuenta(cuenta);
  }

  async crearCuentaCorriente(idPersona) {
    console.log('🔵 Iniciando creación de cuenta corriente para persona:', idPersona);
    
    if (!idPersona) {
      throw { status: 400, message: 'ID de persona es requerido' };
    }

    let numeroCuenta;
    let cuentaExistente;
    do {
      numeroCuenta = this.generateNumeroCuenta();
      cuentaExistente = await cuentaRepository.findByNumero(numeroCuenta);
    } while (cuentaExistente);

    console.log('🔵 Número de cuenta corriente generado:', numeroCuenta);

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

    console.log('🔵 Creando cuenta base:', cuenta);
    await cuentaRepository.createCuenta(cuenta);
    console.log('✅ Cuenta base creada exitosamente');

    // Crear cuenta corriente con sus columnas específicas
    const cuentaCorriente = {
      id_cuenta: idCuenta,
      id_cue_corr: this.generateIdCueCorriente(),
      cuecorr_monto_sobregiro: 0,
      cuecorr_chequera: '01', // Sin chequera por defecto
      cuecorr_cupo: 500.00, // Cupo de sobregiro por defecto
      cuecorr_costo_mantenimiento: 5.00,
      cuecorr_interes_sobregiro: 0.1500 // 15% como decimal
    };

    console.log('🔵 Creando cuenta corriente:', cuentaCorriente);
    await cuentaRepository.createCuentaCorriente(cuentaCorriente);
    console.log('✅ Cuenta corriente creada exitosamente');
    
    // Retornar la cuenta base con info formateada y tipo corriente
    const cuentaFormateada = this._formatCuenta(cuenta);
    cuentaFormateada.tipo = 'corriente';
    return cuentaFormateada;
  }

  async crearCuentaConTarjeta(idPersona, tipoCuenta = 'ahorro') {
    console.log('🔵 Iniciando creación de cuenta', tipoCuenta, 'con tarjeta de débito para persona:', idPersona);
    
    // Crear la cuenta según el tipo
    let cuenta;
    if (tipoCuenta === 'corriente') {
      cuenta = await this.crearCuentaCorriente(idPersona);
    } else {
      cuenta = await this.crearCuentaAhorroFlexible(idPersona);
    }

    console.log('✅ Cuenta creada:', cuenta.id_cuenta);

    // Crear tarjeta de débito vinculada a la cuenta
    const tarjetaService = require('../../tarjetas/services/tarjeta.service');
    const tarjeta = await tarjetaService.crearTarjetaDebito(cuenta.id_cuenta);
    
    console.log('✅ Tarjeta de débito creada:', tarjeta.id_tarjeta);

    return {
      cuenta,
      tarjeta
    };
  }

  async getCuentasByPersona(idPersona) {
    if (!idPersona) {
      throw { status: 400, message: 'ID de persona es requerido' };
    }

    const cuentas = await cuentaRepository.findByPersona(idPersona);
    return cuentas.map(c => {
      // El repositorio ya trae el tipo, usar el método correcto de formateo
      if (c.tipo === 'ahorro') {
        return this._formatCuentaAhorro(c);
      } else if (c.tipo === 'corriente') {
        return this._formatCuentaCorriente(c);
      }
      return this._formatCuenta(c);
    });
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

  _formatCuentaCorriente(cuenta) {
    const saldoNumerico = parseFloat(cuenta.cue_saldo_disponible) || 0;
    
    return {
      id_cuenta: cuenta.id_cuenta,
      id_persona: cuenta.id_persona,
      cue_numero: cuenta.cue_numero,
      cue_saldo_disponible: saldoNumerico,
      cue_estado: cuenta.cue_estado,
      cue_fecha_apertura: cuenta.cue_fecha_apertura,
      tipo: 'corriente',
      // Info adicional
      numeroOculto: '******' + (cuenta.cue_numero || '').slice(-4),
      estadoTexto: cuenta.cue_estado === '00' ? 'ACTIVA' : 'INACTIVA'
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
