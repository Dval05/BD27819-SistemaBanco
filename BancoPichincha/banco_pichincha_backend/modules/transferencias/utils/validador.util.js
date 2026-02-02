/**
 * Validador Util - Transferencias
 * Contiene funciones de validación reutilizables para transferencias
 */
class ValidadorTransferencias {
  /**
   * Valida formato de email
   * @param {string} email - Email a validar
   * @returns {boolean} True si es válido
   */
  static esEmailValido(email) {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexEmail.test(email);
  }

  /**
   * Valida número de cuenta
   * @param {string} numeroCuenta - Número de cuenta a validar
   * @returns {boolean} True si contiene al menos 10 dígitos
   */
  static esNumeroCuentaValido(numeroCuenta) {
    if (!numeroCuenta || typeof numeroCuenta !== 'string') {
      return false;
    }
    const soloDigitos = numeroCuenta.replace(/\D/g, '');
    return soloDigitos.length >= 10 && soloDigitos.length <= 20;
  }

  /**
   * Valida número de identificación
   * @param {string} identificacion - Número de identificación
   * @param {string} tipo - Tipo de identificación ('00'=Cédula, '01'=RUC, '02'=Pasaporte)
   * @returns {boolean} True si es válido
   */
  static esIdentificacionValida(identificacion, tipo) {
    if (!identificacion || typeof identificacion !== 'string') {
      return false;
    }

    const soloDigitos = identificacion.replace(/\D/g, '');

    switch (tipo) {
      case '00': // Cédula
        return soloDigitos.length === 10;
      case '01': // RUC
        return soloDigitos.length === 13;
      case '02': // Pasaporte
        return identificacion.length >= 5 && identificacion.length <= 20;
      default:
        return false;
    }
  }

  /**
   * Valida monto de transferencia
   * @param {number} monto - Monto a validar
   * @param {number} saldoDisponible - Saldo disponible
   * @param {number} limiteMaximo - Límite máximo permitido (default 15000)
   * @returns {Object} { valido: boolean, mensaje?: string }
   */
  static esMontoValido(monto, saldoDisponible, limiteMaximo = 15000) {
    if (typeof monto !== 'number' || monto <= 0) {
      return {
        valido: false,
        mensaje: 'El monto debe ser mayor a 0'
      };
    }

    if (monto > saldoDisponible) {
      return {
        valido: false,
        mensaje: `Saldo insuficiente. Disponible: $${saldoDisponible.toFixed(2)}`
      };
    }

    if (monto > limiteMaximo) {
      return {
        valido: false,
        mensaje: `Monto excede el límite máximo: $${limiteMaximo}`
      };
    }

    return { valido: true };
  }

  /**
   * Valida alias de contacto
   * @param {string} alias - Alias a validar
   * @returns {boolean} True si es válido
   */
  static esAliasValido(alias) {
    if (!alias || typeof alias !== 'string') {
      return false;
    }
    return alias.trim().length >= 3 && alias.trim().length <= 50;
  }

  /**
   * Valida descripción de transferencia
   * @param {string} descripcion - Descripción a validar
   * @returns {boolean} True si es válido
   */
  static esDescripcionValida(descripcion) {
    if (!descripcion || typeof descripcion !== 'string') {
      return false;
    }
    return descripcion.trim().length >= 3 && descripcion.trim().length <= 500;
  }

  /**
   * Valida tipo de transferencia
   * @param {string} tipo - Tipo a validar ('00' o '01')
   * @returns {boolean} True si es válido
   */
  static esTipoTransferenciaValido(tipo) {
    return ['00', '01'].includes(tipo);
  }

  /**
   * Valida tipo de identificación
   * @param {string} tipo - Tipo a validar ('00', '01', '02')
   * @returns {boolean} True si es válido
   */
  static esTipoIdentificacionValido(tipo) {
    return ['00', '01', '02'].includes(tipo);
  }

  /**
   * Valida tipo de cuenta
   * @param {string} tipo - Tipo a validar ('00', '01')
   * @returns {boolean} True si es válido
   */
  static esTipoCuentaValido(tipo) {
    return ['00', '01'].includes(tipo);
  }

  /**
   * Valida estado de transferencia
   * @param {string} estado - Estado a validar ('00', '01', '02', '03')
   * @returns {boolean} True si es válido
   */
  static esEstadoValido(estado) {
    return ['00', '01', '02', '03'].includes(estado);
  }

  /**
   * Valida que el número de cuenta origen sea diferente del destino
   * @param {string} cuentaOrigen - Número de cuenta origen
   * @param {string} cuentaDestino - Número de cuenta destino
   * @returns {boolean} True si son diferentes
   */
  static sonCuentasDiferentes(cuentaOrigen, cuentaDestino) {
    return cuentaOrigen.trim() !== cuentaDestino.trim();
  }
}

module.exports = ValidadorTransferencias;
