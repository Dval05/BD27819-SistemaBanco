const express = require('express');
const router = express.Router();
const AuthController = require('./controllers/auth.controller');
const ProductosController = require('./controllers/productos.controller');

router.post('/login', AuthController.login);
router.post('/registro', AuthController.registro);
router.get('/perfil/:id', AuthController.getProfile);
router.get('/productos/:idPersona', ProductosController.getProductos);

module.exports = router;
