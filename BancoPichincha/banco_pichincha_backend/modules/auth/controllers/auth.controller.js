const authService = require('../services/auth.service');

class AuthController {
  async login(req, res) {
    try {
      const { usuario, password } = req.body;
      const persona = await authService.login(usuario, password);
      
      res.json({
        ok: true,
        msg: 'Inicio de sesión exitoso',
        data: persona
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al iniciar sesión'
      });
    }
  }

  async registro(req, res) {
    try {
      const persona = await authService.registro(req.body);
      
      res.status(201).json({
        ok: true,
        msg: 'Registro exitoso',
        data: persona
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al registrar'
      });
    }
  }

  async getProfile(req, res) {
    try {
      const { id } = req.params;
      const persona = await authService.getProfile(id);
      
      res.json({
        ok: true,
        data: persona
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al obtener perfil'
      });
    }
  }
}

module.exports = new AuthController();
