const inversionService = require('../services/inversion.service');

class InversionController {
  async getAll(req, res) {
    try {
      const filters = {
        estado: req.query.estado,
        producto: req.query.producto,
        idCuenta: req.query.idCuenta,
      };
      const inversiones = await inversionService.getAll(filters);
      res.json({ success: true, data: inversiones });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const inversion = await inversionService.getById(req.params.id);
      res.json({ success: true, data: inversion });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  async getByCuenta(req, res) {
    try {
      const inversiones = await inversionService.getByCuenta(req.params.idCuenta);
      res.json({ success: true, data: inversiones });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  async getByPersona(req, res) {
    try {
      const inversiones = await inversionService.getByPersona(req.params.idPersona);
      res.json({ success: true, data: inversiones });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const inversion = await inversionService.create(req.body);
      res.status(201).json({ success: true, data: inversion });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const inversion = await inversionService.update(req.params.id, req.body);
      res.json({ success: true, data: inversion });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  async updateEstado(req, res) {
    try {
      const { estado } = req.body;
      const inversion = await inversionService.updateEstado(req.params.id, estado);
      res.json({ success: true, data: inversion });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  async cancelar(req, res) {
    try {
      const inversion = await inversionService.cancelar(req.params.id);
      res.json({ 
        success: true, 
        message: 'Inversión cancelada exitosamente',
        data: inversion 
      });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      await inversionService.delete(req.params.id);
      res.json({ success: true, message: 'Inversión eliminada' });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new InversionController();
