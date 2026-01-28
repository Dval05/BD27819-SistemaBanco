const cronogramaService = require('../services/cronograma.service');

class CronogramaController {
  async getByInversion(req, res) {
    try {
      const cronogramas = await cronogramaService.getByInversion(req.params.idInv);
      res.json({ success: true, data: cronogramas });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const cronograma = await cronogramaService.getById(req.params.id);
      res.json({ success: true, data: cronograma });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const cronograma = await cronogramaService.create(req.params.idInv, req.body);
      res.status(201).json({ success: true, data: cronograma });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const cronograma = await cronogramaService.update(req.params.id, req.body);
      res.json({ success: true, data: cronograma });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  async updateEstado(req, res) {
    try {
      const { estado } = req.body;
      const cronograma = await cronogramaService.updateEstado(req.params.id, estado);
      res.json({ success: true, data: cronograma });
    } catch (error) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new CronogramaController();
