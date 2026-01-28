const { v4: uuidv4 } = require('uuid');
const cronogramaRepository = require('../repositories/cronograma.repository');
const { CronogramaEstado } = require('../models/cronograma.model');

class CronogramaService {
  async getByInversion(idInv) {
    return cronogramaRepository.findByInversion(idInv);
  }

  async getById(id) {
    const cronograma = await cronogramaRepository.findById(id);
    if (!cronograma) {
      throw { status: 404, message: 'Cronograma no encontrado' };
    }
    return cronograma;
  }

  async getPendientes(idInv) {
    return cronogramaRepository.findPendientes(idInv);
  }

  async create(idInv, data) {
    this._validate(data);

    const cronograma = {
      id_invcr: uuidv4(),
      id_inv: idInv,
      invcr_tipo: data.tipo,
      invcr_fecha_programada: data.fechaProgramada,
      invcr_monto_programado: data.montoProgramado,
      invcr_estado: CronogramaEstado.PENDIENTE
    };

    return cronogramaRepository.create(cronograma);
  }

  async update(id, data) {
    await this.getById(id);

    const updateData = {};
    if (data.fechaProgramada) updateData.invcr_fecha_programada = data.fechaProgramada;
    if (data.montoProgramado) updateData.invcr_monto_programado = data.montoProgramado;

    return cronogramaRepository.update(id, updateData);
  }

  async updateEstado(id, estado) {
    await this.getById(id);

    if (!Object.values(CronogramaEstado).includes(estado)) {
      throw { status: 400, message: 'Estado inválido' };
    }

    return cronogramaRepository.updateEstado(id, estado);
  }

  async ejecutar(id) {
    const cronograma = await this.getById(id);

    if (cronograma.invcr_estado !== CronogramaEstado.PENDIENTE) {
      throw { status: 400, message: 'El cronograma ya fue ejecutado' };
    }

    return this.updateEstado(id, CronogramaEstado.EJECUTADO);
  }

  _validate(data) {
    if (!data.tipo) throw { status: 400, message: 'tipo es requerido' };
    if (!data.fechaProgramada) throw { status: 400, message: 'fechaProgramada es requerido' };
    if (!data.montoProgramado || data.montoProgramado <= 0) {
      throw { status: 400, message: 'montoProgramado debe ser mayor a 0' };
    }
  }
}

module.exports = new CronogramaService();
