const vencimientoService = require('../services/vencimiento.service');

class VencimientoController {
  /**
   * POST /api/inversiones/vencimientos/procesar
   * Procesa todas las inversiones vencidas
   */
  async procesarVencimientos(req, res) {
    try {
      const resultados = await vencimientoService.procesarInversionesVencidas();
      
      res.json({
        success: true,
        message: `Se procesaron ${resultados.procesadas.length} inversiones vencidas`,
        data: resultados
      });
    } catch (error) {
      console.error('Error en procesarVencimientos:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error al procesar vencimientos'
      });
    }
  }

  /**
   * POST /api/inversiones/vencimientos/:idInversion/liquidar
   * Liquida una inversión específica (para pruebas/demo)
   */
  async liquidarInversion(req, res) {
    try {
      const { idInversion } = req.params;
      const resultado = await vencimientoService.procesarInversionPorId(idInversion);
      
      res.json({
        success: true,
        message: 'Inversión liquidada exitosamente',
        data: resultado
      });
    } catch (error) {
      console.error('Error en liquidarInversion:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error al liquidar inversión'
      });
    }
  }

  /**
   * GET /api/inversiones/vencimientos/proximas
   * Obtiene inversiones próximas a vencer
   */
  async obtenerProximasVencer(req, res) {
    try {
      const dias = parseInt(req.query.dias) || 7;
      const inversiones = await vencimientoService.obtenerProximasVencer(dias);
      
      res.json({
        success: true,
        data: inversiones,
        meta: {
          total: inversiones.length,
          dias_anticipacion: dias
        }
      });
    } catch (error) {
      console.error('Error en obtenerProximasVencer:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error al obtener inversiones próximas a vencer'
      });
    }
  }
}

module.exports = new VencimientoController();
