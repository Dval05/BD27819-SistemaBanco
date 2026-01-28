const { v4: uuidv4 } = require('uuid');
const solicitudRepository = require('../repositories/solicitud.repository');
const tarjetaRepository = require('../repositories/tarjeta.repository');

const crypto = require('crypto');

class SolicitudService {
  /**
   * Genera un número de tarjeta único de 16 dígitos
   * @param {string} tipo - 'DEBITO' o 'CREDITO'
   */
  generateNumeroTarjeta(tipo) {
    // Prefijos según tipo de tarjeta
    const prefix = tipo === 'CREDITO' ? '4532' : '4917'; // Visa
    const random = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    return prefix + random;
  }

  /**
   * Genera un CVV de 3 dígitos
   */
  generateCVV() {
    return Math.floor(100 + Math.random() * 900).toString();
  }

  /**
   * Genera un PIN hash (4 dígitos hasheados)
   */
  generatePinHash() {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    return crypto.createHash('sha256').update(pin).digest('hex');
  }

  /**
   * Genera fecha de expiración (3 años desde hoy)
   */
  generateFechaExpiracion() {
    const fecha = new Date();
    fecha.setFullYear(fecha.getFullYear() + 3);
    return fecha.toISOString().split('T')[0];
  }

  /**
   * Crea una nueva solicitud de tarjeta
   * @param {Object} data - Datos de la solicitud
   */
  async crearSolicitud(data) {
    this._validateSolicitud(data);

    const solicitud = {
      id_solicitud: uuidv4(),
      id_persona: data.idPersona,
      id_cuenta: data.idCuenta,
      sol_tipo_tarjeta: data.tipoTarjeta, // 'DEBITO' o 'CREDITO'
      sol_fecha_solicitud: new Date().toISOString(),
      sol_estado: '00', // 00 = Pendiente
      sol_motivo: data.motivo || 'Solicitud de nueva tarjeta',
      sol_limite_solicitado: data.tipoTarjeta === 'CREDITO' ? (data.limiteSolicitado || 1000) : null
    };

    const solicitudCreada = await solicitudRepository.create(solicitud);
    
    console.log('Solicitud de tarjeta creada:', {
      idSolicitud: solicitudCreada.id_solicitud,
      tipo: data.tipoTarjeta,
      idPersona: data.idPersona
    });

    return this._formatSolicitud(solicitudCreada);
  }

  /**
   * Obtiene las solicitudes de una persona
   */
  async getSolicitudesByPersona(idPersona) {
    if (!idPersona) {
      throw { status: 400, message: 'ID de persona es requerido' };
    }

    const solicitudes = await solicitudRepository.findByPersona(idPersona);
    return solicitudes.map(s => this._formatSolicitud(s));
  }

  /**
   * Obtiene una solicitud por ID
   */
  async getSolicitudById(idSolicitud) {
    const solicitud = await solicitudRepository.findById(idSolicitud);
    if (!solicitud) {
      throw { status: 404, message: 'Solicitud no encontrada' };
    }
    return this._formatSolicitud(solicitud);
  }

  /**
   * Obtiene todas las solicitudes pendientes (para administradores)
   */
  async getSolicitudesPendientes() {
    const solicitudes = await solicitudRepository.findPendientes();
    return solicitudes.map(s => this._formatSolicitud(s));
  }

  /**
   * Aprueba una solicitud y crea la tarjeta
   * Inserta en TARJETA (tabla padre) y TARJETA_DEBITO o TARJETA_CREDITO (tabla hija)
   * @param {string} idSolicitud - ID de la solicitud
   * @param {Object} data - Datos adicionales (límite de crédito aprobado, etc.)
   */
  async aprobarSolicitud(idSolicitud, data = {}) {
    const solicitud = await solicitudRepository.findById(idSolicitud);
    
    if (!solicitud) {
      throw { status: 404, message: 'Solicitud no encontrada' };
    }

    if (solicitud.sol_estado !== '00') {
      throw { status: 400, message: 'La solicitud ya fue procesada' };
    }

    // Generar número de tarjeta único
    let numeroTarjeta;
    let tarjetaExistente;
    do {
      numeroTarjeta = this.generateNumeroTarjeta(solicitud.sol_tipo_tarjeta);
      tarjetaExistente = await tarjetaRepository.findByNumero(numeroTarjeta);
    } while (tarjetaExistente);

    const idTarjeta = uuidv4();
    const fechaEmision = new Date().toISOString().split('T')[0];
    const fechaExpiracion = this.generateFechaExpiracion();
    const cvv = this.generateCVV();
    const pinHash = this.generatePinHash();

    // 1. Crear registro en tabla TARJETA (tabla padre)
    const tarjetaBase = {
      id_tarjeta: idTarjeta,
      id_cuenta: solicitud.id_cuenta,
      tar_numero: numeroTarjeta,
      tar_pin_hash: pinHash,
      tar_fecha_expiracion: fechaExpiracion,
      tar_cvv: cvv,
      tar_estado: '00', // 00 = Activa
      tar_fecha_emision: fechaEmision,
      tar_contacless: '00' // 00 = Sí tiene contactless
    };

    await tarjetaRepository.createTarjeta(tarjetaBase);

    let tarjetaHija;

    // 2. Crear registro en tabla hija según el tipo
    if (solicitud.sol_tipo_tarjeta === 'DEBITO') {
      const tarjetaDebito = {
        id_tarjeta: idTarjeta,
        id_tardeb: uuidv4(),
        id_cuenta: solicitud.id_cuenta,
        tar_numero: numeroTarjeta,
        tar_pin_hash: pinHash,
        tar_fecha_expiracion: fechaExpiracion,
        tar_cvv: cvv,
        tar_estado: '00',
        tar_fecha_emision: fechaEmision,
        tar_contacless: '00',
        tardeb_trans_dia_ret: 1000, // Límite retiro diario
        tardeb_transacciones_compra: 5000, // Límite compras
        tar_trans_dia_int: 2000 // Límite transacciones internacionales
      };
      tarjetaHija = await tarjetaRepository.createTarjetaDebito(tarjetaDebito);
    } else {
      // CREDITO
      const limiteCredito = data.limiteAprobado || solicitud.sol_limite_solicitado || 1000;
      const fechaCorte = new Date();
      fechaCorte.setDate(15); // Corte el día 15
      const fechaMaxPago = new Date();
      fechaMaxPago.setDate(25); // Pago máximo el día 25

      const tarjetaCredito = {
        id_tarjeta: idTarjeta,
        id_tarcre: uuidv4(),
        id_cuenta: solicitud.id_cuenta,
        tar_numero: numeroTarjeta,
        tar_pin_hash: pinHash,
        tar_fecha_expiracion: fechaExpiracion,
        tar_cvv: cvv,
        tar_estado: '00',
        tar_fecha_emision: fechaEmision,
        tar_contacless: '00',
        tarcre_cupo_disponible: limiteCredito,
        tarcre_saldo_actual: 0,
        tarcre_fecha_corte_dia: fechaCorte.toISOString().split('T')[0],
        tarcre_fecha_maxima_pago: fechaMaxPago.toISOString().split('T')[0],
        tarcre_pago_minimo: 0.00,
        tarcre_tasa_interes: 16.50 // Tasa de interés 16.5%
      };
      tarjetaHija = await tarjetaRepository.createTarjetaCredito(tarjetaCredito);
    }

    // Actualizar estado de la solicitud
    await solicitudRepository.updateEstado(idSolicitud, '01', 'Solicitud aprobada. Tarjeta emitida.');

    console.log('Solicitud aprobada y tarjeta creada:', {
      idSolicitud: idSolicitud,
      idTarjeta: idTarjeta,
      tipo: solicitud.sol_tipo_tarjeta
    });

    return {
      solicitud: this._formatSolicitud({ ...solicitud, sol_estado: '01' }),
      tarjeta: this._formatTarjeta(tarjetaHija, solicitud.sol_tipo_tarjeta)
    };
  }

  /**
   * Rechaza una solicitud
   */
  async rechazarSolicitud(idSolicitud, motivo) {
    const solicitud = await solicitudRepository.findById(idSolicitud);
    
    if (!solicitud) {
      throw { status: 404, message: 'Solicitud no encontrada' };
    }

    if (solicitud.sol_estado !== '00') {
      throw { status: 400, message: 'La solicitud ya fue procesada' };
    }

    await solicitudRepository.updateEstado(idSolicitud, '02', motivo || 'Solicitud rechazada');

    return this._formatSolicitud({ ...solicitud, sol_estado: '02', sol_observacion: motivo });
  }

  _validateSolicitud(data) {
    if (!data.idPersona) {
      throw { status: 400, message: 'ID de persona es requerido' };
    }
    if (!data.idCuenta) {
      throw { status: 400, message: 'ID de cuenta es requerido' };
    }
    if (!data.tipoTarjeta || !['DEBITO', 'CREDITO'].includes(data.tipoTarjeta)) {
      throw { status: 400, message: 'Tipo de tarjeta debe ser DEBITO o CREDITO' };
    }
  }

  _formatSolicitud(solicitud) {
    const estados = {
      '00': 'PENDIENTE',
      '01': 'APROBADA',
      '02': 'RECHAZADA'
    };

    return {
      id: solicitud.id_solicitud,
      idPersona: solicitud.id_persona,
      idCuenta: solicitud.id_cuenta,
      tipoTarjeta: solicitud.sol_tipo_tarjeta,
      fechaSolicitud: solicitud.sol_fecha_solicitud,
      fechaRespuesta: solicitud.sol_fecha_respuesta,
      estado: estados[solicitud.sol_estado] || 'PENDIENTE',
      estadoCodigo: solicitud.sol_estado,
      motivo: solicitud.sol_motivo,
      limiteSolicitado: solicitud.sol_limite_solicitado,
      observacion: solicitud.sol_observacion
    };
  }

  _formatTarjeta(tarjeta, tipoTarjeta) {
    const estados = {
      '00': 'ACTIVA',
      '01': 'INACTIVA',
      '02': 'BLOQUEADA',
      '03': 'VENCIDA',
      '04': 'CANCELADA'
    };

    const numero = tarjeta.tar_numero || '';

    const response = {
      id: tarjeta.id_tarjeta,
      idCuenta: tarjeta.id_cuenta,
      numero: numero.slice(0, 4) + ' **** **** ' + numero.slice(-4),
      numeroCompleto: numero,
      tipo: tipoTarjeta || 'DÉBITO',
      cvv: tarjeta.tar_cvv,
      fechaEmision: tarjeta.tar_fecha_emision,
      fechaExpiracion: tarjeta.tar_fecha_expiracion,
      estado: estados[tarjeta.tar_estado] || 'ACTIVA',
      estadoCodigo: tarjeta.tar_estado,
      contactless: tarjeta.tar_contacless === '00'
    };

    // Campos específicos de tarjeta de débito
    if (tipoTarjeta === 'DEBITO') {
      response.limiteRetiroDiario = tarjeta.tardeb_trans_dia_ret;
      response.limiteCompras = tarjeta.tardeb_transacciones_compra;
      response.limiteInternacional = tarjeta.tar_trans_dia_int;
    }

    // Campos específicos de tarjeta de crédito
    if (tipoTarjeta === 'CREDITO') {
      response.cupoDisponible = tarjeta.tarcre_cupo_disponible;
      response.saldoActual = tarjeta.tarcre_saldo_actual;
      response.fechaCorte = tarjeta.tarcre_fecha_corte_dia;
      response.fechaMaximaPago = tarjeta.tarcre_fecha_maxima_pago;
      response.pagoMinimo = tarjeta.tarcre_pago_minimo;
      response.tasaInteres = tarjeta.tarcre_tasa_interes;
    }

    return response;
  }
}

module.exports = new SolicitudService();
