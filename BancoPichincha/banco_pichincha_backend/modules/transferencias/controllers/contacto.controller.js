const contactoService = require('../services/contacto.service');
const { v4: uuidv4 } = require('uuid');

/**
 * Contacto Controller
 * Maneja las peticiones HTTP de contactos guardados
 * Parte del flujo: Opción adicional guardar contacto
 */
class ContactoController {
  /**
   * GET /api/transferencias/contactos
   * Obtiene todos los contactos del usuario autenticado
   * Headers requeridos: Authorization (con usuario)
   * Respuesta: { exito, mensaje, datos: [contactos] }
   */
  async obtenerMisContactos(req, res) {
    try {
      // Obtener ID de persona desde el body o query params
      const idPersona = req.body?.idPersona || req.query?.idPersona;

      if (!idPersona) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID de persona es requerido'
        });
      }

      const resultado = await contactoService.obtenerContactosUsuario(idPersona);

      return res.status(resultado.exito ? 200 : 404).json(resultado);
    } catch (error) {
      return res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /api/transferencias/contactos/cliente/:clienteId
   * Obtiene todos los contactos de un cliente específico
   * Params: clienteId (UUID del cliente)
   * Respuesta: { exito, mensaje, datos: [contactos] }
   */
  async obtenerContactosPorCliente(req, res) {
    try {
      const { clienteId } = req.params;

      if (!clienteId) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID del cliente es requerido'
        });
      }

      const resultado = await contactoService.obtenerContactosUsuario(clienteId);

      return res.status(resultado.exito ? 200 : 404).json(resultado);
    } catch (error) {
      return res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /api/transferencias/contactos/:idContacto
   * Obtiene un contacto específico
   * Params: idContacto
   * Respuesta: { exito, mensaje, datos: contacto }
   */
  async obtenerContacto(req, res) {
    try {
      const { idContacto } = req.params;

      if (!idContacto) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID del contacto es requerido'
        });
      }

      const resultado = await contactoService.obtenerContactoPorId(idContacto);

      return res.status(resultado.exito ? 200 : 404).json(resultado);
    } catch (error) {
      return res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * POST /api/transferencias/contactos
   * Crea un nuevo contacto
   * Puede ser llamado desde dos contextos:
   * 1. Directamente para agregar un contacto
   * 2. Durante el flujo de transferencia (guardar contacto automáticamente)
   * 
   * Body: {
   *   conAlias,
   *   conNombreBeneficiario,
   *   conTipoIdentificacion ('00', '01', '02'),
   *   conIdentificacion,
   *   conNumeroCuenta,
   *   conEmail,
   *   conTipoCuenta ('00', '01'),
   *   idBanco (opcional, para interbancarias)
   * }
   * Respuesta: { exito, mensaje, datos: contactoCreado }
   */
  async crearContacto(req, res) {
    try {
      // Obtener idPersona del body (viene desde el frontend con clienteId transformado a idPersona)
      const idPersona = req.body?.idPersona;

      if (!idPersona) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID de persona es requerido'
        });
      }

      const {
        conAlias,
        conNombreBeneficiario,
        conTipoIdentificacion,
        conIdentificacion,
        conNumeroCuenta,
        conEmail,
        conTipoCuenta,
        idBanco
      } = req.body;

      // Validación de campos requeridos
      const camposFaltantes = [];
      if (!conAlias) camposFaltantes.push('conAlias');
      if (!conNumeroCuenta) camposFaltantes.push('conNumeroCuenta');
      if (!conEmail) camposFaltantes.push('conEmail');
      if (!conTipoCuenta) camposFaltantes.push('conTipoCuenta');
      if (!conTipoIdentificacion) camposFaltantes.push('conTipoIdentificacion');
      if (!conIdentificacion) camposFaltantes.push('conIdentificacion');

      if (camposFaltantes.length > 0) {
        return res.status(400).json({
          exito: false,
          mensaje: `Faltan campos requeridos: ${camposFaltantes.join(', ')}`
        });
      }

      const datosContacto = {
        conAlias,
        conNombreBeneficiario: conNombreBeneficiario || '',
        conTipoIdentificacion,
        conIdentificacion,
        conNumeroCuenta,
        conEmail,
        conTipoCuenta,
        idBanco: idBanco || null
      };

      const resultado = await contactoService.crearContacto(
        uuidv4(),
        idPersona,
        datosContacto
      );

      return res.status(resultado.exito ? 201 : 400).json(resultado);
    } catch (error) {
      return res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/transferencias/contactos/:idContacto
   * Actualiza un contacto existente
   * Params: idContacto
   * Body: { conAlias?, conNombreBeneficiario?, conEmail? }
   * Respuesta: { exito, mensaje, datos: contactoActualizado }
   */
  async actualizarContacto(req, res) {
    try {
      const { idContacto } = req.params;

      if (!idContacto) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID del contacto es requerido'
        });
      }

      const datosActualizacion = {};

      if (req.body.conAlias !== undefined) datosActualizacion.conAlias = req.body.conAlias;
      if (req.body.conNombreBeneficiario !== undefined) datosActualizacion.conNombreBeneficiario = req.body.conNombreBeneficiario;
      if (req.body.conEmail !== undefined) datosActualizacion.conEmail = req.body.conEmail;

      if (Object.keys(datosActualizacion).length === 0) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Debe proporcionar al menos un campo para actualizar'
        });
      }

      const resultado = await contactoService.actualizarContacto(idContacto, datosActualizacion);

      return res.status(resultado.exito ? 200 : 400).json(resultado);
    } catch (error) {
      return res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/transferencias/contactos/:idContacto
   * Desactiva un contacto (soft delete)
   * Params: idContacto
   * Respuesta: { exito, mensaje }
   */
  async desactivarContacto(req, res) {
    try {
      const { idContacto } = req.params;

      if (!idContacto) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID del contacto es requerido'
        });
      }

      const resultado = await contactoService.desactivarContacto(idContacto);

      return res.status(resultado.exito ? 200 : 400).json(resultado);
    } catch (error) {
      return res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

module.exports = new ContactoController();
