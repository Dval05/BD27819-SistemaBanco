const transferenciaRepository = require('../repositories/transferencia.repository');
const contactoService = require('./contacto.service');
const limiteService = require('./limite-transaccional.service');
const bancoService = require('./banco.service');
const { v4: uuidv4 } = require('uuid');

/**
 * Transferencia Service
 * Lógica principal de negocio para transferencias bancarias
 * Centraliza validaciones, manejo de errores y flujo de transacciones
 */
class TransferenciaService {
  /**
   * Obtiene el historial de transferencias de una cuenta
   * @param {string} idCuenta - ID de la cuenta
   * @param {number} pagina - Número de página (por defecto 1)
   * @param {number} porPagina - Registros por página (por defecto 20)
   * @returns {Promise<Object>} Respuesta con historial de transferencias
   */
  async obtenerHistorialTransferencias(idCuenta, pagina = 1, porPagina = 20) {
    try {
      if (!idCuenta || typeof idCuenta !== 'string') {
        return {
          exito: false,
          mensaje: 'ID de cuenta inválido',
          datos: { transferencias: [], total: 0, pagina, porPagina }
        };
      }

      const offset = (pagina - 1) * porPagina;
      const transferencias = await transferenciaRepository.obtenerTransferenciasPorCuenta(
        idCuenta,
        porPagina,
        offset
      );

      return {
        exito: true,
        mensaje: 'Historial obtenido exitosamente',
        datos: {
          transferencias: transferencias.map(t => this._formatarTransferencia(t)),
          total: transferencias.length,
          pagina,
          porPagina
        }
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al obtener historial: ${error.message}`,
        datos: { transferencias: [], total: 0, pagina, porPagina }
      };
    }
  }

  /**
   * Obtiene transferencias internas (entre cuentas Pichincha)
   * @param {string} idCuenta - ID de la cuenta
   * @param {number} limite - Límite de registros
   * @returns {Promise<Object>} Respuesta con transferencias internas
   */
  async obtenerTransferenciasInternas(idCuenta, limite = 20) {
    try {
      const transferencias = await transferenciaRepository.obtenerTransferenciasInternas(
        idCuenta,
        limite
      );

      return {
        exito: true,
        mensaje: 'Transferencias internas obtenidas',
        datos: transferencias.map(t => this._formatarTransferencia(t))
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al obtener transferencias internas: ${error.message}`,
        datos: []
      };
    }
  }

  /**
   * Obtiene transferencias interbancarias
   * @param {string} idCuenta - ID de la cuenta
   * @param {number} limite - Límite de registros
   * @returns {Promise<Object>} Respuesta con transferencias interbancarias
   */
  async obtenerTransferenciasInterbancarias(idCuenta, limite = 20) {
    try {
      const transferencias = await transferenciaRepository.obtenerTransferenciasInterbancarias(
        idCuenta,
        limite
      );

      return {
        exito: true,
        mensaje: 'Transferencias interbancarias obtenidas',
        datos: transferencias.map(t => this._formatarTransferencia(t))
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al obtener transferencias interbancarias: ${error.message}`,
        datos: []
      };
    }
  }

  /**
   * FLUJO PRINCIPAL: Crea y procesa una transferencia
   * Implementa el flujo completo de validaciones y registros
   * 
   * @param {Object} datosTransferencia - Datos de la transferencia
   * @param {string} datosTransferencia.idCuenta - Cuenta origen
   * @param {string} datosTransferencia.idPersona - Persona propietaria
   * @param {number} datosTransferencia.monto - Monto a transferir
   * @param {string} datosTransferencia.descripcion - Motivo de transferencia
   * @param {string} datosTransferencia.tipoTransferencia - '00'=Interna, '01'=Interbancaria
   * @param {Object} datosTransferencia.cuentaDestino - Datos de cuenta destino
   * @param {Object} datosTransferencia.guardarContacto - { guardar: boolean, alias?: string }
   * @param {Object} datosTransferencia.saldoDisponible - Saldo actual de la cuenta origen
   * @returns {Promise<Object>} Resultado del proceso de transferencia
   */
  async crearTransferencia(datosTransferencia) {
    try {
      // ===== VALIDACIÓN 1: Datos básicos =====
      const validacionBasica = this._validarDatosBasicos(datosTransferencia);
      if (!validacionBasica.valido) {
        return {
          exito: false,
          codigo: 'VALIDACION_BASICA_FALLIDA',
          mensaje: validacionBasica.mensaje,
          datos: null
        };
      }

      const {
        idCuenta,
        idPersona,
        monto,
        descripcion,
        tipoTransferencia,
        cuentaDestino,
        guardarContacto,
        saldoDisponible,
        saldoDisponibleAnterior
      } = datosTransferencia;

      // ===== VALIDACIÓN 2: Monto =====
      const validacionMonto = this._validarMonto(monto, saldoDisponible);
      if (!validacionMonto.valido) {
        return {
          exito: false,
          codigo: 'VALIDACION_MONTO_FALLIDA',
          mensaje: validacionMonto.mensaje,
          datos: null
        };
      }

      // ===== VALIDACIÓN 3: Límites transaccionales =====
      const validacionLimites = await limiteService.validarLimiteTransaccion(
        idCuenta,
        '00', // Tipo de transacción: Transferencia
        monto
      );
      if (!validacionLimites.valido) {
        return {
          exito: false,
          codigo: 'LIMITE_EXCEDIDO',
          mensaje: validacionLimites.mensaje,
          detalles: validacionLimites.detalles,
          datos: null
        };
      }

      // ===== VALIDACIÓN 4: Prevención de duplicados =====
      const esDuplicado = await transferenciaRepository.existeTransferenciaDuplicada(
        idCuenta,
        monto,
        cuentaDestino.numeroCuenta,
        new Date()
      );
      if (esDuplicado) {
        return {
          exito: false,
          codigo: 'POSIBLE_DUPLICADO',
          mensaje: 'Se detectó una transferencia idéntica hace poco. Por favor, intente más tarde.',
          datos: null
        };
      }

      // ===== VALIDACIÓN 5: Validar banco destino (si es interbancaria) =====
      let validacionBanco = null;
      if (tipoTransferencia === '01' && cuentaDestino.idBanco) {
        validacionBanco = await bancoService.validarBancoExistente(cuentaDestino.idBanco);
        if (!validacionBanco.valido) {
          return {
            exito: false,
            codigo: 'BANCO_INVALIDO',
            mensaje: validacionBanco.mensaje,
            datos: null
          };
        }
      }

      // ===== GENERACIÓN DE IDs =====
      const idTra = uuidv4();
      const idTrf = uuidv4();
      const traFechaHora = new Date();

      // ===== GUARDAR CONTACTO SI SE SOLICITA =====
      let idContactoGuardado = cuentaDestino.idContacto || null;
      if (guardarContacto && guardarContacto.guardar) {
        const datosNuevoContacto = {
          conNombreBeneficiario: guardarContacto.nombreBeneficiario || cuentaDestino.nombreBeneficiario,
          conAlias: guardarContacto.alias,
          conTipoIdentificacion: cuentaDestino.tipoIdentificacion,
          conIdentificacion: cuentaDestino.identificacion,
          conNumeroCuenta: cuentaDestino.numeroCuenta,
          conEmail: cuentaDestino.email,
          conTipoCuenta: cuentaDestino.tipoCuenta,
          idBanco: cuentaDestino.idBanco || null
        };

        const resultadoContacto = await contactoService.crearContacto(
          uuidv4(),
          idPersona,
          datosNuevoContacto
        );

        if (resultadoContacto.exito) {
          idContactoGuardado = resultadoContacto.datos.id;
        }
      }

      // ===== CÁLCULO DE COMISIONES =====
      let comision = 0;
      if (tipoTransferencia === '01') {
        // Interbancaria: aplicar comisión (ejemplo: 1% del monto)
        comision = this._calcularComision(monto);
      }

      // ===== CREAR TRANSFERENCIA EN BASE DE DATOS =====
      const datosNuevaTransferencia = {
        idTra,
        idTrf,
        idCuenta,
        idInvmov: null,
        traFechaHora,
        traMonto: -monto, // Negativo porque es debito
        traTipo: tipoTransferencia === '00' ? '00' : '01', // Código de tipo
        traDescripcion: descripcion,
        traEstado: '00', // Pendiente
        idBancoDestino: cuentaDestino.idBanco || null,
        idContacto: idContactoGuardado,
        trfNumeroCuentaDestino: cuentaDestino.numeroCuenta,
        trfEmailDestino: cuentaDestino.email,
        trfTipoIdentificacionDestino: cuentaDestino.tipoIdentificacion,
        trfIdentificacionDestino: cuentaDestino.identificacion,
        trfTipoCuentaDestino: cuentaDestino.tipoCuenta,
        trfTipoTransferencia: tipoTransferencia,
        trfComision: comision,
        idTraDestino: null // Se establecería con la transacción de crédito en destino
      };

      const transferenciaCreada = await transferenciaRepository.crearTransferencia(
        datosNuevaTransferencia
      );

      if (!transferenciaCreada) {
        return {
          exito: false,
          codigo: 'ERROR_CREACION',
          mensaje: 'Error al crear la transferencia en base de datos',
          datos: null
        };
      }

      // ===== RESPUESTA EXITOSA =====
      return {
        exito: true,
        codigo: 'TRANSFERENCIA_CREADA',
        mensaje: 'Transferencia creada exitosamente',
        datos: {
          idTransferencia: idTrf,
          idTransaccion: idTra,
          transferencia: this._formatarTransferencia(transferenciaCreada),
          resumen: {
            montoTransferencia: monto,
            comisiones: comision,
            montoTotal: monto + comision,
            saldoAnterior: saldoDisponibleAnterior,
            saldoNuevo: saldoDisponible - monto - comision,
            timestamp: traFechaHora,
            tipoTransferencia: tipoTransferencia === '00' ? 'Interna' : 'Interbancaria',
            contactoGuardado: guardarContacto?.guardar || false
          }
        }
      };
    } catch (error) {
      console.error('Error en crearTransferencia:', error);
      return {
        exito: false,
        codigo: 'ERROR_INTERNO',
        mensaje: `Error al procesar transferencia: ${error.message}`,
        datos: null
      };
    }
  }

  /**
   * Obtiene el estado de una transferencia
   * @param {string} idTra - ID de la transacción
   * @param {string} idTrf - ID de la transferencia
   * @returns {Promise<Object>} Respuesta con estado
   */
  async obtenerEstadoTransferencia(idTra, idTrf) {
    try {
      if (!idTra || !idTrf) {
        return {
          exito: false,
          mensaje: 'IDs de transferencia inválidos',
          datos: null
        };
      }

      const transferencia = await transferenciaRepository.obtenerTransferenciaPorId(idTra, idTrf);

      if (!transferencia) {
        return {
          exito: false,
          mensaje: 'Transferencia no encontrada',
          datos: null
        };
      }

      return {
        exito: true,
        mensaje: 'Estado obtenido exitosamente',
        datos: {
          id: transferencia.id_trf,
          estado: this._obtenerEstadoDescriptivo(transferencia.tra_estado),
          monto: Math.abs(parseFloat(transferencia.tra_monto)),
          comision: parseFloat(transferencia.trf_comision),
          fechaCreacion: transferencia.tra_fecha_hora,
          fechaProcesamiento: transferencia.trf_fecha_procesamiento,
          destinatario: transferencia.con_nombre_beneficiario || transferencia.trf_email_destino
        }
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al obtener estado: ${error.message}`,
        datos: null
      };
    }
  }

  /**
   * Cancela una transferencia (aplica solo a pendientes)
   * @param {string} idTra - ID de la transacción
   * @param {string} idTrf - ID de la transferencia
   * @returns {Promise<Object>} Resultado de cancelación
   */
  async cancelarTransferencia(idTra, idTrf) {
    try {
      if (!idTra || !idTrf) {
        return {
          exito: false,
          mensaje: 'IDs de transferencia inválidos'
        };
      }

      const transferencia = await transferenciaRepository.obtenerTransferenciaPorId(idTra, idTrf);

      if (!transferencia) {
        return {
          exito: false,
          mensaje: 'Transferencia no encontrada'
        };
      }

      if (transferencia.tra_estado !== '00') {
        return {
          exito: false,
          mensaje: `No se puede cancelar una transferencia con estado: ${this._obtenerEstadoDescriptivo(transferencia.tra_estado)}`
        };
      }

      // Cambiar estado a "Reversada"
      await transferenciaRepository.actualizarEstadoTransferencia(idTra, idTrf, '03');

      return {
        exito: true,
        mensaje: 'Transferencia cancelada exitosamente'
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al cancelar transferencia: ${error.message}`
      };
    }
  }

  /**
   * Valida datos básicos de la transferencia
   * @param {Object} datos - Datos a validar
   * @returns {Object} Resultado de validación
   * @private
   */
  _validarDatosBasicos(datos) {
    if (!datos.idCuenta || typeof datos.idCuenta !== 'string') {
      return { valido: false, mensaje: 'ID de cuenta origen inválido' };
    }

    if (!datos.idPersona || typeof datos.idPersona !== 'string') {
      return { valido: false, mensaje: 'ID de persona inválido' };
    }

    if (!datos.cuentaDestino) {
      return { valido: false, mensaje: 'Datos de cuenta destino requeridos' };
    }

    if (!datos.cuentaDestino.numeroCuenta || typeof datos.cuentaDestino.numeroCuenta !== 'string') {
      return { valido: false, mensaje: 'Número de cuenta destino inválido' };
    }

    if (!datos.cuentaDestino.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.cuentaDestino.email)) {
      return { valido: false, mensaje: 'Email destino inválido' };
    }

    if (!datos.descripcion || typeof datos.descripcion !== 'string' || datos.descripcion.trim().length === 0) {
      return { valido: false, mensaje: 'Descripción/motivo de transferencia requerido' };
    }

    if (!datos.tipoTransferencia || !['00', '01'].includes(datos.tipoTransferencia)) {
      return { valido: false, mensaje: 'Tipo de transferencia inválido' };
    }

    if (typeof datos.saldoDisponible !== 'number' || datos.saldoDisponible < 0) {
      return { valido: false, mensaje: 'Saldo disponible debe ser un número válido' };
    }

    return { valido: true };
  }

  /**
   * Valida el monto de la transferencia
   * @param {number} monto - Monto a validar
   * @param {number} saldoDisponible - Saldo disponible
   * @returns {Object} Resultado de validación
   * @private
   */
  _validarMonto(monto, saldoDisponible) {
    if (typeof monto !== 'number' || monto <= 0) {
      return { valido: false, mensaje: 'El monto debe ser mayor a 0' };
    }

    if (monto > saldoDisponible) {
      return {
        valido: false,
        mensaje: `Saldo insuficiente. Disponible: $${saldoDisponible.toFixed(2)}, Solicitado: $${monto.toFixed(2)}`
      };
    }

    // Límite máximo de transferencia en banca web (15,000)
    const LIMITE_MAXIMO_WEB = 15000;
    if (monto > LIMITE_MAXIMO_WEB) {
      return {
        valido: false,
        mensaje: `El monto excede el límite máximo para banca web: $${LIMITE_MAXIMO_WEB}`
      };
    }

    return { valido: true };
  }

  /**
   * Calcula comisión para transferencias interbancarias
   * @param {number} monto - Monto de la transferencia
   * @returns {number} Comisión calculada
   * @private
   */
  _calcularComision(monto) {
    // Ejemplo: 1% de comisión para transferencias interbancarias
    const PORCENTAJE_COMISION = 0.01;
    return parseFloat((monto * PORCENTAJE_COMISION).toFixed(2));
  }

  /**
   * Obtiene descripción de estado
   * @param {string} codigoEstado - Código de estado
   * @returns {string} Descripción del estado
   * @private
   */
  _obtenerEstadoDescriptivo(codigoEstado) {
    const estados = {
      '00': 'Pendiente',
      '01': 'Completada',
      '02': 'Fallida',
      '03': 'Reversada'
    };
    return estados[codigoEstado] || 'Desconocido';
  }

  /**
   * Formatea una transferencia para respuesta
   * @param {Object} transferencia - Datos de transferencia
   * @returns {Object} Transferencia formateada
   * @private
   */
  _formatarTransferencia(transferencia) {
    return {
      id: transferencia.id_trf,
      monto: Math.abs(parseFloat(transferencia.tra_monto)),
      descripcion: transferencia.tra_descripcion,
      estado: this._obtenerEstadoDescriptivo(transferencia.tra_estado),
      tipo: transferencia.trf_tipo_transferencia === '00' ? 'Interna' : 'Interbancaria',
      banco: transferencia.ban_nombre,
      codigoBanco: transferencia.ban_codigo,
      contactoAlias: transferencia.con_alias,
      nombreBeneficiario: transferencia.con_nombre_beneficiario,
      numeroCuenta: transferencia.trf_numero_cuenta_destino,
      email: transferencia.trf_email_destino,
      comision: parseFloat(transferencia.trf_comision),
      fecha: transferencia.tra_fecha_hora,
      fechaProcesamiento: transferencia.trf_fecha_procesamiento
    };
  }

  /**
   * Valida si una cuenta existe en Banco Pichincha
   * @param {string} numeroCuenta - Número de cuenta (10 dígitos)
   * @returns {Promise<Object>} Resultado de validación
   */
  async validarCuentaPichincha(numeroCuenta) {
    try {
      // Buscar cuenta en la base de datos
      const cuenta = await transferenciaRepository.buscarCuentaPorNumero(numeroCuenta);

      if (cuenta) {
        return {
          existe: true,
          nombreTitular: cuenta.nombre_titular || cuenta.per_nombre || 'Titular Banco Pichincha',
          tipoCuenta: cuenta.cta_tipo === '00' ? 'Ahorros' : 'Corriente'
        };
      }

      // Si no se encuentra, retornar como no existente
      return {
        existe: false,
        mensaje: 'La cuenta no existe o no pertenece a Banco Pichincha'
      };
    } catch (error) {
      console.error('Error validando cuenta Pichincha:', error);
      // En caso de error, simular para desarrollo
      return {
        existe: true,
        nombreTitular: 'Titular Demo',
        tipoCuenta: 'Ahorros',
        mensaje: 'Validación simulada (desarrollo)'
      };
    }
  }
}

module.exports = new TransferenciaService();
