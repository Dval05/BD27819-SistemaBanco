const contactoRepository = require('../repositories/contacto.repository');
const bancoRepository = require('../repositories/banco.repository');

/**
 * Contacto Service
 * Lógica de negocio para gestión de contactos guardados
 */
class ContactoService {
  /**
   * Obtiene todos los contactos de un usuario
   * @param {string} idPersona - ID de la persona
   * @returns {Promise<Object>} Respuesta con contactos
   */
  async obtenerContactosUsuario(idPersona) {
    try {
      // Validación
      if (!idPersona || typeof idPersona !== 'string') {
        return {
          exito: false,
          mensaje: 'ID de persona inválido',
          datos: []
        };
      }

      const contactos = await contactoRepository.obtenerContactosPorPersona(idPersona);

      return {
        exito: true,
        mensaje: contactos.length > 0 ? 'Contactos obtenidos exitosamente' : 'No hay contactos guardados',
        datos: contactos.map(contacto => this._formatarContacto(contacto))
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al obtener contactos: ${error.message}`,
        datos: []
      };
    }
  }

  /**
   * Obtiene un contacto específico por ID
   * @param {string} idContacto - ID del contacto
   * @returns {Promise<Object>} Respuesta con datos del contacto
   */
  async obtenerContactoPorId(idContacto) {
    try {
      if (!idContacto || typeof idContacto !== 'string') {
        return {
          exito: false,
          mensaje: 'ID de contacto inválido',
          datos: null
        };
      }

      const contacto = await contactoRepository.obtenerContactoPorId(idContacto);

      if (!contacto) {
        return {
          exito: false,
          mensaje: 'Contacto no encontrado',
          datos: null
        };
      }

      return {
        exito: true,
        mensaje: 'Contacto obtenido exitosamente',
        datos: this._formatarContacto(contacto)
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al obtener contacto: ${error.message}`,
        datos: null
      };
    }
  }

  /**
   * Crea un nuevo contacto con validaciones
   * @param {string} idContacto - ID del nuevo contacto
   * @param {string} idPersona - ID de la persona propietaria
   * @param {Object} datosContacto - Datos del contacto
   * @returns {Promise<Object>} Respuesta con contacto creado
   */
  async crearContacto(idContacto, idPersona, datosContacto) {
    try {
      // Validaciones básicas
      const validacion = this._validarDatosContacto(datosContacto);
      if (!validacion.valido) {
        return {
          exito: false,
          mensaje: validacion.mensaje,
          datos: null
        };
      }

      // Verificar si ya existe un contacto con esta cuenta
      const existe = await contactoRepository.existeContactoConCuenta(
        idPersona,
        datosContacto.conNumeroCuenta
      );

      if (existe) {
        return {
          exito: false,
          mensaje: 'Ya existe un contacto con este número de cuenta',
          datos: null
        };
      }

      // Si es transferencia interbancaria, validar el banco
      if (datosContacto.idBanco) {
        const banco = await bancoRepository.obtenerBancoPorId(datosContacto.idBanco);
        if (!banco || banco.ban_estado !== '00') {
          return {
            exito: false,
            mensaje: 'Banco destino no válido o no está activo',
            datos: null
          };
        }
      }

      // Crear contacto
      const contactoCreado = await contactoRepository.crearContacto({
        idContacto,
        idPersona,
        ...datosContacto
      });

      return {
        exito: true,
        mensaje: 'Contacto creado exitosamente',
        datos: this._formatarContacto(contactoCreado)
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al crear contacto: ${error.message}`,
        datos: null
      };
    }
  }

  /**
   * Actualiza un contacto existente
   * @param {string} idContacto - ID del contacto
   * @param {Object} datosActualizacion - Datos a actualizar
   * @returns {Promise<Object>} Respuesta con contacto actualizado
   */
  async actualizarContacto(idContacto, datosActualizacion) {
    try {
      if (!idContacto) {
        return {
          exito: false,
          mensaje: 'ID de contacto inválido',
          datos: null
        };
      }

      // Validar que el contacto existe
      const contactoExistente = await contactoRepository.obtenerContactoPorId(idContacto);
      if (!contactoExistente) {
        return {
          exito: false,
          mensaje: 'Contacto no encontrado',
          datos: null
        };
      }

      // Actualizar
      const contactoActualizado = await contactoRepository.actualizarContacto(
        idContacto,
        datosActualizacion
      );

      return {
        exito: true,
        mensaje: 'Contacto actualizado exitosamente',
        datos: this._formatarContacto(contactoActualizado)
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al actualizar contacto: ${error.message}`,
        datos: null
      };
    }
  }

  /**
   * Desactiva un contacto (lo marca como inactivo sin eliminarlo)
   * @param {string} idContacto - ID del contacto
   * @returns {Promise<Object>} Respuesta de la operación
   */
  async desactivarContacto(idContacto) {
    try {
      if (!idContacto) {
        return {
          exito: false,
          mensaje: 'ID de contacto inválido'
        };
      }

      // Validar que existe
      const contacto = await contactoRepository.obtenerContactoPorId(idContacto);
      if (!contacto) {
        return {
          exito: false,
          mensaje: 'Contacto no encontrado'
        };
      }

      await contactoRepository.desactivarContacto(idContacto);

      return {
        exito: true,
        mensaje: 'Contacto desactivado exitosamente'
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al desactivar contacto: ${error.message}`
      };
    }
  }

  /**
   * Valida los datos de un contacto
   * @param {Object} datos - Datos del contacto
   * @returns {Object} Resultado de validación
   * @private
   */
  _validarDatosContacto(datos) {
    // Validar alias
    if (!datos.conAlias || typeof datos.conAlias !== 'string' || datos.conAlias.trim().length === 0) {
      return { valido: false, mensaje: 'Alias del contacto es requerido' };
    }

    // Validar número de cuenta
    if (!datos.conNumeroCuenta || typeof datos.conNumeroCuenta !== 'string') {
      return { valido: false, mensaje: 'Número de cuenta es requerido' };
    }

    // Validar formato de número de cuenta (al menos 10 caracteres)
    if (datos.conNumeroCuenta.replace(/\D/g, '').length < 10) {
      return { valido: false, mensaje: 'Número de cuenta debe tener al menos 10 dígitos' };
    }

    // Validar email
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!datos.conEmail || !regexEmail.test(datos.conEmail)) {
      return { valido: false, mensaje: 'Email inválido' };
    }

    // Validar tipo de identificación
    const tiposIdValidos = ['00', '01', '02']; // Cédula, RUC, Pasaporte
    if (!datos.conTipoIdentificacion || !tiposIdValidos.includes(datos.conTipoIdentificacion)) {
      return { valido: false, mensaje: 'Tipo de identificación inválido' };
    }

    // Validar identificación
    if (!datos.conIdentificacion || typeof datos.conIdentificacion !== 'string' || datos.conIdentificacion.trim().length === 0) {
      return { valido: false, mensaje: 'Número de identificación es requerido' };
    }

    // Validar tipo de cuenta
    const tiposCuentaValidos = ['00', '01']; // Ahorros, Corriente
    if (!datos.conTipoCuenta || !tiposCuentaValidos.includes(datos.conTipoCuenta)) {
      return { valido: false, mensaje: 'Tipo de cuenta inválido' };
    }

    // Validar nombre beneficiario si se proporciona
    if (datos.conNombreBeneficiario && typeof datos.conNombreBeneficiario !== 'string') {
      return { valido: false, mensaje: 'Nombre beneficiario debe ser texto' };
    }

    return { valido: true };
  }

  /**
   * Formatea un contacto para respuesta
   * @param {Object} contacto - Datos del contacto
   * @returns {Object} Contacto formateado
   * @private
   */
  _formatarContacto(contacto) {
    const tiposId = { '00': 'Cédula', '01': 'RUC', '02': 'Pasaporte' };
    const tiposCuenta = { '00': 'Ahorros', '01': 'Corriente' };

    return {
      id: contacto.id_contacto,
      alias: contacto.con_alias,
      nombreBeneficiario: contacto.con_nombre_beneficiario,
      tipoIdentificacion: tiposId[contacto.con_tipo_identificacion] || contacto.con_tipo_identificacion,
      identificacion: contacto.con_identificacion,
      numeroCuenta: contacto.con_numero_cuenta,
      email: contacto.con_email,
      tipoCuenta: tiposCuenta[contacto.con_tipo_cuenta] || contacto.con_tipo_cuenta,
      banco: contacto.id_banco,
      estado: contacto.con_estado === '00' ? 'Activo' : 'Inactivo',
      fechaCreacion: contacto.con_fecha_creacion
    };
  }
}

module.exports = new ContactoService();
