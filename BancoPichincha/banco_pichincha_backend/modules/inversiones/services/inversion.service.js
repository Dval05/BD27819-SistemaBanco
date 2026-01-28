const { v4: uuidv4 } = require('uuid');
const inversionRepository = require('../repositories/inversion.repository');
const cronogramaRepository = require('../repositories/cronograma.repository');
const movimientoRepository = require('../repositories/movimiento.repository');
const { InversionEstado, ModalidadInteres } = require('../models/inversion.model');
const { CronogramaTipo, CronogramaEstado } = require('../models/cronograma.model');
const { MovimientoTipo } = require('../models/movimiento.model');

class InversionService {
  async getAll(filters) {
    return inversionRepository.findAll(filters);
  }

  async getById(id) {
    const inversion = await inversionRepository.findById(id);
    if (!inversion) {
      throw { status: 404, message: 'Inversión no encontrada' };
    }
    return inversion;
  }

  async getByCuenta(idCuenta) {
    return inversionRepository.findByCuenta(idCuenta);
  }

  async create(data) {
    this._validateInversion(data);
    
    const inversion = {
      id_inv: uuidv4(),
      id_cuenta: data.idCuenta,
      inv_producto: data.producto,
      inv_monto: data.monto,
      inv_plazo_dias: data.plazoDias,
      inv_modalidad_interes: data.modalidadInteres,
      inv_fecha_apertura: new Date().toISOString().split('T')[0],
      inv_fecha_vencimiento: this._calcularFechaVencimiento(data.plazoDias),
      inv_renovacion_auto: data.renovacionAuto || '01',
      inv_estado: InversionEstado.ACTIVA
    };

    const created = await inversionRepository.create(inversion);
    
    await this._generarCronograma(created);
    await this._registrarMovimientoApertura(created);

    return created;
  }

  async update(id, data) {
    await this.getById(id);
    
    const updateData = {};
    if (data.modalidadInteres) updateData.inv_modalidad_interes = data.modalidadInteres;
    if (data.renovacionAuto) updateData.inv_renovacion_auto = data.renovacionAuto;

    return inversionRepository.update(id, updateData);
  }

  async updateEstado(id, estado) {
    await this.getById(id);
    
    if (!Object.values(InversionEstado).includes(estado)) {
      throw { status: 400, message: 'Estado inválido' };
    }

    return inversionRepository.updateEstado(id, estado);
  }

  async delete(id) {
    const inversion = await this.getById(id);
    
    if (inversion.inv_estado === InversionEstado.ACTIVA) {
      throw { status: 400, message: 'No se puede eliminar una inversión activa' };
    }

    return inversionRepository.delete(id);
  }

  async cancelar(id) {
    const inversion = await this.getById(id);
    
    if (inversion.inv_estado !== InversionEstado.ACTIVA) {
      throw { status: 400, message: 'Solo se pueden cancelar inversiones activas' };
    }

    await inversionRepository.updateEstado(id, InversionEstado.CANCELADA);
    await this._registrarMovimiento(inversion, MovimientoTipo.CANCELACION);

    return this.getById(id);
  }

  _validateInversion(data) {
    if (!data.idCuenta) throw { status: 400, message: 'idCuenta es requerido' };
    if (!data.producto) throw { status: 400, message: 'producto es requerido' };
    if (!data.monto || data.monto <= 0) throw { status: 400, message: 'monto debe ser mayor a 0' };
    if (!data.plazoDias || data.plazoDias < 30) throw { status: 400, message: 'plazoDias mínimo es 30' };
    if (!data.modalidadInteres) throw { status: 400, message: 'modalidadInteres es requerido' };
  }

  _calcularFechaVencimiento(plazoDias) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + plazoDias);
    return fecha.toISOString().split('T')[0];
  }

  async _generarCronograma(inversion) {
    const cronogramas = [];
    const fechaApertura = new Date(inversion.inv_fecha_apertura);
    const fechaVencimiento = new Date(inversion.inv_fecha_vencimiento);
    
    let intervaloMeses;
    switch (inversion.inv_modalidad_interes) {
      case ModalidadInteres.MENSUAL: intervaloMeses = 1; break;
      case ModalidadInteres.TRIMESTRAL: intervaloMeses = 3; break;
      case ModalidadInteres.SEMESTRAL: intervaloMeses = 6; break;
      default: intervaloMeses = null;
    }

    if (intervaloMeses) {
      let fechaPago = new Date(fechaApertura);
      fechaPago.setMonth(fechaPago.getMonth() + intervaloMeses);

      while (fechaPago < fechaVencimiento) {
        cronogramas.push({
          id_invcr: uuidv4(),
          id_inv: inversion.id_inv,
          invcr_tipo: CronogramaTipo.PAGO_INTERES,
          invcr_fecha_programada: fechaPago.toISOString().split('T')[0],
          invcr_monto_programado: Math.round(inversion.inv_monto * 0.05 / (12 / intervaloMeses)),
          invcr_estado: CronogramaEstado.PENDIENTE
        });
        fechaPago.setMonth(fechaPago.getMonth() + intervaloMeses);
      }
    }

    cronogramas.push({
      id_invcr: uuidv4(),
      id_inv: inversion.id_inv,
      invcr_tipo: CronogramaTipo.DEVOLUCION_CAPITAL,
      invcr_fecha_programada: inversion.inv_fecha_vencimiento,
      invcr_monto_programado: inversion.inv_monto,
      invcr_estado: CronogramaEstado.PENDIENTE
    });

    if (cronogramas.length > 0) {
      await cronogramaRepository.createBatch(cronogramas);
    }
  }

  async _registrarMovimientoApertura(inversion) {
    return this._registrarMovimiento(inversion, MovimientoTipo.APERTURA);
  }

  async _registrarMovimiento(inversion, tipo) {
    const movimiento = {
      id_invmov: uuidv4(),
      id_inv: inversion.id_inv,
      id_tra: uuidv4(),
      invmov_tipo: tipo
    };
    return movimientoRepository.create(movimiento);
  }
}

module.exports = new InversionService();
