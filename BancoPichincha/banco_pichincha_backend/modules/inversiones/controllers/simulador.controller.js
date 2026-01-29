const simuladorService = require('../services/simulador.service');

class SimuladorController {
  /**
   * Simula una inversión
   * POST /api/inversiones/simular
   */
  async simular(req, res) {
    try {
      const { monto, plazoDias } = req.body;

      if (!monto || !plazoDias) {
        return res.status(400).json({
          success: false,
          message: 'Monto y plazo son requeridos',
        });
      }

      const resultado = await simuladorService.simular(
        parseFloat(monto),
        parseInt(plazoDias)
      );

      res.json({
        success: true,
        data: resultado,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error al simular inversión',
      });
    }
  }

  /**
   * Obtiene recomendaciones de plazos
   * GET /api/inversiones/recomendaciones?monto=500
   */
  async obtenerRecomendaciones(req, res) {
    try {
      const { monto } = req.query;

      if (!monto) {
        return res.status(400).json({
          success: false,
          message: 'Monto es requerido',
        });
      }

      const recomendaciones = await simuladorService.obtenerRecomendaciones(
        parseFloat(monto)
      );

      res.json({
        success: true,
        data: recomendaciones,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error al obtener recomendaciones',
      });
    }
  }
}

module.exports = new SimuladorController();
