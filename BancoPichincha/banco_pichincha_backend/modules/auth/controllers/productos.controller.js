const productosService = require('../services/productos.service');

class ProductosController {
  async getProductos(req, res) {
    try {
      const { idPersona } = req.params;
      const productos = await productosService.getProductosByPersona(idPersona);
      
      res.json({
        ok: true,
        data: productos
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al obtener productos'
      });
    }
  }
}

module.exports = new ProductosController();
