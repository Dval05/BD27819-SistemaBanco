const transferenciaService = require('../services/transferencia.service');
const transferenciaRepository = require('../repositories/transferencia.repository');

/**
 * Transferencia Controller
 * Maneja el flujo completo de transferencias bancarias
 * 
 * FLUJO DE TRANSFERENCIA:
 * 1. Usuario autenticado ingresa al módulo "Transferir dinero"
 * 2. Selecciona cuenta destino (nueva, Pichincha, otro banco, o existente)
 * 3. Ingresa monto (validado contra saldo y límites)
 * 4. Selecciona cuenta origen
 * 5. Ingresa motivo
 * 6. Confirmación
 * 7. Ejecución
 */
class TransferenciaController {
  /**
   * GET /api/transferencias/historial/:idCuenta
   * Obtiene el historial de transferencias de una cuenta
   * 
   * Params: idCuenta
   * Query: pagina=1, porPagina=20
   * 
   * Respuesta: {
   *   exito: boolean,
   *   mensaje: string,
   *   datos: {
   *     transferencias: [...],
   *     total: number,
   *     pagina: number,
   *     porPagina: number
   *   }
   * }
   */
  async obtenerHistorial(req, res) {
    try {
      const { idCuenta } = req.params;
      const { pagina = 1, porPagina = 20 } = req.query;

      if (!idCuenta) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID de cuenta es requerido'
        });
      }

      const resultado = await transferenciaService.obtenerHistorialTransferencias(
        idCuenta,
        parseInt(pagina),
        parseInt(porPagina)
      );

      return res.status(resultado.exito ? 200 : 404).json(resultado);
    } catch (error) {
      console.error('Error en obtenerHistorial:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /api/transferencias/historial/:idCuenta/internas
   * Obtiene solo transferencias INTERNAS (entre cuentas Pichincha)
   * 
   * Params: idCuenta
   * Query: limite=20
   * 
   * Respuesta: {
   *   exito: boolean,
   *   mensaje: string,
   *   datos: [transferencias internas]
   * }
   */
  async obtenerTransferenciasInternas(req, res) {
    try {
      const { idCuenta } = req.params;
      const { limite = 20 } = req.query;

      if (!idCuenta) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID de cuenta es requerido'
        });
      }

      const resultado = await transferenciaService.obtenerTransferenciasInternas(
        idCuenta,
        parseInt(limite)
      );

      return res.status(resultado.exito ? 200 : 404).json(resultado);
    } catch (error) {
      console.error('Error en obtenerTransferenciasInternas:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /api/transferencias/historial/:idCuenta/interbancarias
   * Obtiene solo transferencias INTERBANCARIAS (a otros bancos)
   * 
   * Params: idCuenta
   * Query: limite=20
   * 
   * Respuesta: {
   *   exito: boolean,
   *   mensaje: string,
   *   datos: [transferencias interbancarias]
   * }
   */
  async obtenerTransferenciasInterbancarias(req, res) {
    try {
      const { idCuenta } = req.params;
      const { limite = 20 } = req.query;

      if (!idCuenta) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID de cuenta es requerido'
        });
      }

      const resultado = await transferenciaService.obtenerTransferenciasInterbancarias(
        idCuenta,
        parseInt(limite)
      );

      return res.status(resultado.exito ? 200 : 404).json(resultado);
    } catch (error) {
      console.error('Error en obtenerTransferenciasInterbancarias:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /api/transferencias/estado/:idTra/:idTrf
   * Obtiene el estado actual de una transferencia específica
   * 
   * Params: idTra, idTrf
   * 
   * Respuesta: {
   *   exito: boolean,
   *   mensaje: string,
   *   datos: {
   *     id, estado, monto, comision, 
   *     fechaCreacion, fechaProcesamiento, destinatario
   *   }
   * }
   */
  async obtenerEstadoTransferencia(req, res) {
    try {
      const { idTra, idTrf } = req.params;

      if (!idTra || !idTrf) {
        return res.status(400).json({
          exito: false,
          mensaje: 'IDs de transferencia son requeridos'
        });
      }

      const resultado = await transferenciaService.obtenerEstadoTransferencia(idTra, idTrf);

      return res.status(resultado.exito ? 200 : 404).json(resultado);
    } catch (error) {
      console.error('Error en obtenerEstadoTransferencia:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * POST /api/transferencias/crear
   * ⭐ ENDPOINT PRINCIPAL DEL FLUJO
   * 
   * Implementa la lógica completa de creación de transferencia:
   * - Validaciones (datos, monto, saldo, límites)
   * - Prevención de duplicados
   * - Cálculo de comisiones
   * - Guardado automático de contacto (opcional)
   * - Creación del registro de transferencia
   * 
   * Body: {
   *   idCuenta (string, requerido) - Cuenta origen,
   *   idPersona (string, requerido) - Usuario propietario,
   *   monto (number, requerido) - Monto a transferir,
   *   descripcion (string, requerido) - Motivo de transferencia,
   *   tipoTransferencia (string, requerido) - '00' (Interna) o '01' (Interbancaria),
   *   saldoDisponible (number, requerido) - Saldo actual de la cuenta,
   *   saldoDisponibleAnterior (number, requerido) - Saldo anterior,
   *   cuentaDestino: {
   *     numeroCuenta (string, requerido),
   *     email (string, requerido),
   *     tipoIdentificacion (string, requerido) - '00', '01', '02',
   *     identificacion (string, requerido),
   *     tipoCuenta (string, requerido) - '00', '01',
   *     nombreBeneficiario (string, opcional),
   *     idBanco (string, requerido si es interbancaria),
   *     idContacto (string, opcional - si selecciona contacto existente)
   *   },
   *   guardarContacto: {
   *     guardar (boolean, opcional) - Si desea guardar como contacto,
   *     alias (string, opcional) - Alias para el contacto,
   *     nombreBeneficiario (string, opcional)
   *   }
   * }
   * 
   * Respuesta exitosa (201): {
   *   exito: true,
   *   codigo: 'TRANSFERENCIA_CREADA',
   *   mensaje: string,
   *   datos: {
   *     idTransferencia,
   *     idTransaccion,
   *     transferencia: {...},
   *     resumen: {
   *       montoTransferencia,
   *       comisiones,
   *       montoTotal,
   *       saldoAnterior,
   *       saldoNuevo,
   *       timestamp,
   *       tipoTransferencia,
   *       contactoGuardado
   *     }
   *   }
   * }
   * 
   * Respuesta error (400/422): {
   *   exito: false,
   *   codigo: string - Código específico de error,
   *   mensaje: string,
   *   detalles?: {...}
   * }
   */
  async crearTransferencia(req, res) {
    try {
      console.log('\n=== DEBUG crearTransferencia - INICIO ===');
      
      // Validar usuario autenticado
      const idPersona = req.body?.cliId || req.body?.idPersona || req.user?.id_persona;
      console.log('1. idPersona recibida:', idPersona);
      
      if (!idPersona) {
        console.log('❌ Usuario no autenticado');
        return res.status(401).json({
          exito: false,
          codigo: 'NO_AUTENTICADO',
          mensaje: 'Usuario no autenticado'
        });
      }

      const {
        traCuentaOrigen,
        traCuentaDestino,
        traMonto,
        traDescripcion,
        traTipoTransferencia,
        traEmail,
        traSaldoDisponible,
        conId
      } = req.body;

      console.log('2. Datos recibidos del frontend:');
      console.log('   - traCuentaOrigen:', traCuentaOrigen);
      console.log('   - traCuentaDestino:', traCuentaDestino);
      console.log('   - traMonto:', traMonto);

      if (!traCuentaOrigen || !traCuentaDestino || !traMonto || !traTipoTransferencia) {
        console.log('❌ Campos incompletos');
        return res.status(400).json({
          exito: false,
          codigo: 'CAMPOS_INCOMPLETOS',
          mensaje: 'Faltan campos requeridos'
        });
      }

      if (!['00', '01'].includes(traTipoTransferencia)) {
        console.log('❌ Tipo de transferencia inválido:', traTipoTransferencia);
        return res.status(400).json({
          exito: false,
          codigo: 'TIPO_TRANSFERENCIA_INVALIDO',
          mensaje: 'Tipo de transferencia debe ser 00 o 01'
        });
      }

      // PASO CRÍTICO: Obtener id_cuenta desde el número de cuenta
      console.log('3. Buscando cuenta por número:', traCuentaOrigen);
      const cuentaOrigen = await transferenciaRepository.buscarCuentaPorNumero(traCuentaOrigen);
      
      if (!cuentaOrigen) {
        console.log('❌ Cuenta origen no encontrada');
        return res.status(404).json({
          exito: false,
          codigo: 'CUENTA_NO_ENCONTRADA',
          mensaje: 'La cuenta origen no existe'
        });
      }

      console.log('✅ Cuenta origen encontrada:', cuentaOrigen.id_cuenta);

      // Preparar datos para el service
      const datosTransferencia = {
        idCuenta: cuentaOrigen.id_cuenta,
        idPersona: idPersona,
        monto: parseFloat(traMonto),
        descripcion: traDescripcion || 'Transferencia bancaria',
        tipoTransferencia: traTipoTransferencia,
        cuentaDestino: {
          numeroCuenta: traCuentaDestino,
          email: traEmail || '',
          tipoIdentificacion: '00',  // Valor por defecto: Cédula
          identificacion: '',  // Will be set to null if empty in service
          tipoCuenta: '00',    // Valor por defecto: Ahorros
          nombreBeneficiario: '',
          idBanco: null,
          idContacto: conId || null
        },
        saldoDisponible: parseFloat(traSaldoDisponible) || 0,
        saldoDisponibleAnterior: parseFloat(traSaldoDisponible) || 0,
        guardarContacto: { guardar: false }
      };

      console.log('4. Datos preparados para service - usando idCuenta:', datosTransferencia.idCuenta);
      console.log('5. Llamando a transferenciaService.crearTransferencia...');
      const resultado = await transferenciaService.crearTransferencia(datosTransferencia);
      console.log('   - codigo:', resultado.codigo);
      console.log('   - mensaje:', resultado.mensaje);

      // Retornar con status apropiad
      if (resultado.exito) {
        console.log('✅ Transferencia creada exitosamente');
        return res.status(201).json(resultado);
      } else {
        console.log('⚠️ Transferencia fallida:', resultado.codigo);
        const statusMap = {
          'VALIDACION_BASICA_FALLIDA': 400,
          'VALIDACION_MONTO_FALLIDA': 422,
          'LIMITE_EXCEDIDO': 422,
          'POSIBLE_DUPLICADO': 409,
          'BANCO_INVALIDO': 400,
          'ERROR_CREACION': 500,
          'ERROR_INTERNO': 500
        };
        const statusCode = statusMap[resultado.codigo] || 400;
        return res.status(statusCode).json(resultado);
      }
    } catch (error) {
      console.error('❌ Error en crearTransferencia:', error);
      console.error('Stack:', error.stack);
      return res.status(500).json({
        exito: false,
        codigo: 'ERROR_SERVIDOR',
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/transferencias/:idTra/:idTrf/cancelar
   * Cancela una transferencia pendiente (cambia estado a "Reversada")
   * Solo aplica a transferencias con estado '00' (Pendiente)
   * 
   * Params: idTra, idTrf
   * 
   * Respuesta: {
   *   exito: boolean,
   *   mensaje: string
   * }
   */
  async cancelarTransferencia(req, res) {
    try {
      const { idTra, idTrf } = req.params;

      if (!idTra || !idTrf) {
        return res.status(400).json({
          exito: false,
          mensaje: 'IDs de transferencia son requeridos'
        });
      }

      const resultado = await transferenciaService.cancelarTransferencia(idTra, idTrf);

      return res.status(resultado.exito ? 200 : 400).json(resultado);
    } catch (error) {
      console.error('Error en cancelarTransferencia:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * POST /api/transferencias/validar-cuenta-pichincha
   * Valida si una cuenta existe en Banco Pichincha
   * 
   * Body: { numeroCuenta }
   * 
   * Respuesta: {
   *   existe: boolean,
   *   nombreTitular?: string,
   *   tipoCuenta?: string,
   *   mensaje?: string
   * }
   */
  async validarCuentaPichincha(req, res) {
    try {
      const { numeroCuenta } = req.body;

      if (!numeroCuenta) {
        return res.status(400).json({
          exito: false,
          existe: false,
          mensaje: 'Número de cuenta es requerido'
        });
      }

      // Validar formato: 10 dígitos
      if (!/^\d{10}$/.test(numeroCuenta)) {
        return res.status(400).json({
          exito: false,
          existe: false,
          mensaje: 'El número de cuenta debe tener 10 dígitos'
        });
      }

      const resultado = await transferenciaService.validarCuentaPichincha(numeroCuenta);

      console.log('\n=== DEBUG validarCuentaPichincha Controller ===');
      console.log('1. numeroCuenta validado:', numeroCuenta);
      console.log('2. resultado del service:', JSON.stringify(resultado, null, 2));
      console.log('3. Detalles:');
      console.log('   - existe:', resultado.existe);
      console.log('   - nombreTitular:', resultado.nombreTitular, `(${typeof resultado.nombreTitular}, length: ${resultado.nombreTitular?.length})`);
      console.log('   - tipoCuenta:', resultado.tipoCuenta);
      console.log('   - tipoIdentificacion:', resultado.tipoIdentificacion);
      console.log('   - identificacion:', resultado.identificacion);
      console.log('4. Respuesta a enviar:', JSON.stringify({
        exito: true,
        ...resultado
      }, null, 2));

      return res.status(200).json({
        exito: true,
        ...resultado
      });
    } catch (error) {
      console.error('❌ Error en validarCuentaPichincha:', error);
      return res.status(500).json({
        exito: false,
        existe: false,
        mensaje: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

module.exports = new TransferenciaController();
