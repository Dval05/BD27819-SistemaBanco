const productosRepository = require('../repositories/productos.repository');

class ProductosService {
  async getProductosByPersona(idPersona) {
    if (!idPersona) {
      throw { status: 400, message: 'ID de persona es requerido' };
    }

    console.log('Buscando productos para persona:', idPersona);
    
    const { cuentas, tarjetas, inversiones } = await productosRepository.findAllProductosByPersona(idPersona);

    console.log('Productos encontrados:', { 
      cuentas: cuentas.length, 
      tarjetas: tarjetas.length, 
      inversiones: inversiones.length 
    });

    return {
      cuentas: cuentas.map(c => this._formatCuenta(c)),
      tarjetas: tarjetas.map(t => this._formatTarjeta(t)),
      inversiones: inversiones.map(i => this._formatInversion(i))
    };
  }

  _formatCuenta(cuenta) {
    const numero = cuenta.cue_numero || '';
    const numeroOculto = '******' + numero.slice(-4);
    
    return {
      id: cuenta.id_cuenta,
      tipo: 'cuenta',
      nombre: 'CUENTA AHORROS',
      numero: numeroOculto,
      numeroCompleto: numero,
      saldo: parseFloat(cuenta.cue_saldo_disponible) || 0,
      estado: cuenta.cue_estado,
      fechaApertura: cuenta.cue_fecha_apertura
    };
  }

  _formatTarjeta(tarjeta) {
    const numero = tarjeta.tar_numero || '';
    const numeroOculto = numero.slice(0, 6) + '******' + numero.slice(-4);
    
    // Detectar marca de tarjeta
    const marca = this._detectarMarcaTarjeta(numero);
    
    // Descripción del estado
    const estadoDescripcion = {
      '00': 'Activa',
      '01': 'Bloqueada temporalmente',
      '02': 'Bloqueada permanentemente',
      '03': 'Cancelada'
    };
    
    // Datos de tarjeta de crédito (si existen)
    const datosCredito = tarjeta.tarjeta_credito && tarjeta.tarjeta_credito.length > 0 
      ? tarjeta.tarjeta_credito[0] 
      : null;
    
    return {
      id: tarjeta.id_tarjeta,
      tipo: 'tarjeta',
      subtipo: 'credito',
      nombre: 'TARJETA DE CRÉDITO',
      marca: marca,
      numero: numeroOculto,
      numeroCompleto: numero,
      fechaExpiracion: tarjeta.tar_fecha_expiracion,
      estado: estadoDescripcion[tarjeta.tar_estado] || 'Desconocido',
      estadoCodigo: tarjeta.tar_estado,
      cvv: tarjeta.tar_cvv,
      cupoDisponible: datosCredito ? parseFloat(datosCredito.tarcre_cupo_disponible) || 0 : 0,
      saldoActual: datosCredito ? parseFloat(datosCredito.tarcre_saldo_actual) || 0 : 0,
      fechaCorte: datosCredito ? datosCredito.tarcre_fecha_corte : null,
      fechaMaximaPago: datosCredito ? datosCredito.tarcre_fecha_maxima_pago : null,
      pagoMinimo: datosCredito ? parseFloat(datosCredito.tarcre_pago_minimo) || 0 : 0,
      tasaInteres: datosCredito ? parseFloat(datosCredito.tarcre_tasa_interes) || 0 : 0
    };
  }

  _detectarMarcaTarjeta(numero) {
    const cleanNumber = numero.replace(/\D/g, '').replace(/\*/g, '');
    
    // VISA: Comienza con 4
    if (/^4/.test(cleanNumber)) return 'VISA';
    
    // Mastercard: Comienza con 51-55 o 2221-2720
    if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) return 'MASTERCARD';
    
    // American Express: Comienza con 34 o 37
    if (/^3[47]/.test(cleanNumber)) return 'AMEX';
    
    // Diners Club: Comienza con 36, 38, 39 o 300-305
    if (/^3(?:0[0-5]|[68])/.test(cleanNumber)) return 'DINERS';
    
    // Discover: Comienza con 6011, 622126-622925, 644-649, 65
    if (/^6(?:011|5|4[4-9]|22)/.test(cleanNumber)) return 'DISCOVER';
    
    // JCB: Comienza con 2131, 1800 o 35
    if (/^(?:2131|1800|35)/.test(cleanNumber)) return 'JCB';
    
    return 'TARJETA';
  }

  _formatInversion(inversion) {
    return {
      id: inversion.id_inv,
      tipo: 'inversion',
      nombre: 'INVERSIÓN',
      monto: parseFloat(inversion.inv_monto) || 0,
      producto: inversion.inv_producto,
      plazo: inversion.inv_plazo_dias,
      modalidadInteres: inversion.inv_modalidad_interes,
      fechaApertura: inversion.inv_fecha_apertura,
      fechaVencimiento: inversion.inv_fecha_vencimiento,
      renovacionAuto: inversion.inv_renovacion_auto === '00',
      estado: inversion.inv_estado
    };
  }
}

module.exports = new ProductosService();
