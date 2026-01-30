const cuentaService = require('../services/cuenta.service');

class CuentaController {
  async crearCuentaAhorro(req, res) {
    try {
      const { idPersona } = req.body;
      
      if (!idPersona) {
        return res.status(400).json({
          ok: false,
          msg: 'ID de persona es requerido'
        });
      }

      const cuenta = await cuentaService.crearCuentaAhorroFlexible(idPersona);
      
      res.status(201).json({
        ok: true,
        msg: 'Cuenta de ahorro creada exitosamente',
        data: cuenta
      });
    } catch (error) {
      console.error('Error al crear cuenta de ahorro:', error);
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al crear cuenta de ahorro'
      });
    }
  }

  async getCuentasByPersona(req, res) {
    try {
      const { idPersona } = req.params;
      const cuentas = await cuentaService.getCuentasByPersona(idPersona);
      
      res.json({
        ok: true,
        data: cuentas
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al obtener cuentas'
      });
    }
  }

  async getCuentaById(req, res) {
    try {
      const { id } = req.params;
      const cuenta = await cuentaService.getCuentaById(id);
      
      res.json({
        ok: true,
        data: cuenta
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al obtener cuenta'
      });
    }
  }
}

module.exports = new CuentaController();
