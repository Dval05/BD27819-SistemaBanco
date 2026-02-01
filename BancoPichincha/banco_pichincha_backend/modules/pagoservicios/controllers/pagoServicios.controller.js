const pagoServiciosService = require('../services/pagoServicios.service');

class PagoServiciosController {
  
  /**
   * GET /api/pago-servicios/categorias
   * Obtener todas las categorías de servicios
   */
  async getCategorias(req, res) {
    try {
      const categorias = await pagoServiciosService.getCategorias();
      
      res.json({
        ok: true,
        data: categorias
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al obtener categorías'
      });
    }
  }

  /**
   * GET /api/pago-servicios/categorias/:idCat/subcategorias
   * Obtener subcategorías de una categoría específica
   */
  async getSubcategorias(req, res) {
    try {
      const { idCat } = req.params;
      const subcategorias = await pagoServiciosService.getSubcategoriasByCategoria(idCat);
      
      res.json({
        ok: true,
        data: subcategorias
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al obtener subcategorías'
      });
    }
  }

  /**
   * GET /api/pago-servicios/categorias/:idCat/servicios
   * Obtener servicios de una categoría (sin subcategorías)
   */
  async getServiciosByCategoria(req, res) {
    try {
      const { idCat } = req.params;
      const servicios = await pagoServiciosService.getServiciosByCategoria(idCat);
      
      res.json({
        ok: true,
        data: servicios
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al obtener servicios'
      });
    }
  }

  /**
   * GET /api/pago-servicios/subcategorias/:idSubcat/servicios
   * Obtener servicios de una subcategoría
   */
  async getServiciosBySubcategoria(req, res) {
    try {
      const { idSubcat } = req.params;
      const servicios = await pagoServiciosService.getServiciosBySubcategoria(idSubcat);
      
      res.json({
        ok: true,
        data: servicios
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al obtener servicios'
      });
    }
  }

  /**
   * GET /api/pago-servicios/servicios/:idSrv/subtipos
   * Obtener subtipos de un servicio (si tiene)
   */
  async getSubtiposByServicio(req, res) {
    try {
      const { idSrv } = req.params;
      const subtipos = await pagoServiciosService.getSubtiposByServicio(idSrv);
      
      res.json({
        ok: true,
        data: subtipos
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al obtener subtipos'
      });
    }
  }

  /**
   * GET /api/pago-servicios/servicios/:idSrv/datos-requeridos
   * Obtener datos requeridos para un servicio (sin subtipos)
   */
  async getDatosRequeridosByServicio(req, res) {
    try {
      const { idSrv } = req.params;
      const datosRequeridos = await pagoServiciosService.getDatosRequeridosByServicio(idSrv);
      
      res.json({
        ok: true,
        data: datosRequeridos
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al obtener datos requeridos'
      });
    }
  }

  /**
   * GET /api/pago-servicios/subtipos/:idSubtipo/datos-requeridos
   * Obtener datos requeridos para un subtipo de servicio
   */
  async getDatosRequeridosBySubtipo(req, res) {
    try {
      const { idSubtipo } = req.params;
      const datosRequeridos = await pagoServiciosService.getDatosRequeridosBySubtipo(idSubtipo);
      
      res.json({
        ok: true,
        data: datosRequeridos
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al obtener datos requeridos'
      });
    }
  }

  /**
   * POST /api/pago-servicios/validar-datos
   * Validar datos ingresados antes de procesar el pago
   */
  async validarDatos(req, res) {
    try {
      const validacion = await pagoServiciosService.validarDatos(req.body);
      
      res.json({
        ok: true,
        data: validacion
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al validar datos'
      });
    }
  }

  /**
   * POST /api/pago-servicios/procesar-pago
   * Procesar el pago de un servicio
   * 
   * Body:
   * {
   *   id_cuenta: string,
   *   id_srv: string,
   *   id_subtipo: string | null,
   *   tra_monto: number,
   *   datos_servicio: { [key: string]: string }, // Datos requeridos del servicio
   *   tra_descripcion: string
   * }
   */
  async procesarPago(req, res) {
    try {
      const resultado = await pagoServiciosService.procesarPago(req.body);
      
      res.json({
        ok: true,
        msg: 'Pago procesado exitosamente',
        data: resultado
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al procesar pago'
      });
    }
  }

  /**
   * GET /api/pago-servicios/historial/:idPersona
   * Obtener historial de pagos de servicios de una persona
   */
  async getHistorialPagos(req, res) {
    try {
      const { idPersona } = req.params;
      const { limit, offset } = req.query;
      
      const historial = await pagoServiciosService.getHistorialPagosByPersona(
        idPersona,
        parseInt(limit) || 20,
        parseInt(offset) || 0
      );
      
      res.json({
        ok: true,
        data: historial
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al obtener historial'
      });
    }
  }

  /**
   * GET /api/pago-servicios/comprobante/:idPagser
   * Obtener comprobante de un pago específico
   */
  async getComprobante(req, res) {
    try {
      const { idPagser } = req.params;
      const comprobante = await pagoServiciosService.getComprobante(idPagser);
      
      res.json({
        ok: true,
        data: comprobante
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al obtener comprobante'
      });
    }
  }
}

module.exports = new PagoServiciosController();