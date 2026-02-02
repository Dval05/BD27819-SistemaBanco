const bancoService = require('../services/banco.service');

/**
 * Banco Controller
 * Maneja las peticiones HTTP relacionadas con bancos
 */
class BancoController {
  /**
   * GET /api/transferencias/bancos
   * Obtiene lista de todos los bancos disponibles
   * Respuesta: { exito, mensaje, datos: [bancos] }
   */
  async obtenerBancos(req, res) {
    try {
      const resultado = await bancoService.obtenerBancosDisponibles();

      return res.status(resultado.exito ? 200 : 404).json(resultado);
    } catch (error) {
      console.error('Error en obtenerBancos:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /api/transferencias/bancos/:idBanco
   * Obtiene un banco específico por ID
   * Params: idBanco
   * Respuesta: { exito, mensaje, datos: banco }
   */
  async obtenerBancoPorId(req, res) {
    try {
      const { idBanco } = req.params;

      if (!idBanco) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID del banco es requerido'
        });
      }

      const resultado = await bancoService.obtenerBancoPorId(idBanco);

      return res.status(resultado.exito ? 200 : 404).json(resultado);
    } catch (error) {
      console.error('Error en obtenerBancoPorId:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /api/transferencias/bancos/codigo/:codigo
   * Obtiene un banco por su código
   * Params: codigo
   * Respuesta: { exito, mensaje, datos: banco }
   */
  async obtenerBancoPorCodigo(req, res) {
    try {
      const { codigo } = req.params;

      if (!codigo) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Código del banco es requerido'
        });
      }

      const resultado = await bancoService.obtenerBancoPorCodigo(codigo);

      return res.status(resultado.exito ? 200 : 404).json(resultado);
    } catch (error) {
      console.error('Error en obtenerBancoPorCodigo:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * POST /api/transferencias/bancos/validar
   * Valida si un banco existe y está activo
   * Body: { idBanco }
   * Respuesta: { valido, mensaje, banco }
   */
  async validarBanco(req, res) {
    try {
      const { idBanco } = req.body;

      if (!idBanco) {
        return res.status(400).json({
          valido: false,
          mensaje: 'ID del banco es requerido'
        });
      }

      const resultado = await bancoService.validarBancoExistente(idBanco);

      return res.status(resultado.valido ? 200 : 400).json(resultado);
    } catch (error) {
      console.error('Error en validarBanco:', error);
      return res.status(500).json({
        valido: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

module.exports = new BancoController();
