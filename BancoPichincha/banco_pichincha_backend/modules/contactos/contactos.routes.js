const express = require('express');
const router = express.Router();
const contactosController = require('./controllers/contactos.controller');

// Rutas de contactos
router.get('/:id_persona', contactosController.obtenerContactos);
router.post('/', contactosController.crearContacto);
router.put('/:id_contacto', contactosController.editarContacto);
router.delete('/:id_contacto', contactosController.eliminarContacto);
router.delete('/limpiar/:id_persona', contactosController.limpiarTodosContactos);

// Ruta para validar cuentas de Banco Pichincha
router.post('/validar/cuenta', contactosController.validarCuenta);

// Ruta auxiliar para obtener bancos
router.get('/bancos/listar', contactosController.obtenerBancos);

module.exports = router;
