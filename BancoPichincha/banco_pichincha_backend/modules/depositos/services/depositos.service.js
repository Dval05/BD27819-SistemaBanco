const depositosRepository = require('../repositories/depositos.repository');
const cuentaRepository = require('../../cuentas/repositories/cuenta.repository');
const Deposito = require('../models/deposito.model');
const { supabase } = require('../../../shared/config/database.config');


class DepositosService {
  async validarCuenta(numeroCuenta) {
    console.log('🔍 Service: Validando cuenta', numeroCuenta);

    const cuenta = await cuentaRepository.findByNumero(numeroCuenta);

    if (!cuenta) {
      return {
        existe: false,
        numeroCuenta: numeroCuenta
      };
    }

    return {
      existe: true,
      numeroCuenta: cuenta.cue_numero,
      nombreTitular: 'Titular de la cuenta', 
      tipoCuenta: 'Ahorros', 
      idCuenta: cuenta.id_cuenta,
      saldoActual: cuenta.cue_saldo_disponible
    };
  }

  async realizarDeposito(numeroCuenta, monto) {
    try {
      console.log('Datos recibidos en el servicio:', { numeroCuenta, monto });

      const cuenta = await cuentaRepository.findByNumero(numeroCuenta);

      if (!cuenta) {
        throw new Error('Cuenta no encontrada');
      }

      const cuentaIdUUID = cuenta.id_cuenta;
      const saldoActual = parseFloat(cuenta.cue_saldo_disponible);

      await depositosRepository.registrarDeposito(
        cuentaIdUUID,
        monto
      );
      const nuevoSaldo = saldoActual + monto;

      const { error } = await supabase
        .from('cuenta')
        .update({ cue_saldo_disponible: nuevoSaldo })
        .eq('id_cuenta', cuentaIdUUID);

      if (error) {
        console.error('❌ Error actualizando saldo:', error);
        throw new Error('No se pudo actualizar el saldo de la cuenta');
      }

      console.log('💰 Saldo actualizado correctamente:', {
        anterior: saldoActual,
        depositado: monto,
        nuevoSaldo
      });

      return {
        numeroCuenta,
        saldoAnterior: saldoActual,
        montoDepositado: monto,
        saldoActual: nuevoSaldo
      };

    } catch (error) {
      console.error('Error en el servicio de depósitos:', error);
      throw error;
    }
  }

  async obtenerHistorial(numeroCuenta) {
    console.log('📋 Service: Obteniendo historial de', numeroCuenta);

    const cuenta = await cuentaRepository.findByNumero(numeroCuenta);

    if (!cuenta) {
      throw new Error('Cuenta no encontrada');
    }

    const depositos = await depositosRepository.obtenerDepositosPorCuenta(cuenta.id_cuenta);

    return depositos.map(dep => ({
      id: dep.id,
      monto: parseFloat(dep.monto),
      fecha: dep.fecha,
      estado: dep.estado,
      numeroCuenta: cuenta.cue_numero
    }));
  }
}

module.exports = new DepositosService();

