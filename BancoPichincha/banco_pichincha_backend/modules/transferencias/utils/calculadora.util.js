/**
 * Calculadora Util - Transferencias
 * Funciones de cálculo para comisiones, intereses y montos totales
 */
class CalculadoraTransferencias {
  /**
   * Calcula la comisión para una transferencia interbancaria
   * Actualmente: 1% del monto
   * 
   * @param {number} monto - Monto de la transferencia
   * @param {string} tipoTransferencia - '00' (Interna) o '01' (Interbancaria)
   * @returns {number} Comisión calculada
   */
  static calcularComision(monto, tipoTransferencia = '01') {
    // Las transferencias internas no tienen comisión
    if (tipoTransferencia === '00') {
      return 0;
    }

    // Transferencias interbancarias: 1%
    const PORCENTAJE_COMISION_INTERBANCARIA = 0.01;
    const comision = monto * PORCENTAJE_COMISION_INTERBANCARIA;

    // Redondear a 2 decimales
    return Math.round(comision * 100) / 100;
  }

  /**
   * Calcula el monto total a descontar de la cuenta origen
   * Total = Monto + Comisiones
   * 
   * @param {number} monto - Monto de la transferencia
   * @param {number} comision - Comisión (si aplica)
   * @returns {number} Monto total a descontar
   */
  static calcularMontoTotal(monto, comision = 0) {
    const total = monto + comision;
    return Math.round(total * 100) / 100;
  }

  /**
   * Calcula el nuevo saldo después de una transferencia
   * Nuevo saldo = Saldo actual - (Monto + Comisiones)
   * 
   * @param {number} saldoActual - Saldo disponible actual
   * @param {number} monto - Monto de la transferencia
   * @param {number} comision - Comisión (si aplica)
   * @returns {number} Nuevo saldo
   */
  static calcularNuevoSaldo(saldoActual, monto, comision = 0) {
    const montoTotal = this.calcularMontoTotal(monto, comision);
    const nuevoSaldo = saldoActual - montoTotal;
    return Math.round(nuevoSaldo * 100) / 100;
  }

  /**
   * Calcula los gastos totales de una transferencia (comisiones)
   * 
   * @param {number} monto - Monto de la transferencia
   * @param {string} tipoTransferencia - Tipo de transferencia
   * @returns {number} Total de gastos
   */
  static calcularGastos(monto, tipoTransferencia = '01') {
    return this.calcularComision(monto, tipoTransferencia);
  }

  /**
   * Calcula múltiples transferencias y retorna análisis
   * Útil para mostrar resumen de transacciones
   * 
   * @param {Array} transferencias - Array de transferencias con { monto, comision }
   * @returns {Object} Análisis con totales
   */
  static analizarMultiplesTransferencias(transferencias) {
    const resultado = {
      cantidad: transferencias.length,
      montoTotal: 0,
      comisionTotal: 0,
      montoTotalConComisiones: 0,
      montoPromedio: 0,
      comisionPromedio: 0
    };

    if (transferencias.length === 0) {
      return resultado;
    }

    resultado.montoTotal = transferencias.reduce((sum, t) => sum + (t.monto || 0), 0);
    resultado.comisionTotal = transferencias.reduce((sum, t) => sum + (t.comision || 0), 0);
    resultado.montoTotalConComisiones = resultado.montoTotal + resultado.comisionTotal;
    resultado.montoPromedio = resultado.montoTotal / transferencias.length;
    resultado.comisionPromedio = resultado.comisionTotal / transferencias.length;

    // Redondear a 2 decimales
    Object.keys(resultado).forEach(key => {
      if (typeof resultado[key] === 'number' && !Number.isInteger(resultado[key])) {
        resultado[key] = Math.round(resultado[key] * 100) / 100;
      }
    });

    return resultado;
  }

  /**
   * Calcula comisión escalonada por rango de monto
   * Útil para ofrecer comisiones variables según monto
   * 
   * @param {number} monto - Monto de la transferencia
   * @returns {Object} { porcentaje, comision, descripcion }
   */
  static calcularComisionEscalonada(monto) {
    let porcentaje, descripcion;

    if (monto < 1000) {
      porcentaje = 0.015; // 1.5%
      descripcion = 'Comisión básica (< $1,000)';
    } else if (monto < 5000) {
      porcentaje = 0.012; // 1.2%
      descripcion = 'Comisión reducida ($1,000 - $4,999)';
    } else if (monto < 10000) {
      porcentaje = 0.01; // 1%
      descripcion = 'Comisión preferente ($5,000 - $9,999)';
    } else {
      porcentaje = 0.008; // 0.8%
      descripcion = 'Comisión premium (≥ $10,000)';
    }

    const comision = Math.round(monto * porcentaje * 100) / 100;

    return {
      porcentaje: (porcentaje * 100).toFixed(2),
      comision,
      descripcion
    };
  }

  /**
   * Calcula el monto mínimo a transferir considerando comisión
   * Si el usuario quiere enviar exactamente X dinero al destinatario
   * 
   * @param {number} montoDeseado - Monto que el destinatario debe recibir
   * @param {string} tipoTransferencia - Tipo de transferencia
   * @returns {number} Monto a debitar de la cuenta origen
   */
  static calcularMontoConComision(montoDeseado, tipoTransferencia = '01') {
    if (tipoTransferencia === '00') {
      return montoDeseado; // Sin comisión
    }

    // Para interbancarias: calcular comisión sobre el monto deseado
    const PORCENTAJE = 0.01;
    const comision = montoDeseado * PORCENTAJE;
    const montoTotal = montoDeseado + comision;

    return Math.round(montoTotal * 100) / 100;
  }

  /**
   * Valida que después de una transferencia, el saldo no será negativo
   * 
   * @param {number} saldoActual - Saldo disponible
   * @param {number} monto - Monto de transferencia
   * @param {number} comision - Comisión
   * @returns {boolean} True si la transferencia es válida
   */
  static esTransferenciaValida(saldoActual, monto, comision = 0) {
    const montoTotal = this.calcularMontoTotal(monto, comision);
    return saldoActual >= montoTotal;
  }

  /**
   * Calcula las transacciones proyectadas en un período
   * Útil para presupuestos y análisis
   * 
   * @param {number} montoMensual - Monto promedio mensual a transferir
   * @param {number} meses - Cantidad de meses
   * @param {string} tipoTransferencia - Tipo de transferencia
   * @returns {Object} Proyección mensual y anual
   */
  static calcularProyeccion(montoMensual, meses, tipoTransferencia = '01') {
    const comisionPorTransferencia = this.calcularComision(montoMensual, tipoTransferencia);
    const costoMensualTotal = this.calcularMontoTotal(montoMensual, comisionPorTransferencia);

    return {
      montoMensual,
      comisionMensual: comisionPorTransferencia,
      costoMensualTotal,
      montoTotal: montoMensual * meses,
      comisionTotal: comisionPorTransferencia * meses,
      costoTotalProyectado: costoMensualTotal * meses,
      periodoMeses: meses
    };
  }
}

module.exports = CalculadoraTransferencias;
