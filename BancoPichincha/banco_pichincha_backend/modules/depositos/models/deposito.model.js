// Modelo de depósito (opcional, para referencia)
module.exports = class Deposito {
  constructor(id, cuentaId, monto, fecha) {
    this.id = id;
    this.cuentaId = cuentaId;
    this.monto = monto;
    this.fecha = fecha;
  }
};
