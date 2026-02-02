/**
 * Formateador Util - Transferencias
 * Funciones para formatear datos para presentación al usuario
 */
class FormateadorTransferencias {
  /**
   * Formatea un monto monetario
   * @param {number} monto - Monto a formatear
   * @param {boolean} conSimbolo - Si incluir símbolo $ (default true)
   * @returns {string} Monto formateado (ej: "$1,234.56")
   */
  static formatearMonto(monto, conSimbolo = true) {
    if (typeof monto !== 'number') {
      return conSimbolo ? '$0.00' : '0.00';
    }

    const formateado = monto.toLocaleString('es-EC', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return conSimbolo ? `$${formateado}` : formateado;
  }

  /**
   * Formatea un número de cuenta ocultando dígitos (seguridad)
   * Muestra solo los últimos 4 dígitos
   * Ej: "1234567890" -> "****7890"
   * 
   * @param {string} numeroCuenta - Número de cuenta
   * @returns {string} Número de cuenta formateado
   */
  static formatearNumeroCuenta(numeroCuenta) {
    if (!numeroCuenta || typeof numeroCuenta !== 'string') {
      return '****';
    }

    const longitud = numeroCuenta.length;
    const ultimos4 = numeroCuenta.slice(-4);
    const asteriscos = '*'.repeat(Math.max(0, longitud - 4));

    return asteriscos + ultimos4;
  }

  /**
   * Formatea número de identificación ocultando dígitos
   * Ej: "0123456789" -> "01234****"
   * 
   * @param {string} identificacion - Número de identificación
   * @returns {string} Identificación formateada
   */
  static formatearIdentificacion(identificacion) {
    if (!identificacion || typeof identificacion !== 'string') {
      return '****';
    }

    const longitud = identificacion.length;
    const mitad = Math.floor(longitud / 2);
    const primeros = identificacion.slice(0, mitad);
    const asteriscos = '*'.repeat(longitud - mitad);

    return primeros + asteriscos;
  }

  /**
   * Formatea email ocultando caracteres
   * Ej: "usuario@example.com" -> "us****@example.com"
   * 
   * @param {string} email - Email a formatear
   * @returns {string} Email formateado
   */
  static formatearEmail(email) {
    if (!email || typeof email !== 'string') {
      return '****@****';
    }

    const [usuario, dominio] = email.split('@');

    if (usuario.length <= 2) {
      return `**@${dominio}`;
    }

    const primeros = usuario.slice(0, 2);
    const asteriscos = '*'.repeat(usuario.length - 2);

    return `${primeros}${asteriscos}@${dominio}`;
  }

  /**
   * Formatea una fecha en formato legible
   * @param {Date|string} fecha - Fecha a formatear
   * @param {string} formato - 'corto' (15 Ene 2026), 'largo' (15 de Enero de 2026), 'completo' (15/01/2026 14:30)
   * @returns {string} Fecha formateada
   */
  static formatearFecha(fecha, formato = 'corto') {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;

    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }

    const opciones = {
      corto: { day: 'numeric', month: 'short', year: 'numeric' },
      largo: { day: 'numeric', month: 'long', year: 'numeric' },
      completo: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    };

    return date.toLocaleDateString('es-EC', opciones[formato] || opciones.corto);
  }

  /**
   * Formatea hora en formato legible
   * @param {Date|string} fecha - Fecha/hora
   * @returns {string} Hora formateada (ej: "14:30:45")
   */
  static formatearHora(fecha) {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;

    if (isNaN(date.getTime())) {
      return 'Hora inválida';
    }

    return date.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Formatea un tipo de identificación al texto descriptivo
   * @param {string} codigo - Código ('00', '01', '02')
   * @returns {string} Descripción (Cédula, RUC, Pasaporte)
   */
  static formatearTipoIdentificacion(codigo) {
    const tipos = {
      '00': 'Cédula',
      '01': 'RUC',
      '02': 'Pasaporte'
    };
    return tipos[codigo] || 'Desconocido';
  }

  /**
   * Formatea tipo de cuenta al texto descriptivo
   * @param {string} codigo - Código ('00', '01')
   * @returns {string} Descripción (Ahorros, Corriente)
   */
  static formatearTipoCuenta(codigo) {
    const tipos = {
      '00': 'Ahorros',
      '01': 'Corriente'
    };
    return tipos[codigo] || 'Desconocido';
  }

  /**
   * Formatea tipo de transferencia
   * @param {string} codigo - Código ('00', '01')
   * @returns {string} Descripción (Interna, Interbancaria)
   */
  static formatearTipoTransferencia(codigo) {
    const tipos = {
      '00': 'Interna',
      '01': 'Interbancaria'
    };
    return tipos[codigo] || 'Desconocido';
  }

  /**
   * Formatea estado de transferencia
   * @param {string} codigo - Código ('00', '01', '02', '03')
   * @returns {string} Descripción (Pendiente, Completada, Fallida, Reversada)
   */
  static formatearEstado(codigo) {
    const estados = {
      '00': 'Pendiente',
      '01': 'Completada',
      '02': 'Fallida',
      '03': 'Reversada'
    };
    return estados[codigo] || 'Desconocido';
  }

  /**
   * Formatea estado de contacto
   * @param {string} codigo - Código ('00', '01')
   * @returns {string} Descripción (Activo, Inactivo)
   */
  static formatearEstadoContacto(codigo) {
    const estados = {
      '00': 'Activo',
      '01': 'Inactivo'
    };
    return estados[codigo] || 'Desconocido';
  }

  /**
   * Formatea una transferencia completa para respuesta al cliente
   * @param {Object} transferencia - Datos de transferencia
   * @returns {Object} Transferencia formateada
   */
  static formatearTransferenciaCompleta(transferencia) {
    return {
      id: transferencia.id_trf,
      monto: this.formatearMonto(transferencia.tra_monto),
      comision: this.formatearMonto(transferencia.trf_comision),
      totalDebitado: this.formatearMonto(
        parseFloat(transferencia.tra_monto) + parseFloat(transferencia.trf_comision)
      ),
      cuentaDestino: this.formatearNumeroCuenta(transferencia.trf_numero_cuenta_destino),
      banco: transferencia.ban_nombre || 'Pichincha',
      tipo: this.formatearTipoTransferencia(transferencia.trf_tipo_transferencia),
      estado: this.formatearEstado(transferencia.tra_estado),
      fecha: this.formatearFecha(transferencia.tra_fecha_hora, 'completo'),
      descripcion: transferencia.tra_descripcion,
      contactoAlias: transferencia.con_alias || 'Sin alias'
    };
  }

  /**
   * Resumen formateado de una transferencia (para historial)
   * @param {Object} transferencia - Datos de transferencia
   * @returns {Object} Resumen formateado
   */
  static formatearResumenTransferencia(transferencia) {
    return {
      id: transferencia.id_trf,
      monto: this.formatearMonto(Math.abs(parseFloat(transferencia.tra_monto))),
      estado: this.formatearEstado(transferencia.tra_estado),
      destino: transferencia.con_alias || this.formatearNumeroCuenta(transferencia.trf_numero_cuenta_destino),
      fecha: this.formatearFecha(transferencia.tra_fecha_hora, 'corto'),
      tipo: this.formatearTipoTransferencia(transferencia.trf_tipo_transferencia)
    };
  }

  /**
   * Formatea resumen de comisiones
   * @param {number} comision - Monto de comisión
   * @param {number} montoOriginal - Monto original
   * @returns {string} Resumen (ej: "$10.00 (0.88%)")
   */
  static formatearComisionConPorcentaje(comision, montoOriginal) {
    if (montoOriginal === 0) return this.formatearMonto(comision);

    const porcentaje = ((comision / montoOriginal) * 100).toFixed(2);
    return `${this.formatearMonto(comision)} (${porcentaje}%)`;
  }
}

module.exports = FormateadorTransferencias;
