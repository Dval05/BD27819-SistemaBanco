/**
 * Controlador de Transacciones
 * Manejo de peticiones HTTP para transacciones
 */

const transaccionService = require('../services/transaccion.service');

const transaccionController = {
  /**
   * Obtener movimientos de una cuenta
   * GET /api/transacciones/cuenta/:idCuenta
   */
  obtenerMovimientos: async (req, res) => {
    try {
      const { idCuenta } = req.params;
      const { tipo, fechaInicio, fechaFin, limit, offset } = req.query;

      if (!idCuenta) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta es requerido'
        });
      }

      const filtros = {
        tipo,
        fechaInicio,
        fechaFin,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined
      };

      const movimientos = await transaccionService.obtenerMovimientos(idCuenta, filtros);

      return res.json({
        success: true,
        data: movimientos,
        total: movimientos.length
      });
    } catch (error) {
      console.error('Error al obtener movimientos:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener movimientos',
        error: error.message
      });
    }
  },

  /**
   * Obtener detalle de una transacción
   * GET /api/transacciones/:idTransaccion
   */
  obtenerDetalle: async (req, res) => {
    try {
      const { idTransaccion } = req.params;

      if (!idTransaccion) {
        return res.status(400).json({
          success: false,
          message: 'ID de transacción es requerido'
        });
      }

      const detalle = await transaccionService.obtenerDetalle(idTransaccion);

      return res.json({
        success: true,
        data: detalle
      });
    } catch (error) {
      console.error('Error al obtener detalle:', error);
      
      if (error.message === 'Transacción no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error al obtener detalle de transacción',
        error: error.message
      });
    }
  },

  /**
   * Obtener resumen de transacciones de una cuenta
   * GET /api/transacciones/resumen/:idCuenta
   */
  obtenerResumen: async (req, res) => {
    try {
      const { idCuenta } = req.params;

      if (!idCuenta) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta es requerido'
        });
      }

      const resumen = await transaccionService.obtenerResumen(idCuenta);

      return res.json({
        success: true,
        data: resumen
      });
    } catch (error) {
      console.error('Error al obtener resumen:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener resumen de transacciones',
        error: error.message
      });
    }
  },

  /**
   * Obtener tipos de transacción disponibles
   * GET /api/transacciones/tipos
   */
  obtenerTipos: async (req, res) => {
    try {
      const tipos = transaccionService.obtenerTipos();

      return res.json({
        success: true,
        data: tipos
      });
    } catch (error) {
      console.error('Error al obtener tipos:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener tipos de transacción',
        error: error.message
      });
    }
  }
};

module.exports = transaccionController;
