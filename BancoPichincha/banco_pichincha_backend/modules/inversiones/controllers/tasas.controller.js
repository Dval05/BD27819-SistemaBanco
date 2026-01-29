const tasasService = require('../services/tasas.service');

class TasasController {
  /**
   * Obtiene la tabla de tasas completa
   * GET /api/inversiones/tasas
   */
  async obtenerTabla(req, res) {
    try {
      const tabla = await tasasService.obtenerTabla();

      res.json({
        success: true,
        data: tabla,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener tabla de tasas',
      });
    }
  }

  /**
   * Obtiene la tasa específica para un monto y plazo
   * GET /api/inversiones/tasas/especifica?monto=500&plazoDias=90
   */
  async obtenerTasaEspecifica(req, res) {
    try {
      const { monto, plazoDias } = req.query;

      if (!monto || !plazoDias) {
        return res.status(400).json({
          success: false,
          message: 'Monto y plazo son requeridos',
        });
      }

      const tasa = await tasasService.obtenerTasaEspecifica(
        parseFloat(monto),
        parseInt(plazoDias)
      );

      res.json({
        success: true,
        data: tasa,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener tasa',
      });
    }
  }
}

module.exports = new TasasController();
