const crypto = require('crypto');
const tarjetaRepository = require('../repositories/tarjeta.repository');

class TarjetaService {
  generateId(prefix = 'ID') {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `${prefix}${timestamp}${random}`.substring(0, 20);
  }

  generateNumeroTarjeta() {
    // Generar número de tarjeta Visa (comienza con 4)
    const prefix = '4532';
    let numero = prefix;
    
    for (let i = 0; i < 12; i++) {
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

  async crearTarjetaDebito(idCuenta) {
    console.log('🔵 Iniciando creación de tarjeta de débito para cuenta:', idCuenta);
    
    if (!idCuenta) {
      throw { status: 400, message: 'ID de cuenta es requerido' };
    }

    let numeroTarjeta;
    let tarjetaExistente;
    do {
      numeroTarjeta = this.generateNumeroTarjeta();
      tarjetaExistente = await tarjetaRepository.findByNumero(numeroTarjeta);
    } while (tarjetaExistente);

    console.log('🔵 Número de tarjeta generado:', numeroTarjeta);

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
      pinPorDefecto: pinPorDefecto // Solo para informar al usuario
    };
  }
}

module.exports = new TarjetaService();
