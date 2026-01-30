const { supabase } = require('../../../shared/config/database.config');
const { v4: uuidv4 } = require('uuid');

/**
 * Generar una tarjeta débito con PIN de 4 dígitos
 */
exports.generarTarjetaDebito = async (req, res) => {
  try {
    const { id_cuenta, id_persona } = req.body;

    if (!id_cuenta || !id_persona) {
      return res.status(400).json({
        success: false,
        message: 'id_cuenta e id_persona son requeridos'
      });
    }

    // Generar IDs cortos para evitar error de longitud
    const id_tarjeta = 'TAR' + Date.now().toString().slice(-8);
    const id_tardeb = 'TDB' + Date.now().toString().slice(-8);
    const numeroTarjeta = generarNumeroTarjeta();
    const pin = generarPin4Digitos();
    const pinHash = require('crypto')
      .createHash('sha256')
      .update(pin)
      .digest('hex');
    const cvv = generarCVV();
    const fechaEmision = new Date();
    const fechaExpiracion = new Date();
    fechaExpiracion.setFullYear(fechaExpiracion.getFullYear() + 5);

    // Insertar en tabla tarjeta (minúsculas)
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
        tar_contactless: '00'
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
        pinTemporal: pin,
        cvv,
        fechaExpiracion: formatearFechaExpiracion(fechaExpiracion),
        estado: 'Activa'
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
    const { nuevoPin } = req.body;

    if (!nuevoPin || nuevoPin.length !== 4 || !/^\d+$/.test(nuevoPin)) {
      return res.status(400).json({
        success: false,
        message: 'El PIN debe ser de 4 dígitos numéricos'
      });
    }

    const pinHash = require('crypto')
      .createHash('sha256')
      .update(nuevoPin)
      .digest('hex');

    const { error } = await supabase
      .from('tarjeta')
      .update({ tar_pin_hash: pinHash })
      .eq('id_tarjeta', id_tarjeta);

    if (error) throw error;

    res.json({
      success: true,
      message: 'PIN actualizado exitosamente'
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
 */
exports.validarTarjetaEnCajero = async (req, res) => {
  try {
    const { id_cuenta, ultimos4digitos } = req.body;

    const { data, error } = await supabase
      .from('tarjeta')
      .select('id_tarjeta, tar_numero, tar_estado')
      .eq('id_cuenta', id_cuenta)
      .like('tar_numero', `%${ultimos4digitos}`)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return res.json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        id_tarjeta: data.id_tarjeta,
        numero: `****${data.tar_numero.slice(-4)}`,
        estado: data.tar_estado === '00' ? 'Activa' : 'Inactiva'
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
 */
exports.procesarRetiro = async (req, res) => {
  try {
    const { id_cuenta, monto, tipo_cuenta, metodo } = req.body;
    // metodo: 'tarjeta' o 'codigo'

    if (!id_cuenta || !monto || !tipo_cuenta || !metodo) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos incompletos'
      });
    }

    const id_tra = 'TRA' + Date.now().toString().slice(-8);
    const fecha = new Date();

    // Crear transacción de retiro
    const { error } = await supabase
      .from('transaccion')
      .insert({
        id_tra,
        id_cuenta,
        tra_fecha_hora: fecha.toISOString(),
        tra_monto: monto,
        tra_tipo: '03', // Retiro
        tra_descripcion: `Retiro en cajero - ${metodo === 'tarjeta' ? 'Con tarjeta' : 'Sin tarjeta'}`,
        tra_estado: '01' // Completada
      });

    if (error) throw error;

    // Obtener saldo actual de la cuenta
    const { data: cuenta, error: errorCuenta } = await supabase
      .from('cuenta')
      .select('cue_saldo_disponible')
      .eq('id_cuenta', id_cuenta)
      .single();

    if (errorCuenta) throw errorCuenta;

    // Actualizar saldo
    const nuevoSaldo = cuenta.cue_saldo_disponible - monto;
    await supabase
      .from('cuenta')
      .update({ cue_saldo_disponible: nuevoSaldo })
      .eq('id_cuenta', id_cuenta);

    res.json({
      success: true,
      message: 'Retiro procesado exitosamente',
      data: {
        id_transaccion: id_tra,
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

// ============== FUNCIONES AUXILIARES ==============

/**
 * Generar un número de tarjeta válido (16 dígitos)
 */
function generarNumeroTarjeta() {
  let numero = '';
  for (let i = 0; i < 16; i++) {
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
