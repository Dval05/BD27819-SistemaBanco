/**
 * Generador Util - Transferencias
 * Funciones para generar referencias, códigos y datos únicos
 */
class GeneradorTransferencias {
  /**
   * Genera referencia única para una transferencia
   * Formato: TRF-YYYYMMDD-HHMMSS-XXXX
   * Ej: TRF-20260130-143045-A7K2
   * 
   * @param {Date} fecha - Fecha de la transferencia (default: ahora)
   * @returns {string} Referencia única
   */
  static generarReferenciaTransferencia(fecha = new Date()) {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minuto = String(fecha.getMinutes()).padStart(2, '0');
    const segundo = String(fecha.getSeconds()).padStart(2, '0');
    const aleatorio = this.generarCodigoAleatorio(4);

    return `TRF-${año}${mes}${dia}-${hora}${minuto}${segundo}-${aleatorio}`;
  }

  /**
   * Genera código de confirmación para transferencia
   * Formato: 6 dígitos aleatorios
   * Ej: 425837
   * 
   * @returns {string} Código de confirmación
   */
  static generarCodigoConfirmacion() {
    return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  }

  /**
   * Genera código aleatorio alfanumérico
   * @param {number} longitud - Longitud deseada
   * @returns {string} Código aleatorio
   */
  static generarCodigoAleatorio(longitud = 8) {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';

    for (let i = 0; i < longitud; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }

    return codigo;
  }

  /**
   * Genera número de rastreo para una transferencia
   * Formato: Basado en timestamp y contador
   * Ej: 1706639045-00001
   * 
   * @returns {string} Número de rastreo
   */
  static generarNumeroRastreo() {
    const timestamp = Math.floor(Date.now() / 1000);
    const contador = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    return `${timestamp}-${contador}`;
  }

  /**
   * Genera comprobante de transferencia (número único)
   * Formato: COM-YYYYMMDDHHMM-XXXXX
   * 
   * @returns {string} Número de comprobante
   */
  static generarNumeroComprobante() {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const hora = String(ahora.getHours()).padStart(2, '0');
    const minuto = String(ahora.getMinutes()).padStart(2, '0');
    const aleatorio = String(Math.floor(Math.random() * 100000)).padStart(5, '0');

    return `COM-${año}${mes}${dia}${hora}${minuto}-${aleatorio}`;
  }

  /**
   * Genera descripción de transferencia automática
   * Usa patrones según contexto
   * 
   * @param {Object} contexto - { nombreBeneficiario, alias, numeroCuenta, banco }
   * @returns {string} Descripción generada
   */
  static generarDescripcionAutomatica(contexto) {
    const { nombreBeneficiario, alias, banco } = contexto;

    if (nombreBeneficiario) {
      return `Transferencia a ${nombreBeneficiario}`;
    }

    if (alias) {
      return `Transferencia a ${alias}`;
    }

    if (banco && banco !== 'Pichincha') {
      return `Transferencia a ${banco}`;
    }

    return 'Transferencia bancaria';
  }

  /**
   * Genera resumen de transacción con todos los datos
   * Útil para recibos y comprobantes
   * 
   * @param {Object} datos - Datos de la transferencia
   * @returns {Object} Resumen completo
   */
  static generarResumenTransaccion(datos) {
    const {
      monto,
      comision,
      cuentaDestino,
      nombreBeneficiario,
      banco,
      tipo,
      fecha
    } = datos;

    const referencia = this.generarReferenciaTransferencia(fecha || new Date());
    const comprobante = this.generarNumeroComprobante();
    const rastreo = this.generarNumeroRastreo();

    return {
      referencia,
      comprobante,
      numeroRastreo: rastreo,
      timestamp: new Date().toISOString(),
      monto,
      comision,
      montoTotal: monto + comision,
      destinatario: {
        nombre: nombreBeneficiario,
        cuenta: cuentaDestino,
        banco
      },
      tipo,
      fecha: fecha || new Date()
    };
  }

  /**
   * Genera token único para validación de transferencia
   * Usado para confirmación o seguridad adicional
   * 
   * @param {string} idTransferencia - ID de la transferencia
   * @param {string} idUsuario - ID del usuario
   * @returns {string} Token de validación
   */
  static generarTokenValidacion(idTransferencia, idUsuario) {
    const datos = `${idTransferencia}:${idUsuario}:${Date.now()}`;
    const buffer = Buffer.from(datos);
    return buffer.toString('base64').substring(0, 32);
  }

  /**
   * Genera período de validez para un OTP o código temporal
   * @param {number} minutosValidez - Minutos de validez (default: 5)
   * @returns {Object} { codigoOtp, expiracion, minutosValidez }
   */
  static generarOtpTemporal(minutosValidez = 5) {
    const codigoOtp = this.generarCodigoConfirmacion();
    const ahora = new Date();
    const expiracion = new Date(ahora.getTime() + minutosValidez * 60000);

    return {
      codigoOtp,
      expiracion: expiracion.toISOString(),
      minutosValidez,
      tiempoRestante: minutosValidez * 60 // en segundos
    };
  }

  /**
   * Genera nombre de archivo para exportar transferencias
   * Formato: Transferencias_YYYYMMDD_HHMMSS.csv
   * 
   * @returns {string} Nombre de archivo
   */
  static generarNombreArchivoExportacion() {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const hora = String(ahora.getHours()).padStart(2, '0');
    const minuto = String(ahora.getMinutes()).padStart(2, '0');
    const segundo = String(ahora.getSeconds()).padStart(2, '0');

    return `Transferencias_${año}${mes}${dia}_${hora}${minuto}${segundo}.csv`;
  }

  /**
   * Genera asunto para email de confirmación
   * @param {string} tipo - Tipo de transferencia ('interna' o 'interbancaria')
   * @param {string} estado - Estado ('confirmacion', 'completada', 'fallida')
   * @returns {string} Asunto del email
   */
  static generarAsuntoEmail(tipo = 'interna', estado = 'confirmacion') {
    const asuntos = {
      confirmacion: {
        interna: 'Confirma tu transferencia interna',
        interbancaria: 'Confirma tu transferencia interbancaria'
      },
      completada: {
        interna: 'Transferencia completada',
        interbancaria: 'Transferencia completada'
      },
      fallida: {
        interna: 'Tu transferencia no pudo ser procesada',
        interbancaria: 'Tu transferencia interbancaria no pudo ser procesada'
      }
    };

    return asuntos[estado]?.[tipo] || 'Confirmación de transferencia';
  }

  /**
   * Genera mensaje de confirmación formateado
   * @param {Object} datos - { monto, destinatario, banco }
   * @returns {string} Mensaje formateado
   */
  static generarMensajeConfirmacion(datos) {
    const { monto, destinatario, banco, comision } = datos;

    let mensaje = `¿Confirma que desea transferir $${monto.toFixed(2)}`;

    if (comision > 0) {
      mensaje += ` + $${comision.toFixed(2)} de comisión`;
    }

    mensaje += ` a ${destinatario}`;

    if (banco && banco !== 'Pichincha') {
      mensaje += ` en ${banco}`;
    }

    mensaje += '?';

    return mensaje;
  }
}

module.exports = GeneradorTransferencias;
