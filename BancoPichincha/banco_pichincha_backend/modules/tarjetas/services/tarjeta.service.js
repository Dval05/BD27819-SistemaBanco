const crypto = require('crypto');
const tarjetaRepository = require('../repositories/tarjeta.repository');

// Códigos BIN por marca de tarjeta (primeros 4-6 dígitos)
const CARD_BINS = {
  VISA: ['4532', '4556', '4916', '4929'],
  MASTERCARD: ['5234', '5425', '2221', '5555'],
  DINERS: ['3600', '3605', '3620', '3095'],
  AMEX: ['3400', '3700', '3704', '3711'],
  DISCOVER: ['6011', '6500', '6550', '6444'],
  JCB: ['3528', '3529', '3530', '3589']
};

// Marcas que ofrecen débito y crédito
const MARCAS_POR_TIPO = {
  debito: ['VISA', 'MASTERCARD', 'DISCOVER', 'JCB'],
  credito: ['VISA', 'MASTERCARD', 'DINERS', 'AMEX', 'DISCOVER', 'JCB']
};

class TarjetaService {
  generateId(prefix = 'ID') {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `${prefix}${timestamp}${random}`.substring(0, 20);
  }

  generateNumeroTarjeta(marca = 'VISA') {
    // Obtener prefijos BIN según la marca
    const bins = CARD_BINS[marca] || CARD_BINS.VISA;
    const prefix = bins[Math.floor(Math.random() * bins.length)];
    
    let numero = prefix;
    
    // Generar el resto de dígitos
    const digitsToGenerate = 16 - prefix.length;
    for (let i = 0; i < digitsToGenerate; i++) {
      numero += Math.floor(Math.random() * 10);
    }
    
    return numero;
  }

  generateCVV() {
    return Math.floor(100 + Math.random() * 900).toString();
  }

  hashPin(pin) {
    return crypto.createHash('sha256').update(pin).digest('hex');
  }

  async crearTarjetaDebito(idCuenta, marca = 'VISA') {
    console.log('🔵 Iniciando creación de tarjeta de débito para cuenta:', idCuenta, 'Marca:', marca);
    
    if (!idCuenta) {
      throw { status: 400, message: 'ID de cuenta es requerido' };
    }

    // Validar marca
    if (!CARD_BINS[marca]) {
      throw { status: 400, message: 'Marca de tarjeta no válida' };
    }

    // Validar que la marca ofrezca tarjetas de débito
    if (!MARCAS_POR_TIPO.debito.includes(marca)) {
      throw { 
        status: 400, 
        message: `${marca} no ofrece tarjetas de débito. Solo está disponible para tarjetas de crédito.` 
      };
    }

    let numeroTarjeta;
    let tarjetaExistente;
    do {
      numeroTarjeta = this.generateNumeroTarjeta(marca);
      tarjetaExistente = await tarjetaRepository.findByNumero(numeroTarjeta);
    } while (tarjetaExistente);

    console.log('🔵 Número de tarjeta generado:', numeroTarjeta, `(${marca})`);

    const idTarjeta = this.generateId('TAR');
    const fechaEmision = new Date();
    const fechaExpiracion = new Date();
    fechaExpiracion.setFullYear(fechaExpiracion.getFullYear() + 3); // 3 años de validez

    const pinPorDefecto = '1234'; // PIN por defecto
    const pinHash = this.hashPin(pinPorDefecto);

    const tarjeta = {
      id_tarjeta: idTarjeta,
      id_cuenta: idCuenta,
      tar_numero: numeroTarjeta,
      tar_pin_hash: pinHash,
      tar_fecha_expiracion: fechaExpiracion.toISOString().split('T')[0],
      tar_cvv: this.generateCVV(),
      tar_estado: '00', // Activa
      tar_fecha_emision: fechaEmision.toISOString().split('T')[0],
      tar_contactless: '01' // Con contactless
    };

    console.log('🔵 Creando tarjeta base:', { ...tarjeta, tar_pin_hash: '***' });
    await tarjetaRepository.createTarjeta(tarjeta);
    console.log('✅ Tarjeta base creada exitosamente');

    const tarjetaDebito = {
      id_tarjeta: idTarjeta,
      id_tardeb: this.generateId('DEB'),
      tardeb_trans_dia_retiro: 3,
      tardeb_transacciones_compra: 10,
      tardeb_trans_dia_internacional: 2
    };

    console.log('🔵 Creando tarjeta de débito:', tarjetaDebito);
    await tarjetaRepository.createTarjetaDebito(tarjetaDebito);
    console.log('✅ Tarjeta de débito creada exitosamente');
    
    return {
      id_tarjeta: idTarjeta,
      numero: numeroTarjeta,
      numeroOculto: '****' + numeroTarjeta.slice(-4),
      cvv: tarjeta.tar_cvv,
      fechaExpiracion: tarjeta.tar_fecha_expiracion,
      estado: 'ACTIVA',
      marca: marca,
      pinPorDefecto: pinPorDefecto // Solo para informar al usuario
    };
  }

  async crearTarjetaCredito(idCuenta, cupoAprobado, marca = 'VISA') {
    console.log('🟢 Iniciando creación de tarjeta de crédito para cuenta:', idCuenta, 'Marca:', marca, 'Cupo:', cupoAprobado);
    
    if (!idCuenta) {
      throw { status: 400, message: 'ID de cuenta es requerido' };
    }

    if (!cupoAprobado || cupoAprobado <= 0) {
      throw { status: 400, message: 'Cupo aprobado debe ser mayor a 0' };
    }

    // Validar marca
    if (!CARD_BINS[marca]) {
      throw { status: 400, message: 'Marca de tarjeta no válida' };
    }

    // Validar que la marca ofrezca tarjetas de crédito
    if (!MARCAS_POR_TIPO.credito.includes(marca)) {
      throw { 
        status: 400, 
        message: `${marca} no ofrece tarjetas de crédito. Solo está disponible para tarjetas de débito.` 
      };
    }

    let numeroTarjeta;
    let tarjetaExistente;
    do {
      numeroTarjeta = this.generateNumeroTarjeta(marca);
      tarjetaExistente = await tarjetaRepository.findByNumero(numeroTarjeta);
    } while (tarjetaExistente);

    console.log('🟢 Número de tarjeta generado:', numeroTarjeta, `(${marca})`);

    const idTarjeta = this.generateId('TAR');
    const fechaEmision = new Date();
    const fechaExpiracion = new Date();
    fechaExpiracion.setFullYear(fechaExpiracion.getFullYear() + 3); // 3 años de validez

    const pinPorDefecto = '1234'; // PIN por defecto
    const pinHash = this.hashPin(pinPorDefecto);

    const tarjeta = {
      id_tarjeta: idTarjeta,
      id_cuenta: idCuenta,
      tar_numero: numeroTarjeta,
      tar_pin_hash: pinHash,
      tar_fecha_expiracion: fechaExpiracion.toISOString().split('T')[0],
      tar_cvv: this.generateCVV(),
      tar_estado: '00', // Activa
      tar_fecha_emision: fechaEmision.toISOString().split('T')[0],
      tar_contactless: '01' // Con contactless
    };

    console.log('🟢 Creando tarjeta base:', { ...tarjeta, tar_pin_hash: '***' });
    await tarjetaRepository.createTarjeta(tarjeta);
    console.log('✅ Tarjeta base creada exitosamente');

    // Calcular fecha de corte (día 15 del próximo mes)
    const fechaCorte = new Date();
    fechaCorte.setMonth(fechaCorte.getMonth() + 1);
    fechaCorte.setDate(15);

    // Fecha máxima de pago (10 días después del corte)
    const fechaMaximaPago = new Date(fechaCorte);
    fechaMaximaPago.setDate(fechaMaximaPago.getDate() + 10);

    const tarjetaCredito = {
      id_tarjeta: idTarjeta,
      id_tarcre: this.generateId('CRE'),
      tarcre_cupo_disponible: cupoAprobado,
      tarcre_saldo_actual: 0,
      tarcre_fecha_corte: fechaCorte.toISOString().split('T')[0],
      tarcre_fecha_maxima_pago: fechaMaximaPago.toISOString().split('T')[0],
      tarcre_pago_minimo: 0,
      tarcre_tasa_interes: 18.5 // Tasa anual típica
    };

    console.log('🟢 Creando tarjeta de crédito:', tarjetaCredito);
    await tarjetaRepository.createTarjetaCredito(tarjetaCredito);
    console.log('✅ Tarjeta de crédito creada exitosamente');
    
    return {
      id_tarjeta: idTarjeta,
      numero: numeroTarjeta,
      numeroOculto: '****' + numeroTarjeta.slice(-4),
      cvv: tarjeta.tar_cvv,
      fechaExpiracion: tarjeta.tar_fecha_expiracion,
      estado: 'ACTIVA',
      marca: marca,
      cupoAprobado: cupoAprobado,
      pinPorDefecto: pinPorDefecto // Solo para informar al usuario
    };
  }
}

module.exports = new TarjetaService();
