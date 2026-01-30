const cuentaService = require('../services/cuenta.service');

class CuentaController {
  async crearCuentaAhorro(req, res) {
    try {
      const { id_persona } = req.body;
      
      if (!id_persona) {
        return res.status(400).json({
          ok: false,
          msg: 'id_persona es requerido'
        });
      }

      // Verificar si ya tiene cuenta
      const cuentasExistentes = await cuentaService.getCuentasByPersona(id_persona);
      if (cuentasExistentes && cuentasExistentes.length > 0) {
        return res.json({
          ok: true,
          data: cuentasExistentes[0],
          msg: 'Ya existe una cuenta para esta persona'
        });
      }

      // Crear nueva cuenta
      const cuenta = await cuentaService.crearCuentaAhorroFlexible(id_persona);
      
      res.json({
        ok: true,
        success: true,
        data: cuenta,
        msg: 'Cuenta de ahorro creada exitosamente'
      });
    } catch (error) {
      console.error('Error creando cuenta:', error);
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al crear cuenta'
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
