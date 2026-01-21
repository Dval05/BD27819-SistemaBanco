import express from 'express';
import ClienteController from '../controllers/cliente.controller.js';

const router = express.Router();

// Autenticación
router.post('/login', ClienteController.login);
router.post('/registro', ClienteController.crear);

// Estadísticas generales
router.get('/estadisticas', ClienteController.obtenerEstadisticas);

// Buscar cliente por código DEUNA (para verificar antes de transferir)
router.get('/codigo/:codigo', ClienteController.buscarPorCodigo);

// CRUD de clientes
router.post('/', ClienteController.crear);
router.get('/', ClienteController.obtenerTodos);
router.get('/:id', ClienteController.obtenerPorId);
router.put('/:id', ClienteController.actualizar);
router.delete('/:id', ClienteController.eliminar);

// Operaciones DEUNA
router.post('/:id/depositar', ClienteController.depositar);
router.post('/:id/transferir', ClienteController.transferir);
router.get('/:id/transacciones', ClienteController.obtenerTransacciones);
router.post('/:id/regenerar-codigo', ClienteController.regenerarCodigo);

export default router;
