// Servicio para depósitos
const depositosRepository = require('../repositories/depositos.repository');
const cuentaRepository = require('../../cuentas/repositories/cuenta.repository');

exports.realizarDeposito = async (cuentaId, monto) => {
  if (!cuentaId || !monto || monto <= 0) {
    throw new Error('Datos de depósito inválidos');
  }
  // Buscar cuenta
  const cuenta = await cuentaRepository.obtenerCuentaPorId(cuentaId);
  if (!cuenta) {
    throw new Error('Cuenta no encontrada');
  }
  // Actualizar saldo
  const nuevoSaldo = cuenta.saldo + monto;
  await cuentaRepository.actualizarSaldo(cuentaId, nuevoSaldo);
  // Registrar depósito
  await depositosRepository.registrarDeposito(cuentaId, monto);
  return { cuentaId, monto, nuevoSaldo };
};
