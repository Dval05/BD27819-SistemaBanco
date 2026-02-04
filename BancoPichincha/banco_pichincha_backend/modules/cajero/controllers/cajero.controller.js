const { supabase } = require('../../../shared/config/database.config');
const { v4: uuidv4 } = require('uuid');

// Códigos BIN por marca de tarjeta (primeros 4-6 dígitos)
const CARD_BINS = {
  VISA: ['4532', '4556', '4916', '4929'],
  MASTERCARD: ['5234', '5425', '2221', '5555'],
  DINERS: ['3600', '3605', '3620', '3095'],
  AMEX: ['3400', '3700', '3704', '3711'],
  DISCOVER: ['6011', '6500', '6550', '6444'],
  JCB: ['3528', '3529', '3530', '3589']
};

// Marcas que ofrecen débito y crédito
const MARCAS_POR_TIPO = {
  debito: ['VISA', 'MASTERCARD', 'DISCOVER', 'JCB'],
  credito: ['VISA', 'MASTERCARD', 'DINERS', 'AMEX', 'DISCOVER', 'JCB']
};

/**
 * Generar una tarjeta débito con PIN temporal de 4 dígitos
 */
exports.generarTarjetaDebito = async (req, res) => {
  try {
    const { id_cuenta, id_persona, marca = 'VISA' } = req.body;

    if (!id_cuenta || !id_persona) {
      return res.status(400).json({
        success: false,
        message: 'id_cuenta e id_persona son requeridos'
      });
    }

    // Validar marca
    if (!CARD_BINS[marca]) {
      return res.status(400).json({
        success: false,
        message: 'Marca de tarjeta no válida. Usa: VISA, MASTERCARD, DINERS, AMEX, DISCOVER o JCB'
      });
    }

    // Validar que la marca ofrezca tarjetas de débito
    if (!MARCAS_POR_TIPO.debito.includes(marca)) {
      return res.status(400).json({
        success: false,
        message: `${marca} no ofrece tarjetas de débito. Solo está disponible para tarjetas de crédito.`
      });
    }

    // Generar IDs cortos para evitar error de longitud
    const id_tarjeta = 'TAR' + Date.now().toString().slice(-8);
    const id_tardeb = 'TDB' + Date.now().toString().slice(-8);
    const numeroTarjeta = generarNumeroTarjeta(marca);
    const pinTemporal = generarPinTemporal(); // PIN temporal aleatorio (no 1234)
    const pinHash = require('crypto')
      .createHash('sha256')
      .update(pinTemporal)
      .digest('hex');
    const cvv = generarCVV();
    const fechaEmision = new Date();
    const fechaExpiracion = new Date();
    fechaExpiracion.setFullYear(fechaExpiracion.getFullYear() + 5);

    // Insertar en tabla tarjeta (minúsculas)
    // tar_contactless = '01' indica que es primer uso (requiere cambio de PIN)
    const { error: errorTarjeta } = await supabase
      .from('tarjeta')
      .insert({
        id_tarjeta,
        id_cuenta,
        tar_numero: numeroTarjeta,
        tar_pin_hash: pinHash,
        tar_fecha_expiracion: fechaExpiracion.toISOString().split('T')[0],
        tar_cvv: cvv,
        tar_estado: '00',
        tar_fecha_emision: fechaEmision.toISOString().split('T')[0],
        tar_contactless: '01' // 01 = Primer uso (requiere cambio de PIN)
      });

    if (errorTarjeta) {
      console.error('Error insertando tarjeta:', errorTarjeta);
      throw errorTarjeta;
    }

    // Insertar en tabla tarjeta_debito (solo campos específicos)
    const { error: errorTarjetaDebito } = await supabase
      .from('tarjeta_debito')
      .insert({
        id_tarjeta,
        id_tardeb,
        tardeb_trans_dia_retiro: 0,
        tardeb_transacciones_compra: 0,
        tardeb_trans_dia_internacional: 0
      });

    if (errorTarjetaDebito) {
      console.error('Error insertando tarjeta_debito:', errorTarjetaDebito);
      throw errorTarjetaDebito;
    }

    res.json({
      success: true,
      message: 'Tarjeta débito generada exitosamente',
      data: {
        id_tarjeta,
        id_tardeb,
        numeroTarjeta: formatearNumeroTarjeta(numeroTarjeta),
        pinTemporal: pinTemporal,
        cvv,
        fechaExpiracion: formatearFechaExpiracion(fechaExpiracion),
        estado: 'Activa',
        marca: marca,
        mensaje: 'IMPORTANTE: Su clave temporal es ' + pinTemporal + '. Al usar su tarjeta por primera vez deberá cambiarla obligatoriamente.'
      }
    });
  } catch (error) {
    console.error('Error generando tarjeta débito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar la tarjeta',
      error: error.message
    });
  }
};

// Funciones auxiliares para formateo
function formatearNumeroTarjeta(numero) {
  return numero.replace(/(.{4})/g, '$1 ').trim();
}

function formatearFechaExpiracion(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = String(fecha.getFullYear()).slice(-2);
  return `${mes}/${anio}`;
}

/**
 * Verificar si una cuenta tiene tarjeta débito
 */
exports.verificarTarjeta = async (req, res) => {
  try {
    const { id_cuenta } = req.params;

    const { data, error } = await supabase
      .from('tarjeta')
      .select('id_tarjeta, tar_numero, tar_estado')
      .eq('id_cuenta', id_cuenta)
      .eq('tar_estado', '00') // Solo activas
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({
      success: true,
      existe: !!data,
      data: data
        ? {
            id_tarjeta: data.id_tarjeta,
            ultimosCuatroDigitos: data.tar_numero.slice(-4)
          }
        : null
    });
  } catch (error) {
    console.error('Error verificando tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar tarjeta',
      error: error.message
    });
  }
};

/**
 * Cambiar el PIN de la tarjeta (primer uso en cajero)
 */
exports.cambiarPin = async (req, res) => {
  try {
    const { id_tarjeta } = req.params;
    const { pinActual, nuevoPin } = req.body;

    if (!nuevoPin || nuevoPin.length !== 4 || !/^\d+$/.test(nuevoPin)) {
      return res.status(400).json({
        success: false,
        message: 'El PIN debe ser de 4 dígitos numéricos'
      });
    }

    // Validar que el nuevo PIN no sea 1234 (por seguridad)
    if (nuevoPin === '1234') {
      return res.status(400).json({
        success: false,
        message: 'Por seguridad, no puede usar 1234 como clave. Elija otra combinación.'
      });
    }

    // Validar que el nuevo PIN no sea secuencial (0000, 1111, etc.)
    if (/^(\d)\1{3}$/.test(nuevoPin)) {
      return res.status(400).json({
        success: false,
        message: 'Por seguridad, no puede usar números repetidos (0000, 1111, etc.)'
      });
    }

    // Si se proporciona PIN actual, verificarlo
    if (pinActual) {
      const pinActualHash = require('crypto')
        .createHash('sha256')
        .update(pinActual)
        .digest('hex');

      const { data: tarjeta, error: errorBuscar } = await supabase
        .from('tarjeta')
        .select('tar_pin_hash')
        .eq('id_tarjeta', id_tarjeta)
        .single();

      if (errorBuscar || !tarjeta) {
        return res.status(404).json({
          success: false,
          message: 'Tarjeta no encontrada'
        });
      }

      if (tarjeta.tar_pin_hash !== pinActualHash) {
        return res.status(401).json({
          success: false,
          message: 'La clave temporal ingresada es incorrecta'
        });
      }
    }

    const nuevoHash = require('crypto')
      .createHash('sha256')
      .update(nuevoPin)
      .digest('hex');

    // Actualizar PIN y marcar como ya no es primer uso (tar_contactless = '00')
    const { error } = await supabase
      .from('tarjeta')
      .update({ 
        tar_pin_hash: nuevoHash,
        tar_contactless: '00' // Ya no es primer uso
      })
      .eq('id_tarjeta', id_tarjeta);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Clave actualizada exitosamente. Ahora puede usar su tarjeta.'
    });
  } catch (error) {
    console.error('Error cambiando PIN:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar el PIN',
      error: error.message
    });
  }
};

/**
 * Solicitar retiro sin tarjeta - Verifica saldo antes de generar código
 */
exports.solicitarRetiroSinTarjeta = async (req, res) => {
  try {
    const { id_cuenta, numero_celular, monto, nombre_beneficiario } = req.body;

    if (!id_cuenta || !numero_celular || !monto) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: id_cuenta, numero_celular, monto'
      });
    }

    // Verificar que el monto sea válido (múltiplo de 10, máximo $300)
    if (monto <= 0 || monto > 300 || monto % 10 !== 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser múltiplo de $10 y máximo $300'
      });
    }

    // Verificar saldo disponible
    const { data: cuentaData, error: errorCuenta } = await supabase
      .from('cuenta')
      .select('cue_numero, cue_saldo_disponible')
      .eq('id_cuenta', id_cuenta)
      .single();

    if (errorCuenta || !cuentaData) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    if (cuentaData.cue_saldo_disponible < monto) {
      return res.status(400).json({
        success: false,
        message: `Saldo insuficiente. Disponible: $${cuentaData.cue_saldo_disponible.toFixed(2)}`
      });
    }

    // Generar código de 4 dígitos
    const codigoTemp = generarCodigoAleatorio(4);
    const id_retst = 'RST' + Date.now().toString().slice(-8);
    const fecha = new Date();
    const fechaExpiracion = new Date(fecha.getTime() + 4 * 60 * 60 * 1000); // 4 horas

    // Primero crear la transacción (retiro_sin_tarjeta tiene FK a transaccion)
    const id_tra = 'TRA' + Date.now().toString().slice(-8);
    const { error: errorTra } = await supabase
      .from('transaccion')
      .insert({
        id_tra,
        id_cuenta,
        tra_fecha_hora: fecha.toISOString(),
        tra_monto: monto,
        tra_tipo: '03', // Tipo retiro sin tarjeta
        tra_descripcion: `Retiro sin tarjeta - ${numero_celular}`,
        tra_estado: '00' // Pendiente
      });

    if (errorTra) {
      console.error('Error insertando transaccion:', errorTra);
      throw errorTra;
    }

    // Crear registro de retiro sin tarjeta
    const { error } = await supabase
      .from('retiro_sin_tarjeta')
      .insert({
        id_tra,
        id_retst,
        retst_clave_otp: codigoTemp,
        retst_celular: numero_celular,
        retst_fecha_generacion: fecha.toISOString().split('T')[0],
        retst_fecha_expiracion: fechaExpiracion.toISOString().split('T')[0],
        retst_estado: '00'
      });

    if (error) {
      console.error('Error insertando retiro_sin_tarjeta:', error);
      throw error;
    }

    res.json({
      success: true,
      message: 'Código de retiro generado',
      data: {
        id_retst,
        claveRetiro: codigoTemp,
        validezHoras: 4,
        validezHasta: fechaExpiracion.toISOString(),
        monto: monto,
        numeroCelular: numero_celular,
        numeroCelularOculto: `*** *** ${numero_celular.slice(-4)}`,
        numeroCuenta: `******${cuentaData.cue_numero.slice(-4)}`,
        nombreBeneficiario: nombre_beneficiario || 'consumidor final',
        saldoDisponible: cuentaData.cue_saldo_disponible
      }
    });
  } catch (error) {
    console.error('Error solicitando retiro sin tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al solicitar retiro',
      error: error.message
    });
  }
};

/**
 * Generar código temporal
 */
exports.generarCodigoTemporal = async (req, res) => {
  try {
    const { numero_celular, id_cuenta } = req.body;

    const codigo = generarCodigoAleatorio(6);
    
    // En producción, aquí se enviaría un SMS real
    console.log(`Código OTP para ${numero_celular}: ${codigo}`);

    res.json({
      success: true,
      message: 'Código generado y enviado',
      data: {
        codigo: codigo, // Solo para desarrollo/demo
        expiresIn: '10 minutos'
      }
    });
  } catch (error) {
    console.error('Error generando código temporal:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar código',
      error: error.message
    });
  }
};

/**
 * Validar código temporal
 */
exports.validarCodigoTemporal = async (req, res) => {
  try {
    const { id_retst, codigoIngresado } = req.body;

    const { data, error } = await supabase
      .from('retiro_sin_tarjeta')
      .select('retst_clave_otp, retst_fecha_expiracion, retst_estado')
      .eq('id_retst', id_retst)
      .single();

    if (error) throw error;

    const ahora = new Date();
    const fechaExpiracion = new Date(data.retst_fecha_expiracion);

    if (ahora > fechaExpiracion) {
      return res.json({
        success: false,
        message: 'Código expirado'
      });
    }

    if (data.retst_clave_otp !== codigoIngresado) {
      return res.json({
        success: false,
        message: 'Código incorrecto'
      });
    }

    // Actualizar estado a válido
    await supabase
      .from('retiro_sin_tarjeta')
      .update({ retst_estado: '01' })
      .eq('id_retst', id_retst);

    res.json({
      success: true,
      message: 'Código validado correctamente'
    });
  } catch (error) {
    console.error('Error validando código:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar código',
      error: error.message
    });
  }
};

/**
 * Validar código OTP en cajero por celular y código
 */
exports.validarCodigoEnCajero = async (req, res) => {
  try {
    const { numero_celular, codigo } = req.body;

    if (!numero_celular || !codigo) {
      return res.status(400).json({
        success: false,
        message: 'Número de celular y código son requeridos'
      });
    }

    // Buscar retiro pendiente con ese celular y código
    const { data, error } = await supabase
      .from('retiro_sin_tarjeta')
      .select(`
        id_retst,
        id_tra,
        retst_clave_otp,
        retst_celular,
        retst_fecha_expiracion,
        retst_estado,
        transaccion:id_tra (
          id_cuenta,
          tra_monto
        )
      `)
      .eq('retst_celular', numero_celular)
      .eq('retst_clave_otp', codigo)
      .eq('retst_estado', '00')
      .single();

    if (error && error.code === 'PGRST116') {
      return res.json({
        success: false,
        message: 'Código inválido o ya fue utilizado'
      });
    }

    if (error) throw error;

    // Verificar que no haya expirado
    const ahora = new Date();
    const fechaExp = new Date(data.retst_fecha_expiracion);
    fechaExp.setHours(23, 59, 59); // Fin del día

    if (ahora > fechaExp) {
      return res.json({
        success: false,
        message: 'Código expirado'
      });
    }

    res.json({
      success: true,
      message: 'Código válido',
      data: {
        id_retst: data.id_retst,
        id_tra: data.id_tra,
        id_cuenta: data.transaccion?.id_cuenta,
        monto: data.transaccion?.tra_monto || 0
      }
    });
  } catch (error) {
    console.error('Error validando código en cajero:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar código',
      error: error.message
    });
  }
};

/**
 * Validar tarjeta en cajero (últimos 4 dígitos)
 * Puede buscar por id_cuenta O solo por los últimos 4 dígitos
 * Verifica que la tarjeta no esté bloqueada
 */
exports.validarTarjetaEnCajero = async (req, res) => {
  try {
    const { id_cuenta, ultimos4digitos } = req.body;

    let query = supabase
      .from('tarjeta')
      .select('id_tarjeta, id_cuenta, tar_numero, tar_estado, tar_contactless')
      .like('tar_numero', `%${ultimos4digitos}`);

    // Si se proporciona id_cuenta, filtrar por esa cuenta
    if (id_cuenta) {
      query = query.eq('id_cuenta', id_cuenta);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return res.json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    // Verificar estado de la tarjeta
    const estadoDescripcion = {
      '00': 'Activa',
      '01': 'Bloqueada temporalmente',
      '02': 'Bloqueada permanentemente',
      '03': 'Cancelada'
    };

    if (data.tar_estado !== '00') {
      return res.json({
        success: false,
        message: `Esta tarjeta está ${estadoDescripcion[data.tar_estado] || 'inactiva'}. No se pueden realizar operaciones.`,
        bloqueada: true,
        estadoTarjeta: data.tar_estado
      });
    }

    // Obtener información de la cuenta asociada
    const { data: cuentaData, error: errorCuenta } = await supabase
      .from('cuenta')
      .select('id_cuenta, cue_numero, cue_saldo_disponible')
      .eq('id_cuenta', data.id_cuenta)
      .single();

    if (errorCuenta) {
      console.error('Error obteniendo cuenta:', errorCuenta);
    }

    res.json({
      success: true,
      data: {
        id_tarjeta: data.id_tarjeta,
        id_cuenta: data.id_cuenta,
        numero: `****${data.tar_numero.slice(-4)}`,
        estado: data.tar_estado === '00' ? 'Activa' : 'Inactiva',
        primerUso: data.tar_contactless === '01', // 01 = primer uso
        cuenta: cuentaData ? {
          numero: cuentaData.cue_numero,
          saldoDisponible: cuentaData.cue_saldo_disponible
        } : null
      }
    });
  } catch (error) {
    console.error('Error validando tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar tarjeta',
      error: error.message
    });
  }
};

/**
 * Procesar retiro en cajero
 * El retiro siempre debita de la cuenta de ahorros asociada a la tarjeta
 */
exports.procesarRetiro = async (req, res) => {
  try {
    const { id_cuenta, id_tarjeta, monto, tipo_cuenta, metodo } = req.body;
    // metodo: 'tarjeta' o 'codigo'

    // Si se proporciona id_tarjeta, obtener el id_cuenta de la tarjeta
    let cuentaId = id_cuenta;
    
    if (id_tarjeta && metodo === 'tarjeta') {
      const { data: tarjetaData, error: errorTarjeta } = await supabase
        .from('tarjeta')
        .select('id_cuenta')
        .eq('id_tarjeta', id_tarjeta)
        .single();
      
      if (errorTarjeta) {
        return res.status(404).json({
          success: false,
          message: 'Tarjeta no encontrada'
        });
      }
      
      cuentaId = tarjetaData.id_cuenta;
    }

    if (!cuentaId || !monto || !metodo) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos incompletos'
      });
    }

    // Verificar saldo antes de procesar
    const { data: cuenta, error: errorCuenta } = await supabase
      .from('cuenta')
      .select('cue_saldo_disponible, cue_numero')
      .eq('id_cuenta', cuentaId)
      .single();

    if (errorCuenta) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    if (cuenta.cue_saldo_disponible < monto) {
      return res.status(400).json({
        success: false,
        message: `Saldo insuficiente. Disponible: $${cuenta.cue_saldo_disponible.toFixed(2)}`
      });
    }

    const id_tra = 'TRA' + Date.now().toString().slice(-8);
    const fecha = new Date();

    // Crear transacción de retiro
    const { error } = await supabase
      .from('transaccion')
      .insert({
        id_tra,
        id_cuenta: cuentaId,
        tra_fecha_hora: fecha.toISOString(),
        tra_monto: monto,
        tra_tipo: '03', // Retiro
        tra_descripcion: `Retiro en cajero - ${metodo === 'tarjeta' ? 'Con tarjeta débito' : 'Sin tarjeta'}`,
        tra_estado: '01' // Completada
      });

    if (error) throw error;

    // Actualizar saldo de la cuenta de ahorros
    const nuevoSaldo = cuenta.cue_saldo_disponible - monto;
    await supabase
      .from('cuenta')
      .update({ cue_saldo_disponible: nuevoSaldo })
      .eq('id_cuenta', cuentaId);

    res.json({
      success: true,
      message: 'Retiro procesado exitosamente',
      data: {
        id_transaccion: id_tra,
        numeroCuenta: cuenta.cue_numero,
        montoRetirado: monto,
        saldoAnterior: cuenta.cue_saldo_disponible,
        saldoNuevo: nuevoSaldo,
        fecha: fecha.toISOString(),
        metodo
      }
    });
  } catch (error) {
    console.error('Error procesando retiro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar retiro',
      error: error.message
    });
  }
};

/**
 * Obtener historial de retiros
 */
exports.obtenerHistorialRetiros = async (req, res) => {
  try {
    const { id_cuenta } = req.params;

    const { data, error } = await supabase
      .from('transaccion')
      .select('*')
      .eq('id_cuenta', id_cuenta)
      .eq('tra_tipo', '03')
      .order('tra_fecha_hora', { ascending: false })
      .limit(10);

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial',
      error: error.message
    });
  }
};

/**
 * Bloquear tarjeta (temporal o permanente)
 * tar_estado: '00' = Activa, '01' = Bloqueada temporal, '02' = Bloqueada permanente, '03' = Cancelada
 */
exports.bloquearTarjeta = async (req, res) => {
  try {
    const { id_tarjeta } = req.params;
    const { tipo_bloqueo } = req.body; // 'temporal' o 'permanente'

    if (!id_tarjeta) {
      return res.status(400).json({
        success: false,
        message: 'id_tarjeta es requerido'
      });
    }

    // Verificar que la tarjeta existe y está activa
    const { data: tarjeta, error: errorBuscar } = await supabase
      .from('tarjeta')
      .select('tar_estado')
      .eq('id_tarjeta', id_tarjeta)
      .single();

    if (errorBuscar || !tarjeta) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    if (tarjeta.tar_estado === '03') {
      return res.status(400).json({
        success: false,
        message: 'La tarjeta ya fue cancelada'
      });
    }

    const nuevoEstado = tipo_bloqueo === 'permanente' ? '02' : '01';

    const { error } = await supabase
      .from('tarjeta')
      .update({ tar_estado: nuevoEstado })
      .eq('id_tarjeta', id_tarjeta);

    if (error) throw error;

    res.json({
      success: true,
      message: tipo_bloqueo === 'permanente' 
        ? 'Tarjeta bloqueada permanentemente' 
        : 'Tarjeta bloqueada temporalmente. Puede desbloquearla cuando lo desee.'
    });
  } catch (error) {
    console.error('Error bloqueando tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al bloquear tarjeta',
      error: error.message
    });
  }
};

/**
 * Desbloquear tarjeta (solo si está bloqueada temporalmente)
 */
exports.desbloquearTarjeta = async (req, res) => {
  try {
    const { id_tarjeta } = req.params;

    if (!id_tarjeta) {
      return res.status(400).json({
        success: false,
        message: 'id_tarjeta es requerido'
      });
    }

    // Verificar que la tarjeta existe y está bloqueada temporalmente
    const { data: tarjeta, error: errorBuscar } = await supabase
      .from('tarjeta')
      .select('tar_estado')
      .eq('id_tarjeta', id_tarjeta)
      .single();

    if (errorBuscar || !tarjeta) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    if (tarjeta.tar_estado === '00') {
      return res.status(400).json({
        success: false,
        message: 'La tarjeta ya está activa'
      });
    }

    if (tarjeta.tar_estado === '02') {
      return res.status(400).json({
        success: false,
        message: 'La tarjeta está bloqueada permanentemente y no puede ser desbloqueada'
      });
    }

    if (tarjeta.tar_estado === '03') {
      return res.status(400).json({
        success: false,
        message: 'La tarjeta fue cancelada'
      });
    }

    const { error } = await supabase
      .from('tarjeta')
      .update({ tar_estado: '00' })
      .eq('id_tarjeta', id_tarjeta);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Tarjeta desbloqueada exitosamente'
    });
  } catch (error) {
    console.error('Error desbloqueando tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desbloquear tarjeta',
      error: error.message
    });
  }
};

/**
 * Cancelar tarjeta (eliminar definitivamente)
 */
exports.cancelarTarjeta = async (req, res) => {
  try {
    const { id_tarjeta } = req.params;

    if (!id_tarjeta) {
      return res.status(400).json({
        success: false,
        message: 'id_tarjeta es requerido'
      });
    }

    // Verificar que la tarjeta existe
    const { data: tarjeta, error: errorBuscar } = await supabase
      .from('tarjeta')
      .select('tar_estado')
      .eq('id_tarjeta', id_tarjeta)
      .single();

    if (errorBuscar || !tarjeta) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    if (tarjeta.tar_estado === '03') {
      return res.status(400).json({
        success: false,
        message: 'La tarjeta ya fue cancelada'
      });
    }

    // Primero eliminar de tarjeta_debito (si existe)
    await supabase
      .from('tarjeta_debito')
      .delete()
      .eq('id_tarjeta', id_tarjeta);

    // Marcar como cancelada (en lugar de eliminar, por historial)
    const { error } = await supabase
      .from('tarjeta')
      .update({ tar_estado: '03' })
      .eq('id_tarjeta', id_tarjeta);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Tarjeta cancelada exitosamente. Esta acción es irreversible.'
    });
  } catch (error) {
    console.error('Error cancelando tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar tarjeta',
      error: error.message
    });
  }
};

/**
 * Obtener estado de la tarjeta
 */
exports.obtenerEstadoTarjeta = async (req, res) => {
  try {
    const { id_tarjeta } = req.params;

    const { data, error } = await supabase
      .from('tarjeta')
      .select('id_tarjeta, tar_numero, tar_estado, tar_fecha_expiracion, tar_cvv')
      .eq('id_tarjeta', id_tarjeta)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    const estadoDescripcion = {
      '00': 'Activa',
      '01': 'Bloqueada temporalmente',
      '02': 'Bloqueada permanentemente',
      '03': 'Cancelada'
    };

    res.json({
      success: true,
      data: {
        id_tarjeta: data.id_tarjeta,
        numero: `****${data.tar_numero.slice(-4)}`,
        estado: data.tar_estado,
        estadoDescripcion: estadoDescripcion[data.tar_estado] || 'Desconocido',
        puedeDesbloquear: data.tar_estado === '01',
        puedeBloquear: data.tar_estado === '00',
        puedeCancelar: data.tar_estado !== '03'
      }
    });
  } catch (error) {
    console.error('Error obteniendo estado tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estado',
      error: error.message
    });
  }
};

/**
 * Validar PIN de tarjeta
 */
exports.validarPin = async (req, res) => {
  try {
    const { id_tarjeta, pin } = req.body;

    if (!id_tarjeta || !pin) {
      return res.status(400).json({
        success: false,
        message: 'id_tarjeta y pin son requeridos'
      });
    }

    const pinHash = require('crypto')
      .createHash('sha256')
      .update(pin)
      .digest('hex');

    const { data, error } = await supabase
      .from('tarjeta')
      .select('tar_pin_hash, tar_contactless')
      .eq('id_tarjeta', id_tarjeta)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    if (data.tar_pin_hash !== pinHash) {
      return res.json({
        success: false,
        message: 'Clave incorrecta'
      });
    }

    res.json({
      success: true,
      message: 'Clave válida',
      primerUso: data.tar_contactless === '01'
    });
  } catch (error) {
    console.error('Error validando PIN:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar clave',
      error: error.message
    });
  }
};

// ============== FUNCIONES AUXILIARES ==============

/**
 * Generar un número de tarjeta válido según la marca
 */
function generarNumeroTarjeta(marca = 'VISA') {
  // Obtener prefijos BIN según la marca
  const bins = CARD_BINS[marca] || CARD_BINS.VISA;
  const prefix = bins[Math.floor(Math.random() * bins.length)];
  
  let numero = prefix;
  
  // Generar el resto de dígitos
  const digitsToGenerate = 16 - prefix.length;
  for (let i = 0; i < digitsToGenerate; i++) {
    numero += Math.floor(Math.random() * 10);
  }
  
  return numero;
}

/**
 * Generar PIN de 4 dígitos
 */
function generarPin4Digitos() {
  let pin = '';
  for (let i = 0; i < 4; i++) {
    pin += Math.floor(Math.random() * 10);
  }
  return pin;
}

/**
 * Generar PIN temporal (evitando 1234 y números repetidos)
 */
function generarPinTemporal() {
  let pin = '';
  do {
    pin = '';
    for (let i = 0; i < 4; i++) {
      pin += Math.floor(Math.random() * 10);
    }
    // Evitar 1234 y números repetidos (0000, 1111, etc.)
  } while (pin === '1234' || /^(\d)\1{3}$/.test(pin));
  return pin;
}

/**
 * Generar CVV (3 dígitos)
 */
function generarCVV() {
  let cvv = '';
  for (let i = 0; i < 3; i++) {
    cvv += Math.floor(Math.random() * 10);
  }
  return cvv;
}

/**
 * Generar código aleatorio de N dígitos
 */
function generarCodigoAleatorio(longitud) {
  let codigo = '';
  for (let i = 0; i < longitud; i++) {
    codigo += Math.floor(Math.random() * 10);
  }
  return codigo;
}
