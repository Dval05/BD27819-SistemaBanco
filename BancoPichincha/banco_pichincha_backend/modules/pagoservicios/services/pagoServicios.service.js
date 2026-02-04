const { v4: uuidv4 } = require('uuid');
const pagoServiciosRepository = require('../repositories/pagoServicios.repository');

class PagoServiciosService {

  // =====================================
  // CONSULTAS DE ESTRUCTURA
  // =====================================

  /**
   * Obtener todas las categorías activas
   */
  async getCategorias() {
    try {
      return await pagoServiciosRepository.getCategorias();
    } catch (error) {
      throw { 
        status: 500, 
        message: 'Error al obtener categorías',
        error: error.message 
      };
    }
  }

  /**
   * Obtener subcategorías de una categoría
   */
  async getSubcategoriasByCategoria(idCat) {
    try {
      if (!idCat) {
        throw { status: 400, message: 'ID de categoría requerido' };
      }
      return await pagoServiciosRepository.getSubcategoriasByCategoria(idCat);
    } catch (error) {
      throw { 
        status: error.status || 500, 
        message: error.message || 'Error al obtener subcategorías'
      };
    }
  }

  /**
   * Obtener servicios de una categoría (sin subcategoría)
   */
  async getServiciosByCategoria(idCat) {
    try {
      if (!idCat) {
        throw { status: 400, message: 'ID de categoría requerido' };
      }
      return await pagoServiciosRepository.getServiciosByCategoria(idCat);
    } catch (error) {
      throw { 
        status: error.status || 500, 
        message: error.message || 'Error al obtener servicios'
      };
    }
  }

  /**
   * Obtener servicios de una subcategoría
   */
  async getServiciosBySubcategoria(idSubcat) {
    try {
      if (!idSubcat) {
        throw { status: 400, message: 'ID de subcategoría requerido' };
      }
      return await pagoServiciosRepository.getServiciosBySubcategoria(idSubcat);
    } catch (error) {
      throw { 
        status: error.status || 500, 
        message: error.message || 'Error al obtener servicios'
      };
    }
  }

  /**
   * Obtener subtipos de un servicio
   */
  async getSubtiposByServicio(idSrv) {
    try {
      if (!idSrv) {
        throw { status: 400, message: 'ID de servicio requerido' };
      }
      return await pagoServiciosRepository.getSubtiposByServicio(idSrv);
    } catch (error) {
      throw { 
        status: error.status || 500, 
        message: error.message || 'Error al obtener subtipos'
      };
    }
  }

  /**
   * Obtener datos requeridos para un servicio
   */
  async getDatosRequeridosByServicio(idSrv) {
    try {
      if (!idSrv) {
        throw { status: 400, message: 'ID de servicio requerido' };
      }
      return await pagoServiciosRepository.getDatosRequeridosByServicio(idSrv);
    } catch (error) {
      throw { 
        status: error.status || 500, 
        message: error.message || 'Error al obtener datos requeridos'
      };
    }
  }

  /**
   * Obtener datos requeridos para un subtipo
   */
  async getDatosRequeridosBySubtipo(idSubtipo) {
    try {
      if (!idSubtipo) {
        throw { status: 400, message: 'ID de subtipo requerido' };
      }
      return await pagoServiciosRepository.getDatosRequeridosBySubtipo(idSubtipo);
    } catch (error) {
      throw { 
        status: error.status || 500, 
        message: error.message || 'Error al obtener datos requeridos'
      };
    }
  }

  // =====================================
  // CUENTAS DE AHORRO DEL USUARIO
  // =====================================

  /**
   * Obtener cuentas de ahorro disponibles del usuario autenticado
   */
  async getCuentasAhorroDisponibles(idPersona) {
    try {
      if (!idPersona) {
        throw { status: 400, message: 'ID de persona requerido' };
      }

      const cuentas = await pagoServiciosRepository.getCuentasAhorroByPersona(idPersona);
      
      return cuentas.map(cuenta => ({
        id_cuenta: cuenta.id_cuenta,
        id_cue_ahorro: cuenta.id_cue_ahorro,
        cue_numero: cuenta.cue_numero,
        cue_saldo_disponible: parseFloat(cuenta.cue_saldo_disponible) || 0,
        cueaho_tasa_interes: parseFloat(cuenta.cueaho_tasa_interes) || 0,
        cueaho_meta_ahorro: parseFloat(cuenta.cueaho_meta_ahorro) || 0
      }));
    } catch (error) {
      throw { 
        status: error.status || 500, 
        message: error.message || 'Error al obtener cuentas de ahorro'
      };
    }
  }

  // =====================================
  // VALIDACIÓN DE DATOS
  // =====================================

  /**
   * Validar datos ingresados contra el tipo de dato
   */
  async validarDatos(body) {
    try {
      const { id_srv, id_subtipo, datos_servicio } = body;

      if (!id_srv && !id_subtipo) {
        throw { status: 400, message: 'ID de servicio o subtipo requerido' };
      }

      if (!datos_servicio || typeof datos_servicio !== 'object') {
        throw { status: 400, message: 'Datos de servicio requeridos' };
      }

      // Obtener datos requeridos
      let datosRequeridos;
      if (id_subtipo) {
        datosRequeridos = await pagoServiciosRepository.getDatosRequeridosBySubtipo(id_subtipo);
      } else {
        datosRequeridos = await pagoServiciosRepository.getDatosRequeridosByServicio(id_srv);
      }

      const errores = [];

      // Validar cada dato requerido
      for (const datoReq of datosRequeridos) {
        const valorIngresado = datos_servicio[datoReq.id_dato_req];

        // Validar obligatoriedad
        if (datoReq.datreq_obligatorio === '00' && !valorIngresado) {
          errores.push({
            campo: datoReq.datreq_etiqueta,
            error: 'Este campo es obligatorio'
          });
          continue;
        }

        if (valorIngresado) {
          // Validar longitud
          if (valorIngresado.toString().length < datoReq.tipodato_longitud_min || 
              valorIngresado.toString().length > datoReq.tipodato_longitud_max) {
            errores.push({
              campo: datoReq.datreq_etiqueta,
              error: `Debe tener entre ${datoReq.tipodato_longitud_min} y ${datoReq.tipodato_longitud_max} caracteres`
            });
          }

          // Validar patrón regex
          if (datoReq.tipodato_patron_regex) {
            try {
              const regex = new RegExp(datoReq.tipodato_patron_regex);
              if (!regex.test(valorIngresado.toString())) {
                errores.push({
                  campo: datoReq.datreq_etiqueta,
                  error: datoReq.tipodato_mensaje_error || 'Formato inválido'
                });
              }
            } catch (regexError) {
              console.error('Error en regex:', regexError);
            }
          }
        }
      }

      return {
        valido: errores.length === 0,
        errores
      };
    } catch (error) {
      throw { 
        status: error.status || 500, 
        message: error.message || 'Error al validar datos'
      };
    }
  }

  // =====================================
  // PROCESAMIENTO DE PAGO
  // =====================================

  /**
   * Procesar pago de servicio
   * 
   * Body:
   * {
   *   id_persona: string,
   *   id_cuenta: string,
   *   id_srv: string,
   *   id_subtipo: string | null,
   *   tra_monto: number,
   *   datos_servicio: { [key: string]: string },
   *   tra_descripcion: string
   * }
   */
  async procesarPago(body) {
    try {
      const { 
        id_persona,
        id_cuenta, 
        id_srv, 
        id_subtipo, 
        tra_monto, 
        datos_servicio, 
        tra_descripcion 
      } = body;

      // 1. Validaciones iniciales
      if (!id_persona || !id_cuenta || !id_srv || !tra_monto) {
        throw { 
          status: 400, 
          message: 'ID de persona, cuenta, servicio y monto son requeridos'
        };
      }

      if (tra_monto <= 0) {
        throw { 
          status: 400, 
          message: 'El monto debe ser mayor a 0'
        };
      }

      // 2. Validar datos del servicio
      const validacion = await this.validarDatos(body);
      if (!validacion.valido) {
        throw { 
          status: 400, 
          message: 'Datos inválidos', 
          errores: validacion.errores 
        };
      }

      // 3. Verificar que la cuenta existe, tiene saldo y pertenece a la persona
      const cuenta = await pagoServiciosRepository.getCuentaBySaldo(id_cuenta);
      if (!cuenta) {
        throw { status: 404, message: 'Cuenta no encontrada o inactiva' };
      }

      // Validar que la cuenta pertenece al usuario autenticado
      if (cuenta.id_persona !== id_persona) {
        throw { 
          status: 403, 
          message: 'No tiene permisos para usar esta cuenta' 
        };
      }

      // Validar que es una cuenta de ahorro
      const esCuentaAhorro = await pagoServiciosRepository.isCuentaAhorro(id_cuenta);
      if (!esCuentaAhorro) {
        throw { 
          status: 400, 
          message: 'Solo se pueden realizar pagos de servicios desde cuentas de ahorro' 
        };
      }

      const saldoDisponible = parseFloat(cuenta.cue_saldo_disponible) || 0;
      
      // 4. Validar saldo suficiente
      if (saldoDisponible < tra_monto) {
        throw { 
          status: 400, 
          message: 'Saldo insuficiente',
          saldoDisponible,
          montoRequerido: tra_monto,
          faltante: tra_monto - saldoDisponible
        };
      }

      // 5. Verificar servicio existe
      const servicio = await pagoServiciosRepository.getServicioById(id_srv);
      if (!servicio) {
        throw { status: 404, message: 'Servicio no encontrado' };
      }

      // 6. Si hay subtipo, verificar que existe
      if (id_subtipo) {
        const subtipo = await pagoServiciosRepository.getSubtipoById(id_subtipo);
        if (!subtipo) {
          throw { status: 404, message: 'Subtipo no encontrado' };
        }
        if (subtipo.id_srv !== id_srv) {
          throw { status: 400, message: 'Subtipo no pertenece al servicio' };
        }
      }

      // 7. Generar IDs cortos (≤20) compatibles con columnas varchar(20)
      const genId20 = () => (Date.now().toString(36) + uuidv4().replace(/-/g, '')).slice(0, 20).toUpperCase();
      const id_tra = genId20();
      const id_pagser = genId20();

      // 8. Crear transacción (descripción truncada a 20 caracteres)
      const descBase = tra_descripcion || `Pago de ${servicio.srv_nombre}`;
      const descCorta = descBase.length > 20 ? descBase.slice(0, 20) : descBase;
      const transaccion = await pagoServiciosRepository.createTransaccion({
        id_tra,
        id_cuenta,
        tra_monto,
        tra_tipo: '03', // Tipo 03 = Pago de servicio
        tra_descripcion: descCorta,
        tra_estado: '01' // Estado 01 = Completada
      });

      // 9. Generar comprobante y referencia (respetando posibles límites de longitud)
      // Comprobante máximo 20 caracteres
      const compBase = `${Date.now().toString(36).toUpperCase()}${uuidv4().replace(/-/g, '').slice(0, 6).toUpperCase()}`;
      const comprobante = `CP-${compBase}`.slice(0, 20);
      // Referencia compacta: base64 del JSON, truncada si el esquema impone límite corto (p.ej. 20)
      let referencia;
      try {
        const json = JSON.stringify(datos_servicio || {});
        const b64 = Buffer.from(json).toString('base64');
        referencia = b64.length > 20 ? b64.slice(0, 20) : b64;
      } catch (_) {
        referencia = 'REF';
      }

      // 10. Crear pago de servicio (límite de 20 para strings en columnas varchas cortas)
      const pagoServicio = await pagoServiciosRepository.createPagoServicio({
        id_tra,
        id_pagser,
        id_srv,
        pagser_estado: '01', // Completado
        pagser_comprobante: (comprobante || '').slice(0, 20),
        pagser_referencia: (referencia || '').slice(0, 20),
        id_subtipo: id_subtipo || null
      });

      // 11. Actualizar saldo de la cuenta
      const saldoActualizado = await pagoServiciosRepository.updateSaldoCuenta(id_cuenta, tra_monto);

      return {
        id_tra,
        id_pagser,
        comprobante,
        servicio: servicio.srv_nombre,
        saldo_anterior: saldoDisponible,
        saldo_actual: parseFloat(saldoActualizado.cue_saldo_disponible) || 0,
        monto_pagado: tra_monto,
        fecha_transaccion: transaccion.tra_fecha_hora,
        estado: 'COMPLETADO'
      };

    } catch (error) {
      console.error('❌ Error al procesar pago:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      throw { 
        status: error.status || 500, 
        message: error.message || 'Error al procesar pago',
        errores: error.errores,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      };
    }
  }

  // =====================================
  // CONSULTAS DE HISTORIAL
  // =====================================

  /**
   * Obtener historial de pagos de una persona
   */
  async getHistorialPagosByPersona(idPersona, limit = 20, offset = 0) {
    try {
      if (!idPersona) {
        throw { status: 400, message: 'ID de persona requerido' };
      }

      const pagos = await pagoServiciosRepository.getHistorialPagosByPersona(
        idPersona,
        limit,
        offset
      );

      const total = await pagoServiciosRepository.getTotalHistorialPagosByPersona(idPersona);

      return {
        pagos: pagos.map(p => this._formatPago(p)),
        total,
        limit,
        offset,
        paginas: Math.ceil(total / limit)
      };
    } catch (error) {
      throw { 
        status: error.status || 500, 
        message: error.message || 'Error al obtener historial'
      };
    }
  }

  /**
   * Obtener comprobante de un pago específico
   */
  async getComprobante(idPagser) {
    try {
      if (!idPagser) {
        throw { status: 400, message: 'ID de pago requerido' };
      }

      const comprobante = await pagoServiciosRepository.getComprobante(idPagser);
      
      if (!comprobante) {
        throw { status: 404, message: 'Comprobante no encontrado' };
      }

      // Parsear datos del servicio (referencia)
      let datos_servicio = {};
      try {
        datos_servicio = JSON.parse(comprobante.pagser_referencia || '{}');
      } catch (e) {
        console.error('Error al parsear referencia:', e);
      }

      const estadosMap = {
        '00': 'PENDIENTE',
        '01': 'COMPLETADO',
        '02': 'RECHAZADO',
        '03': 'CANCELADO'
      };
      
      return {
        // IDs crudos necesarios para navegación desde frontend
        id_srv: comprobante.id_srv,
        id_subtipo: comprobante.id_subtipo || null,
        id_pagser: comprobante.id_pagser,
        id_tra: comprobante.id_tra,
        fecha_transaccion: comprobante.tra_fecha_hora,
        monto: parseFloat(comprobante.tra_monto),
        descripcion: comprobante.tra_descripcion,
        comprobante: comprobante.pagser_comprobante,
        estado: estadosMap[comprobante.pagser_estado] || 'DESCONOCIDO',
        servicio: comprobante.srv_nombre,
        subtipo: comprobante.subtipo_nombre || null,
        datos_servicio,
        cuenta: comprobante.cue_numero,
        email: comprobante.per_email
      };
    } catch (error) {
      throw { 
        status: error.status || 500, 
        message: error.message || 'Error al obtener comprobante'
      };
    }
  }

  /**
   * Obtener top N pagos frecuentes por persona
   */
  async getPagosFrecuentesByPersona(idPersona, limit = 6) {
    try {
      if (!idPersona) {
        throw { status: 400, message: 'ID de persona requerido' };
      }

      const pagos = await pagoServiciosRepository.getPagosServiciosByPersona(idPersona);

      const map = new Map();
      pagos.forEach(p => {
        const key = `${p.id_srv}|${p.id_subtipo || ''}`;
        const count = map.get(key)?.count || 0;
        const last = map.get(key)?.ultimo_pago || null;
        const fecha = p.transaccion?.tra_fecha_hora || p.tra_fecha_hora;
        map.set(key, {
          id_srv: p.id_srv,
          id_subtipo: p.id_subtipo || null,
          srv_nombre: p.servicio?.srv_nombre,
          srv_tiene_subtipos: p.servicio?.srv_tiene_subtipos === '01' || p.servicio?.srv_tiene_subtipos === true,
          categoria: p.servicio?.categoria_servicio?.cat_nombre || null,
          subcategoria: p.servicio?.subcategoria_servicio?.subcat_nombre || null,
          count: count + 1,
          ultimo_pago: (!last || (fecha && new Date(fecha) > new Date(last))) ? fecha : last
        });
      });

      const lista = Array.from(map.values()).sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return new Date(b.ultimo_pago) - new Date(a.ultimo_pago);
      }).slice(0, limit);

      return lista;
    } catch (error) {
      throw { 
        status: error.status || 500, 
        message: error.message || 'Error al obtener pagos frecuentes'
      };
    }
  }

  // =====================================
  // MÉTODOS PRIVADOS DE FORMATO
  // =====================================

  _formatPago(pago) {
    const estadosMap = {
      '00': 'PENDIENTE',
      '01': 'COMPLETADO',
      '02': 'RECHAZADO',
      '03': 'CANCELADO'
    };
    
    return {
      id_srv: pago.id_srv,
      id_subtipo: pago.id_subtipo || null,
      id_pagser: pago.id_pagser,
      id_tra: pago.id_tra,
      fecha: pago.tra_fecha_hora,
      monto: parseFloat(pago.tra_monto),
      descripcion: pago.tra_descripcion,
      comprobante: pago.pagser_comprobante,
      estado: estadosMap[pago.pagser_estado] || 'DESCONOCIDO',
      servicio: pago.srv_nombre,
      subtipo: pago.subtipo_nombre || null,
      cuenta: pago.cue_numero
    };
  }
}

module.exports = new PagoServiciosService();