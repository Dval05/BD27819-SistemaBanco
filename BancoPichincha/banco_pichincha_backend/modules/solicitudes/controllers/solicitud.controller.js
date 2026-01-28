const solicitudService = require('../services/solicitud.service');

class SolicitudController {
  async crearSolicitud(req, res) {
    try {
      const solicitud = await solicitudService.crearSolicitud(req.body);
      
      res.status(201).json({
        ok: true,
        msg: 'Solicitud creada exitosamente',
        data: solicitud
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al crear solicitud'
      });
    }
  }

  async getSolicitudesByPersona(req, res) {
    try {
      const { idPersona } = req.params;
      const solicitudes = await solicitudService.getSolicitudesByPersona(idPersona);
      
      res.json({
        ok: true,
        data: solicitudes
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al obtener solicitudes'
      });
    }
  }

  async getSolicitudById(req, res) {
    try {
      const { id } = req.params;
      const solicitud = await solicitudService.getSolicitudById(id);
      
      res.json({
        ok: true,
        data: solicitud
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al obtener solicitud'
      });
    }
  }

  async getSolicitudesPendientes(req, res) {
    try {
      const solicitudes = await solicitudService.getSolicitudesPendientes();
      
      res.json({
        ok: true,
        data: solicitudes
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al obtener solicitudes pendientes'
      });
    }
  }

  async aprobarSolicitud(req, res) {
    try {
      const { id } = req.params;
      const resultado = await solicitudService.aprobarSolicitud(id, req.body);
      
      res.json({
        ok: true,
        msg: 'Solicitud aprobada exitosamente',
        data: resultado
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al aprobar solicitud'
      });
    }
  }

  async rechazarSolicitud(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      const solicitud = await solicitudService.rechazarSolicitud(id, motivo);
      
      res.json({
        ok: true,
        msg: 'Solicitud rechazada',
        data: solicitud
      });
    } catch (error) {
      res.status(error.status || 500).json({
        ok: false,
        msg: error.message || 'Error al rechazar solicitud'
      });
    }
  }
}

module.exports = new SolicitudController();
