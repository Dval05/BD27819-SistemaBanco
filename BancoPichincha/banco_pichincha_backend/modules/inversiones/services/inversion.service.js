const { v4: uuidv4 } = require('uuid');
const inversionRepository = require('../repositories/inversion.repository');
const cuentaRepository = require('../../cuentas/repositories/cuenta.repository');
const cronogramaRepository = require('../repositories/cronograma.repository');
const movimientoRepository = require('../repositories/movimiento.repository');
const transaccionRepository = require('../../transacciones/repositories/transaccion.repository');
const CalculadoraInversion = require('../utils/calculadora.util');
const { InversionEstado, ModalidadInteres } = require('../models/inversion.model');
const { CronogramaTipo, CronogramaEstado } = require('../models/cronograma.model');
const { MovimientoTipo } = require('../models/movimiento.model');
const { CONFIGURACION_INVERSION } = require('../../../shared/constants/tasas-inversion.constants');

class InversionService {
  async getAll(filters) {
    const data = await inversionRepository.findAll(filters);
    return data.map(inv => ({
      ...inv,
      inv_tasa_interes: CalculadoraInversion.obtenerTasa(inv.inv_monto, inv.inv_plazo_dias),
    }));
  }

  async getById(id) {
    const inversion = await inversionRepository.findById(id);
    if (!inversion) {
      throw { status: 404, message: 'Inversión no encontrada' };
    }
    return {
      ...inversion,
      inv_tasa_interes: CalculadoraInversion.obtenerTasa(inversion.inv_monto, inversion.inv_plazo_dias),
    };
  }

  async getByCuenta(idCuenta) {
    const data = await inversionRepository.findByCuenta(idCuenta);
    return data.map(inv => ({
      ...inv,
      inv_tasa_interes: CalculadoraInversion.obtenerTasa(inv.inv_monto, inv.inv_plazo_dias),
    }));
  }

  /**
   * Obtiene inversiones por persona
   */
  async getByPersona(idPersona) {
    const data = await inversionRepository.findByPersona(idPersona);
    return data.map(inv => ({
      ...inv,
      inv_tasa_interes: CalculadoraInversion.obtenerTasa(inv.inv_monto, inv.inv_plazo_dias),
    }));
  }

  /**
   * Crea una nueva inversión con validaciones completas
   */
  async create(data) {
    // Validaciones de datos
    this._validateInversion(data);

    // Validar que la cuenta exista y tenga saldo suficiente
    const cuenta = await cuentaRepository.findById(data.idCuenta);
    if (!cuenta) {
      throw { status: 404, message: 'Cuenta no encontrada' };
    }

    if (cuenta.cue_estado !== '00') {
      throw { status: 400, message: 'La cuenta no está activa' };
    }

    const saldoDisponible = parseFloat(cuenta.cue_saldo_disponible) || 0;
    if (saldoDisponible < data.monto) {
      throw {
        status: 400,
        message: `Saldo insuficiente. Saldo disponible: $${saldoDisponible.toFixed(2)}, Monto requerido: $${data.monto.toFixed(2)}`,
      };
    }

    // Calcular tasa de interés según monto y plazo
    const tasa = CalculadoraInversion.obtenerTasa(data.monto, data.plazoDias);
    
    const fechaApertura = new Date().toISOString().split('T')[0];
    const fechaVencimiento = CalculadoraInversion.calcularFechaVencimiento(
      fechaApertura,
      data.plazoDias
    );

    // Crear la inversión
    const inversion = {
      id_inv: uuidv4(),
      id_cuenta: data.idCuenta,
      inv_producto: '00', // Depósito a Plazo Fijo
      inv_monto: data.monto,
      inv_plazo_dias: data.plazoDias,
      inv_modalidad_interes: data.modalidadInteres || ModalidadInteres.AL_VENCIMIENTO,
      inv_tasa_interes: tasa,
      inv_fecha_apertura: fechaApertura,
      inv_fecha_vencimiento: fechaVencimiento,
      inv_renovacion_auto: data.renovacionAuto || CONFIGURACION_INVERSION.RENOVACION_AUTOMATICA_DEFAULT,
      inv_estado: InversionEstado.ACTIVA,
    };

    // Crear inversión en BD
    const created = await inversionRepository.create(inversion);

    // Debitar el monto de la cuenta
    const nuevoSaldo = Math.round((saldoDisponible - data.monto) * 100) / 100;
    await cuentaRepository.updateSaldo(data.idCuenta, nuevoSaldo);

    // Generar cronograma de pagos
    await this._generarCronograma(created, tasa);

    // Registrar movimiento de apertura
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

  /**
   * Cancela una inversión antes del vencimiento
   */
  async cancelar(id) {
    const inversion = await this.getById(id);

    if (inversion.inv_estado !== InversionEstado.ACTIVA) {
      throw { status: 400, message: 'Solo se pueden cancelar inversiones activas' };
    }

    // Devolver el monto a la cuenta (sin intereses por cancelación anticipada)
    const cuenta = await cuentaRepository.findById(inversion.id_cuenta);
    const saldoActual = parseFloat(cuenta.cue_saldo_disponible) || 0;
    const nuevoSaldo = saldoActual + parseFloat(inversion.inv_monto);

    await cuentaRepository.updateSaldo(inversion.id_cuenta, nuevoSaldo);

    // Actualizar estado
    await inversionRepository.updateEstado(id, InversionEstado.CANCELADA);

    // Registrar movimiento de cancelación
    await this._registrarMovimiento(inversion, MovimientoTipo.CANCELACION);

    return this.getById(id);
  }

  _validateInversion(data) {
    if (!data.idCuenta) throw { status: 400, message: 'idCuenta es requerido' };
    
    if (!data.monto || data.monto < CONFIGURACION_INVERSION.MONTO_MINIMO) {
      throw {
        status: 400,
        message: `El monto mínimo es $${CONFIGURACION_INVERSION.MONTO_MINIMO}`,
      };
    }

    if (data.monto > CONFIGURACION_INVERSION.MONTO_MAXIMO) {
      throw {
        status: 400,
        message: `El monto máximo es $${CONFIGURACION_INVERSION.MONTO_MAXIMO}`,
      };
    }

    if (!data.plazoDias || data.plazoDias < CONFIGURACION_INVERSION.PLAZO_MINIMO_DIAS) {
      throw {
        status: 400,
        message: `El plazo mínimo es ${CONFIGURACION_INVERSION.PLAZO_MINIMO_DIAS} días`,
      };
    }

    if (data.plazoDias > CONFIGURACION_INVERSION.PLAZO_MAXIMO_DIAS) {
      throw {
        status: 400,
        message: `El plazo máximo es ${CONFIGURACION_INVERSION.PLAZO_MAXIMO_DIAS} días`,
      };
    }
  }

  async _generarCronograma(inversion, tasa) {
    const cronogramas = [];
    const fechaApertura = new Date(inversion.inv_fecha_apertura);
    const fechaVencimiento = new Date(inversion.inv_fecha_vencimiento);
    const monto = parseFloat(inversion.inv_monto);

    // Calcular interés total
    const interesTotal = CalculadoraInversion.calcularInteres(
      monto,
      tasa,
      inversion.inv_plazo_dias
    );

    let intervaloMeses;
    switch (inversion.inv_modalidad_interes) {
      case ModalidadInteres.MENSUAL:
        intervaloMeses = 1;
        break;
      case ModalidadInteres.TRIMESTRAL:
        intervaloMeses = 3;
        break;
      case ModalidadInteres.SEMESTRAL:
        intervaloMeses = 6;
        break;
      default:
        intervaloMeses = null;
    }

    // Generar cronograma de pagos periódicos de interés
    if (intervaloMeses) {
      let fechaPago = new Date(fechaApertura);
      fechaPago.setMonth(fechaPago.getMonth() + intervaloMeses);

      let pagosGenerados = 0;
      while (fechaPago < fechaVencimiento) {
        pagosGenerados++;
        const interesPeriodo = interesTotal / Math.ceil(inversion.inv_plazo_dias / 30 / intervaloMeses);

        cronogramas.push({
          id_invcr: uuidv4(),
          id_inv: inversion.id_inv,
          invcr_tipo: CronogramaTipo.PAGO_INTERES,
          invcr_fecha_programada: fechaPago.toISOString().split('T')[0],
          // Guardar como entero (la columna en BD es integer)
          invcr_monto_programado: Math.round(interesPeriodo),
          invcr_estado: CronogramaEstado.PENDIENTE,
        });

        fechaPago.setMonth(fechaPago.getMonth() + intervaloMeses);
      }
    }

    // Cronograma de devolución de capital al vencimiento
    cronogramas.push({
      id_invcr: uuidv4(),
      id_inv: inversion.id_inv,
      invcr_tipo: CronogramaTipo.DEVOLUCION_CAPITAL,
      invcr_fecha_programada: inversion.inv_fecha_vencimiento,
      invcr_monto_programado: Math.round(monto),
      invcr_estado: CronogramaEstado.PENDIENTE,
    });

    // Si es pago al vencimiento, agregar interés también al final
    if (inversion.inv_modalidad_interes === ModalidadInteres.AL_VENCIMIENTO) {
      cronogramas.push({
        id_invcr: uuidv4(),
        id_inv: inversion.id_inv,
        invcr_tipo: CronogramaTipo.PAGO_INTERES,
        invcr_fecha_programada: inversion.inv_fecha_vencimiento,
        invcr_monto_programado: Math.round(interesTotal),
        invcr_estado: CronogramaEstado.PENDIENTE,
      });
    }

    if (cronogramas.length > 0) {
      await cronogramaRepository.createBatch(cronogramas);
    }

    return cronogramas;
  }

  async _registrarMovimientoApertura(inversion) {
    return this._registrarMovimiento(inversion, MovimientoTipo.APERTURA);
  }

  async _registrarMovimiento(inversion, tipo) {
    const id_invmov = uuidv4();
    const id_tra = uuidv4();

    // Crear transacción asociada (registro en tabla transaccion)
    const monto = parseFloat(inversion.inv_monto);
    const transaccion = {
      id_tra,
      id_cuenta: inversion.id_cuenta,
      tra_fecha_hora: new Date().toISOString(),
      // monto negativo porque se debita de la cuenta
      tra_monto: Math.round(-Math.abs(monto) * 100) / 100,
      tra_tipo: '01', // Retiro
      tra_descripcion: `Apertura inversión ${inversion.id_inv}`,
      tra_estado: '01', // Completada
    };

    await transaccionRepository.create(transaccion);

    const movimiento = {
      id_invmov,
      id_inv: inversion.id_inv,
      id_tra,
      invmov_tipo: tipo,
    };

    return movimientoRepository.create(movimiento);
  }
}

module.exports = new InversionService();
