const depositosService = require('../services/depositos.service');

class DepositosController {
  async validarCuenta(req, res) {
    try {
      const { cuenta_id } = req.body;

      console.log('🔍 Validando cuenta:', cuenta_id);

      if (!cuenta_id) {
        return res.status(400).json({
          ok: false,
          error: 'Número de cuenta es requerido'
        });
      }

      if (cuenta_id.length !== 10) {
        return res.status(400).json({
          ok: false,
          error: 'El número de cuenta debe tener 10 dígitos'
        });
      }

      const resultado = await depositosService.validarCuenta(cuenta_id);

      if (!resultado.existe) {
        return res.status(404).json({
          ok: false,
          existe: false,
          error: 'Cuenta no encontrada'
        });
      }

      console.log('✅ Cuenta validada:', resultado);

      res.json({
        ok: true,
        existe: true,
        numeroCuenta: resultado.numeroCuenta,
        nombreTitular: resultado.nombreTitular,
        tipoCuenta: resultado.tipoCuenta
      });
    } catch (error) {
      console.error('❌ Error validando cuenta:', error);
      res.status(500).json({
        ok: false,
        error: 'Error al validar la cuenta'
      });
    }
  }

  
  async realizarDeposito(req, res) {
    try {
      console.log('Cuerpo de la solicitud:', req.body);

      const { cuenta_id, monto } = req.body;

      if (!cuenta_id) {
        return res.status(400).json({
          ok: false,
          error: 'Número de cuenta es requerido'
        });
      }

      if (!monto || monto <= 0) {
        return res.status(400).json({
          ok: false,
          error: 'Debe proporcionar un monto válido mayor a 0'
        });
      }

      if (cuenta_id.length !== 10) {
        return res.status(400).json({
          ok: false,
          error: 'El número de cuenta debe tener exactamente 10 dígitos'
        });
      }

      const resultado = await depositosService.realizarDeposito(cuenta_id, parseFloat(monto));

      console.log('✅ Depósito realizado exitosamente:', resultado);

      res.status(200).json({
        ok: true,
        mensaje: 'Depósito realizado con éxito',
        data: resultado
      });
    } catch (error) {
      console.error('❌ Error realizando depósito:', error); 

      if (error.message === 'Cuenta no encontrada') {
        return res.status(404).json({
          ok: false,
          error: error.message
        });
      }

      res.status(400).json({
        ok: false,
        error: error.message || 'Error al procesar el depósito'
      });
    }
  }

  async obtenerHistorial(req, res) {
    try {
      const { numeroCuenta } = req.params;

      console.log('📋 Obteniendo historial de depósitos:', numeroCuenta);

      if (!numeroCuenta || numeroCuenta.length !== 10) {
        return res.status(400).json({
          ok: false,
          error: 'Número de cuenta inválido'
        });
      }

      const depositos = await depositosService.obtenerHistorial(numeroCuenta);

      res.json({
        ok: true,
        data: depositos
      });
    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      res.status(500).json({
        ok: false,
        error: 'Error al obtener el historial de depósitos'
      });
    }
  }
}

module.exports = new DepositosController();
