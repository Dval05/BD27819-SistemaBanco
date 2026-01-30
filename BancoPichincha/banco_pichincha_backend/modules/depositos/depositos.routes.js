// Rutas para depósitos
const express = require('express');
const router = express.Router();
const depositosController = require('./controllers/depositos.controller');

// POST /depositos - Realizar un depósito
router.post('/', depositosController.realizarDeposito);

module.exports = router;
