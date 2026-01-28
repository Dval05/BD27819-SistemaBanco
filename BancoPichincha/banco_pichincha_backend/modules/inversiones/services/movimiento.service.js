const { v4: uuidv4 } = require('uuid');
const movimientoRepository = require('../repositories/movimiento.repository');

class MovimientoService {
  async getByInversion(idInv) {
    return movimientoRepository.findByInversion(idInv);
  }

  async getById(id) {
    const movimiento = await movimientoRepository.findById(id);
    if (!movimiento) {
      throw { status: 404, message: 'Movimiento no encontrado' };
    }
    return movimiento;
  }

  async getByTransaccion(idTra) {
    return movimientoRepository.findByTransaccion(idTra);
  }

  async create(idInv, data) {
    this._validate(data);

    const movimiento = {
      id_invmov: uuidv4(),
      id_inv: idInv,
      id_tra: data.idTransaccion || uuidv4(),
      invmov_tipo: data.tipo
    };

    return movimientoRepository.create(movimiento);
  }

  _validate(data) {
    if (!data.tipo) throw { status: 400, message: 'tipo es requerido' };
  }
}

module.exports = new MovimientoService();
