const cuentaService = require('../services/cuenta.service');

class CuentaController {
  async crearCuentaAhorro(req, res) {
    try {
      const { id_persona, idPersona } = req.body;
      const personaId = id_persona || idPersona;
      
      if (!personaId) {
        return res.status(400).json({
          ok: false,
          msg: 'id_persona es requerido'
        });
      }

      // Verificar si ya tiene cuenta
      const cuentasExistentes = await cuentaService.getCuentasByPersona(personaId);
      if (cuentasExistentes && cuentasExistentes.length > 0) {
        return res.json({
          ok: true,
          data: cuentasExistentes[0],
          msg: 'Ya existe una cuenta para esta persona'
        });
      }

      // Crear nueva cuenta
      const cuenta = await cuentaService.crearCuentaAhorroFlexible(personaId);
      
      res.status(201).json({
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

  async crearCuentaConTarjeta(req, res) {
    try {
      const { id_persona, idPersona, tipoCuenta } = req.body;
      const personaId = id_persona || idPersona;
      
      if (!personaId) {
        return res.status(400).json({
          ok: false,
          msg: 'id_persona es requerido'
        });
      }

      if (!tipoCuenta || !['ahorro', 'corriente'].includes(tipoCuenta)) {
        return res.status(400).json({
          ok: false,
          msg: 'tipoCuenta debe ser "ahorro" o "corriente"'
        });
      }

      // Crear cuenta con tarjeta de débito
      const resultado = await cuentaService.crearCuentaConTarjeta(personaId, tipoCuenta);
      
      res.status(201).json({
        ok: true,
        success: true,
        data: resultado,
        msg: `Cuenta ${tipoCuenta === 'ahorro' ? 'de ahorro' : 'corriente'} y tarjeta de débito creadas exitosamente`
      });
    } catch (error) {
      console.error('Error creando cuenta con tarjeta:', error);
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al crear cuenta con tarjeta'
      });
    }
  }
}

module.exports = new CuentaController();
