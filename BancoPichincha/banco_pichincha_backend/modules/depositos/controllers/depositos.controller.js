// Controlador para depósitos
const depositosService = require('../services/depositos.service');

exports.realizarDeposito = async (req, res) => {
  try {
    const { cuentaId, monto } = req.body;
    const resultado = await depositosService.realizarDeposito(cuentaId, monto);
    res.status(200).json({ mensaje: 'Depósito realizado con éxito', resultado });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
