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
    
    // Descripción del estado
    const estadoDescripcion = {
      '00': 'Activa',
      '01': 'Bloqueada temporalmente',
      '02': 'Bloqueada permanentemente',
      '03': 'Cancelada'
    };
    
    return {
      id: tarjeta.id_tarjeta,
      tipo: 'tarjeta',
      nombre: 'TARJETA DE DÉBITO',
      numero: numeroOculto,
      numeroCompleto: numero,
      fechaExpiracion: tarjeta.tar_fecha_expiracion,
      estado: estadoDescripcion[tarjeta.tar_estado] || 'Desconocido',
      estadoCodigo: tarjeta.tar_estado,
      cvv: tarjeta.tar_cvv,
      saldo: 0
    };
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
