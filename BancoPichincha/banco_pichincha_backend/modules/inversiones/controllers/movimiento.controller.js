const movimientoService = require('../services/movimiento.service');

class MovimientoController {
  async getByInversion(req, res) {
    try {
      const movimientos = await movimientoService.getByInversion(req.params.idInv);
      res.json({ success: true, data: movimientos });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const movimiento = await movimientoService.getById(req.params.id);
      res.json({ success: true, data: movimiento });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const movimiento = await movimientoService.create(req.params.idInv, req.body);
      res.status(201).json({ success: true, data: movimiento });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new MovimientoController();
