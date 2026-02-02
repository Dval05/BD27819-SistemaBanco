/**
 * Convertidor Util - Transferencias
 * Funciones para convertir entre diferentes formatos y códigos
 */
class ConvertidorTransferencias {
  /**
   * Convierte código de tipo de identificación a descripción
   * @param {string} codigo - Código ('00', '01', '02')
   * @returns {Object} { codigo, descripcion, sigla }
   */
  static convertirTipoIdentificacion(codigo) {
    const mapa = {
      '00': { descripcion: 'Cédula de Identidad', sigla: 'CI' },
      '01': { descripcion: 'Registro Único de Contribuyente', sigla: 'RUC' },
      '02': { descripcion: 'Pasaporte', sigla: 'PP' }
    };

    const resultado = mapa[codigo];
    return resultado
      ? { codigo, ...resultado }
      : { codigo, descripcion: 'Desconocido', sigla: 'DESC' };
  }

  /**
   * Convierte descripción a código de tipo de identificación
   * @param {string} descripcion - Descripción o sigla
   * @returns {string} Código
   */
  static convertirDescripcionACodigoIdentificacion(descripcion) {
    const mapa = {
      'cedula': '00',
      'ci': '00',
      'ruc': '01',
      'pasaporte': '02',
      'pp': '02'
    };

    return mapa[descripcion.toLowerCase()] || null;
  }

  /**
   * Convierte código de tipo de cuenta a descripción
   * @param {string} codigo - Código ('00', '01')
   * @returns {Object} { codigo, descripcion }
   */
  static convertirTipoCuenta(codigo) {
    const mapa = {
      '00': { descripcion: 'Cuenta de Ahorros', sigla: 'AHO' },
      '01': { descripcion: 'Cuenta Corriente', sigla: 'COR' }
    };

    const resultado = mapa[codigo];
    return resultado
      ? { codigo, ...resultado }
      : { codigo, descripcion: 'Desconocido', sigla: 'DESC' };
  }

  /**
   * Convierte código de tipo de transferencia a descripción
   * @param {string} codigo - Código ('00', '01')
   * @returns {Object} { codigo, descripcion, interno }
   */
  static convertirTipoTransferencia(codigo) {
    const mapa = {
      '00': { descripcion: 'Transferencia Interna', interno: true },
      '01': { descripcion: 'Transferencia Interbancaria', interno: false }
    };

    const resultado = mapa[codigo];
    return resultado
      ? { codigo, ...resultado }
      : { codigo, descripcion: 'Desconocido', interno: null };
  }

  /**
   * Convierte código de estado a descripción con color (para UI)
   * @param {string} codigo - Código ('00', '01', '02', '03')
   * @returns {Object} { codigo, descripcion, color, icono }
   */
  static convertirEstado(codigo) {
    const mapa = {
      '00': { 
        descripcion: 'Pendiente',
        color: 'warning',
        colorHex: '#FFC107',
        icono: 'clock'
      },
      '01': { 
        descripcion: 'Completada',
        color: 'success',
        colorHex: '#28A745',
        icono: 'check-circle'
      },
      '02': { 
        descripcion: 'Fallida',
        color: 'danger',
        colorHex: '#DC3545',
        icono: 'x-circle'
      },
      '03': { 
        descripcion: 'Reversada',
        color: 'info',
        colorHex: '#17A2B8',
        icono: 'undo'
      }
    };

    const resultado = mapa[codigo];
    return resultado
      ? { codigo, ...resultado }
      : { codigo, descripcion: 'Desconocido', color: 'secondary', colorHex: '#6C757D', icono: 'question' };
  }

  /**
   * Convierte estado de contacto a descripción
   * @param {string} codigo - Código ('00', '01')
   * @returns {Object} { codigo, descripcion, activo }
   */
  static convertirEstadoContacto(codigo) {
    const mapa = {
      '00': { descripcion: 'Activo', activo: true },
      '01': { descripcion: 'Inactivo', activo: false }
    };

    const resultado = mapa[codigo];
    return resultado
      ? { codigo, ...resultado }
      : { codigo, descripcion: 'Desconocido', activo: null };
  }

  /**
   * Convierte banco de descripción a objeto de datos
   * Útil para búsqueda por nombre
   * 
   * @param {string} nombreBanco - Nombre del banco
   * @returns {string} ID del banco (si existe)
   */
  static convertirNombreBancoAId(nombreBanco) {
    // Este mapeo debería venir de la BD, esta es una versión simple
    const mapa = {
      'banco del pichincha': 'PICHINCHA',
      'pichincha': 'PICHINCHA',
      'banco de guayaquil': 'BG',
      'guayaquil': 'BG',
      'banco internacional': 'BI',
      'internacional': 'BI'
    };

    return mapa[nombreBanco.toLowerCase().trim()] || null;
  }

  /**
   * Convierte monto de string a número limpiando caracteres especiales
   * @param {string} montoString - Monto como string (ej: "$1,234.56" o "1234.56")
   * @returns {number} Monto como número
   */
  static convertirMontoANumero(montoString) {
    if (typeof montoString === 'number') {
      return montoString;
    }

    if (typeof montoString !== 'string') {
      return 0;
    }

    // Remover símbolos y espacios
    const limpio = montoString
      .replace(/[$,\s]/g, '')
      .replace(/,/g, '.')
      .trim();

    const numero = parseFloat(limpio);
    return isNaN(numero) ? 0 : numero;
  }

  /**
   * Convierte fecha en diferentes formatos
   * @param {Date|string} fecha - Fecha a convertir
   * @param {string} formatoDestino - 'timestamp', 'iso', 'corto', 'largo'
   * @returns {string|number} Fecha convertida
   */
  static convertirFecha(fecha, formatoDestino = 'iso') {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;

    if (isNaN(date.getTime())) {
      return null;
    }

    const conversiones = {
      timestamp: Math.floor(date.getTime() / 1000),
      iso: date.toISOString(),
      corto: date.toLocaleDateString('es-EC'),
      largo: date.toLocaleDateString('es-EC', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    };

    return conversiones[formatoDestino] || date.toISOString();
  }

  /**
   * Convierte entre monedas (simple ejemplo)
   * @param {number} monto - Monto a convertir
   * @param {string} monedaOrigen - Código de moneda origen ('USD', 'EUR', etc)
   * @param {string} monedaDestino - Código de moneda destino
   * @returns {number} Monto convertido
   */
  static convertirMoneda(monto, monedaOrigen = 'USD', monedaDestino = 'USD') {
    // Tasas de cambio aproximadas (debería obtenerse de API real)
    const tasas = {
      'USD': 1.0,
      'EUR': 1.1,
      'GBP': 1.27,
      'MXN': 0.058
    };

    if (!tasas[monedaOrigen] || !tasas[monedaDestino]) {
      return monto;
    }

    return (monto * tasas[monedaDestino]) / tasas[monedaOrigen];
  }

  /**
   * Convierte código de banco a objeto con información completa
   * @param {string} codigoBanco - Código del banco
   * @returns {Object} Información del banco
   */
  static convertirCodigoBancoAInfo(codigoBanco) {
    const bancos = {
      'PICHINCHA': {
        nombre: 'Banco del Pichincha',
        codigo: 'PICHINCHA',
        numeroIdentificacion: '0000000000001',
        estado: 'Activo',
        tiposServicios: ['Transferencias', 'Pagos', 'Consultas']
      },
      'BG': {
        nombre: 'Banco de Guayaquil',
        codigo: 'BG',
        numeroIdentificacion: '0000000000002',
        estado: 'Activo',
        tiposServicios: ['Transferencias', 'Pagos']
      }
    };

    return bancos[codigoBanco] || null;
  }

  /**
   * Convierte objeto de transferencia a formato plano para exportación
   * @param {Object} transferencia - Objeto de transferencia
   * @returns {Object} Objeto plano con claves normalizadas
   */
  static convertirTransferenciaAExportacion(transferencia) {
    return {
      id: transferencia.id_trf,
      idTransaccion: transferencia.id_tra,
      fecha: transferencia.tra_fecha_hora,
      monto: transferencia.tra_monto,
      tipo: transferencia.trf_tipo_transferencia === '00' ? 'Interna' : 'Interbancaria',
      estado: transferencia.tra_estado,
      destinatario: transferencia.con_nombre_beneficiario || transferencia.trf_email_destino,
      banco: transferencia.ban_nombre || 'Pichincha',
      comision: transferencia.trf_comision,
      descripcion: transferencia.tra_descripcion
    };
  }

  /**
   * Convierte código de validación a mensaje de error legible
   * @param {string} codigo - Código de error
   * @returns {string} Mensaje de error
   */
  static convertirCodigoErrorAMensaje(codigo) {
    const mensajes = {
      'VALIDACION_BASICA_FALLIDA': 'Los datos proporcionados no son válidos',
      'VALIDACION_MONTO_FALLIDA': 'El monto ingresado no es válido',
      'LIMITE_EXCEDIDO': 'Ha excedido el límite de transferencias permitidas',
      'POSIBLE_DUPLICADO': 'Se detectó una transferencia similar recientemente',
      'BANCO_INVALIDO': 'El banco destino no es válido',
      'SALDO_INSUFICIENTE': 'Saldo insuficiente para realizar la transferencia',
      'NO_AUTENTICADO': 'Debe iniciar sesión para continuar',
      'CUENTA_BLOQUEADA': 'Su cuenta no puede realizar transferencias en este momento',
      'ERROR_INTERNO': 'Ocurrió un error interno, por favor intente más tarde'
    };

    return mensajes[codigo] || 'Error desconocido';
  }
}

module.exports = ConvertidorTransferencias;
