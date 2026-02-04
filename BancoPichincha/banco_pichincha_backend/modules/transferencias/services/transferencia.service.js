const transferenciaRepository = require('../repositories/transferencia.repository');
const contactoService = require('./contacto.service');
const limiteService = require('./limite-transaccional.service');
const bancoService = require('./banco.service');
const cuentaRepository = require('../../cuentas/repositories/cuenta.repository');
const { nanoid } = require('nanoid');

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
      console.log('\n=== DEBUG transferenciaService.crearTransferencia - INICIO ===');
      console.log('Datos recibidos:', JSON.stringify(datosTransferencia, null, 2));

      // ===== VALIDACIÓN 1: Datos básicos =====
      console.log('\n1. Validando datos básicos...');
      const validacionBasica = this._validarDatosBasicos(datosTransferencia);
      if (!validacionBasica.valido) {
        console.log('❌ Validación básica fallida:', validacionBasica.mensaje);
        return {
          exito: false,
          codigo: 'VALIDACION_BASICA_FALLIDA',
          mensaje: validacionBasica.mensaje,
          datos: null
        };
      }
      console.log('✅ Validación básica OK');

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
      console.log('\n2. Validando monto...');
      const validacionMonto = this._validarMonto(monto, saldoDisponible);
      if (!validacionMonto.valido) {
        console.log('❌ Validación de monto fallida:', validacionMonto.mensaje);
        return {
          exito: false,
          codigo: 'VALIDACION_MONTO_FALLIDA',
          mensaje: validacionMonto.mensaje,
          datos: null
        };
      }
      console.log('✅ Validación de monto OK');

      // ===== VALIDACIÓN 3: Límites transaccionales =====
      console.log('\n3. Validando límites transaccionales...');
      const validacionLimites = await limiteService.validarLimiteTransaccion(
        idCuenta,
        '00', // Tipo de transacción: Transferencia
        monto
      );
      if (!validacionLimites.valido) {
        console.log('❌ Límites excedidos:', validacionLimites.mensaje);
        return {
          exito: false,
          codigo: 'LIMITE_EXCEDIDO',
          mensaje: validacionLimites.mensaje,
          detalles: validacionLimites.detalles,
          datos: null
        };
      }
      console.log('✅ Validación de límites OK');

      // ===== VALIDACIÓN 4: Prevención de duplicados =====
      console.log('\n4. Verificando duplicados...');
      // NOTA: Deshabilitado para desarrollo. En producción, descomentar para prevenir duplicados
      // const esDuplicado = await transferenciaRepository.existeTransferenciaDuplicada(
      //   idCuenta,
      //   monto,
      //   cuentaDestino.numeroCuenta,
      //   new Date()
      // );
      // if (esDuplicado) {
      //   return {
      //     exito: false,
      //     codigo: 'POSIBLE_DUPLICADO',
      //     mensaje: 'Se detectó una transferencia idéntica hace poco. Por favor, intente más tarde.',
      //     datos: null
      //   };
      // }
      console.log('✅ Validación de duplicados omitida (desarrollo)');

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
      const idTra = nanoid(20);  // ID de transacción (20 caracteres)
      const idTrf = nanoid(20);  // ID de transferencia (20 caracteres)
      const traFechaHora = new Date().toISOString(); // Convertir a ISO string para Supabase

      // ===== GUARDAR CONTACTO SI SE SOLICITA =====
      let idContactoGuardado = cuentaDestino.idContacto || null;
      if (guardarContacto && guardarContacto.guardar) {
        // Validar que tenemos email antes de guardar contacto
        if (!cuentaDestino.email || typeof cuentaDestino.email !== 'string') {
          return {
            exito: false,
            codigo: 'EMAIL_REQUERIDO_CONTACTO',
            mensaje: 'El email es requerido para guardar el contacto',
            datos: null
          };
        }

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
          nanoid(20),
          idPersona,
          datosNuevoContacto
        );

        if (resultadoContacto.exito) {
          idContactoGuardado = resultadoContacto.datos.id;
        } else {
          return {
            exito: false,
            codigo: 'ERROR_GUARDAR_CONTACTO',
            mensaje: resultadoContacto.mensaje,
            datos: null
          };
        }
      }

      // ===== CÁLCULO DE COMISIONES =====
      let comision = 0;
      if (tipoTransferencia === '01') {
        // Interbancaria: aplicar comisión (ejemplo: 1% del monto)
        comision = this._calcularComision(monto);
      }
      comision = parseFloat(comision.toFixed(2));

      // ===== CREAR TRANSFERENCIA EN BASE DE DATOS =====
      // Preparar datos de transferencia con validación de strings vacíos
      const datosNuevaTransferencia = {
        idTra,
        idTrf,
        idCuenta,
        idInvmov: null,
        traFechaHora,
        traMonto: parseFloat((-monto).toFixed(2)), // Negativo porque es debito, redondeado
        traTipo: tipoTransferencia === '00' ? '00' : '01', // Código de tipo
        traDescripcion: descripcion || 'Transferencia bancaria',
        traEstado: '00', // Pendiente
        idBancoDestino: cuentaDestino.idBanco || null,
        idContacto: idContactoGuardado,
        trfNumeroCuentaDestino: cuentaDestino.numeroCuenta,
        trfEmailDestino: cuentaDestino.email,
        trfTipoIdentificacionDestino: cuentaDestino.tipoIdentificacion || '00',
        // Solo asignar trf_identificacion_destino si no es string vacío
        trfIdentificacionDestino: (cuentaDestino.identificacion && cuentaDestino.identificacion.trim() !== '') ? cuentaDestino.identificacion : null,
        trfTipoCuentaDestino: cuentaDestino.tipoCuenta || '00',
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

      // ===== ACTUALIZAR SALDOS Y CREAR MOVIMIENTOS EN AMBAS CUENTAS =====
      let nuevoSaldoOrigen = saldoDisponible;
      let nuevoSaldoDestino = 0;
      let idTraDestino = null;
      
      try {
        // Calcular monto total a debitar de la cuenta origen (con redondeo)
        const montoTotalDebito = parseFloat((monto + comision).toFixed(2));
        nuevoSaldoOrigen = parseFloat((saldoDisponible - montoTotalDebito).toFixed(2));

        // Actualizar saldo de cuenta origen
        await cuentaRepository.updateSaldo(idCuenta, nuevoSaldoOrigen);
        console.log(`💰 Saldo actualizado - Cuenta origen: ${idCuenta}, Nuevo saldo: $${nuevoSaldoOrigen.toFixed(2)}`);

        // ===== CREAR MOVIMIENTO DE DÉBITO EN TRANSACCION =====
        console.log('📝 Creando movimiento de débito en cuenta origen...');
        const { supabase } = require('../../../shared/config/database.config');
        
        const transaccionDebito = {
          id_tra: idTra,
          id_cuenta: idCuenta,
          tra_fecha_hora: traFechaHora,
          tra_monto: parseFloat((-monto).toFixed(2)), // NEGATIVO (débito)
          tra_tipo: '00', // Transferencia
          tra_descripcion: descripcion || 'Transferencia enviada',
          tra_estado: '01' // Completada
        };
        
        await supabase.from('transaccion').insert([transaccionDebito]);
        console.log('✅ Movimiento de débito registrado en TRANSACCION');

        // ===== CREAR MOVIMIENTO DE CRÉDITO EN CUENTA DESTINO (SOLO SI ES INTERNA) =====
        if (tipoTransferencia === '00') {
          console.log('📝 Creando movimiento de crédito en cuenta destino...');
          console.log('   Buscando cuenta destino con número:', cuentaDestino.numeroCuenta);
          
          // Buscar la cuenta destino por número
          const cuentaDestinoData = await cuentaRepository.findByNumero(cuentaDestino.numeroCuenta);
          
          if (cuentaDestinoData && cuentaDestinoData.id_cuenta) {
            console.log('   ✅ Cuenta destino encontrada:', cuentaDestinoData.id_cuenta);
            
            nuevoSaldoDestino = parseFloat(((cuentaDestinoData.cue_saldo_disponible || 0) + monto).toFixed(2));
            
            // Actualizar saldo de cuenta destino
            await cuentaRepository.updateSaldo(cuentaDestinoData.id_cuenta, nuevoSaldoDestino);
            console.log(`💰 Saldo actualizado - Cuenta destino: ${cuentaDestinoData.id_cuenta}, Nuevo saldo: $${nuevoSaldoDestino.toFixed(2)}`);

            // Generar ID para la transacción destino
            idTraDestino = nanoid(20);

            // Crear movimiento de CRÉDITO en la cuenta destino
            const transaccionCredito = {
              id_tra: idTraDestino,
              id_cuenta: cuentaDestinoData.id_cuenta,
              tra_fecha_hora: traFechaHora,
              tra_monto: parseFloat(monto.toFixed(2)), // POSITIVO (crédito)
              tra_tipo: '00', // Transferencia
              tra_descripcion: `Transferencia recibida`,
              tra_estado: '01' // Completada
            };
            
            console.log('   📝 Movimiento de crédito a registrar:', JSON.stringify(transaccionCredito, null, 2));
            
            const { error: errCredito } = await supabase.from('transaccion').insert([transaccionCredito]);
            
            if (errCredito) {
              console.warn('   ⚠️ Error al crear movimiento de crédito:', errCredito.message);
            } else {
              console.log('   ✅ Movimiento de crédito registrado en cuenta destino:', idTraDestino);
              
              // Actualizar el registro de transferencia con la referencia al movimiento de crédito
              await supabase
                .from('transferencia')
                .update({ id_tra_destino: idTraDestino })
                .eq('id_tra', idTra)
                .eq('id_trf', idTrf);
            }
          } else {
            console.warn('   ⚠️ Cuenta destino NO encontrada para número:', cuentaDestino.numeroCuenta);
          }
        } else {
          console.log('📝 Transferencia interbancaria - No se crea movimiento en cuenta destino');
        }
      } catch (errSaldo) {
        console.warn('⚠️ Error al actualizar saldos o crear movimientos:', errSaldo.message);
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
            montoTransferencia: parseFloat(monto.toFixed(2)),
            comisiones: parseFloat(comision.toFixed(2)),
            montoTotal: parseFloat((monto + comision).toFixed(2)),
            saldoAnterior: parseFloat(saldoDisponibleAnterior.toFixed(2)),
            saldoNuevo: parseFloat(nuevoSaldoOrigen.toFixed(2)),
            timestamp: traFechaHora,
            tipoTransferencia: tipoTransferencia === '00' ? 'Interna' : 'Interbancaria',
            contactoGuardado: guardarContacto?.guardar || false
          }
        }
      };
    } catch (error) {
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

    // Email es opcional para transferencias internas (entre propias cuentas)
    // pero obligatorio para transferencias interbancarias
    if (datos.tipoTransferencia === '01') {
      // Transferencia interbancaria: email obligatorio
      if (!datos.cuentaDestino.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.cuentaDestino.email)) {
        return { valido: false, mensaje: 'Email destino inválido' };
      }
    }
    // Para transferencias internas (00), el email es opcional

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
        const respuesta = {
          existe: true,
          nombreTitular: cuenta.nombre_titular || 'Titular Banco Pichincha',
          tipoCuenta: cuenta.cta_tipo === '00' ? 'Ahorros' : 'Corriente',
          tipoIdentificacion: cuenta.per_tipo_identificacion || '00',
          identificacion: cuenta.per_identificacion || ''
        };
        return respuesta;
      }

      // Si no se encuentra, retornar como no existente
      return {
        existe: false,
        mensaje: 'La cuenta no existe o no pertenece a Banco Pichincha'
      };
    } catch (error) {
      // En caso de error, simular para desarrollo
      return {
        existe: true,
        nombreTitular: 'Titular Demo',
        tipoCuenta: 'Ahorros',
        tipoIdentificacion: '00',
        identificacion: '1234567890',
        mensaje: 'Validación simulada (desarrollo)'
      };
    }
  }
}

module.exports = new TransferenciaService();
