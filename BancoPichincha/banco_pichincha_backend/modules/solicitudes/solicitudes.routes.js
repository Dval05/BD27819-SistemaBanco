const express = require('express');
const router = express.Router();
const SolicitudController = require('./controllers/solicitud.controller');

// Crear nueva solicitud de tarjeta
router.post('/', SolicitudController.crearSolicitud);

// Obtener solicitudes por persona
router.get('/persona/:idPersona', SolicitudController.getSolicitudesByPersona);

// Obtener solicitudes pendientes (admin)
router.get('/pendientes', SolicitudController.getSolicitudesPendientes);

// Obtener solicitud por ID
router.get('/:id', SolicitudController.getSolicitudById);

// Aprobar solicitud (admin)
router.post('/:id/aprobar', SolicitudController.aprobarSolicitud);

// Rechazar solicitud (admin)
router.post('/:id/rechazar', SolicitudController.rechazarSolicitud);

module.exports = router;
