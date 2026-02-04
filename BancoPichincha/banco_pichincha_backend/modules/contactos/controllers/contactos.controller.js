const { supabase } = require('../../../shared/config/database.config');
const { v4: uuidv4 } = require('uuid');

/**
 * Obtener todos los contactos de una persona
 */
exports.obtenerContactos = async (req, res) => {
  try {
    const { id_persona } = req.params;

    console.log('📋 Obteniendo contactos para persona:', id_persona);

    const { data, error } = await supabase
      .from('contacto')
      .select(`
        *,
        banco:id_banco (
          id_banco,
          ban_nombre,
          ban_codigo
        )
      `)
      .eq('id_persona', id_persona)
      .eq('con_estado', '00')
      .order('con_alias', { ascending: true });

    if (error) throw error;

    console.log(`✅ Contactos encontrados: ${data.length}`);
    if (data.length > 0) {
      console.log('Primeros contactos:', data.slice(0, 3).map(c => ({
        alias: c.con_alias,
        id_persona: c.id_persona,
        cuenta: c.con_numero_cuenta
      })));
    }

    // Formatear respuesta
    const contactos = data.map(c => ({
      id: c.id_contacto,
      idPersona: c.id_persona,
      alias: c.con_alias,
      nombreBeneficiario: c.con_nombre_beneficiario,
      tipoIdentificacion: c.con_tipo_identificacion,
      identificacion: c.con_identificacion,
      numeroCuenta: c.con_numero_cuenta,
      email: c.con_email,
      tipoCuenta: c.con_tipo_cuenta,
      banco: c.banco ? {
        id: c.banco.id_banco,
        nombre: c.banco.ban_nombre,
        codigo: c.banco.ban_codigo
      } : null,
      fechaCreacion: c.con_fecha_creacion
    }));

    res.json({
      success: true,
      data: contactos
    });

  } catch (error) {
    console.error('Error obteniendo contactos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener contactos',
      error: error.message
    });
  }
};

/**
 * Crear un nuevo contacto
 */
exports.crearContacto = async (req, res) => {
  try {
    const {
      id_persona,
      alias,
      nombreBeneficiario,
      tipoIdentificacion,
      identificacion,
      numeroCuenta,
      email,
      tipoCuenta,
      id_banco
    } = req.body;

    // Validaciones
    if (!id_persona || !alias || !identificacion || !numeroCuenta || !email || !tipoCuenta) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios'
      });
    }

    // Verificar si ya existe un contacto con ese alias
    const { data: existente } = await supabase
      .from('contacto')
      .select('id_contacto')
      .eq('id_persona', id_persona)
      .eq('con_alias', alias)
      .eq('con_estado', '00')
      .single();

    if (existente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un contacto con ese alias'
      });
    }

    const id_contacto = `CON${Math.floor(Math.random() * 100000000)}`;

    const { data, error } = await supabase
      .from('contacto')
      .insert({
        id_contacto,
        id_persona,
        id_banco: id_banco || null,
        con_nombre_beneficiario: nombreBeneficiario || null,
        con_alias: alias,
        con_tipo_identificacion: tipoIdentificacion || '00',
        con_identificacion: identificacion,
        con_numero_cuenta: numeroCuenta,
        con_email: email,
        con_tipo_cuenta: tipoCuenta,
        con_estado: '00'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Contacto creado exitosamente',
      data: {
        id: data.id_contacto,
        alias: data.con_alias
      }
    });

  } catch (error) {
    console.error('Error creando contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear contacto',
      error: error.message
    });
  }
};

/**
 * Editar un contacto existente
 */
exports.editarContacto = async (req, res) => {
  try {
    const { id_contacto } = req.params;
    const {
      alias,
      nombreBeneficiario,
      email,
      id_banco
    } = req.body;

    const updates = {};
    if (alias) updates.con_alias = alias;
    if (nombreBeneficiario !== undefined) updates.con_nombre_beneficiario = nombreBeneficiario;
    if (email) updates.con_email = email;
    if (id_banco !== undefined) updates.id_banco = id_banco;

    const { data, error } = await supabase
      .from('contacto')
      .update(updates)
      .eq('id_contacto', id_contacto)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Contacto actualizado exitosamente',
      data: {
        id: data.id_contacto,
        alias: data.con_alias
      }
    });

  } catch (error) {
    console.error('Error editando contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al editar contacto',
      error: error.message
    });
  }
};

/**
 * Eliminar un contacto (soft delete)
 */
exports.eliminarContacto = async (req, res) => {
  try {
    const { id_contacto } = req.params;

    const { error } = await supabase
      .from('contacto')
      .update({ con_estado: '01' })
      .eq('id_contacto', id_contacto);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Contacto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar contacto',
      error: error.message
    });
  }
};

/**
 * Obtener lista de bancos activos
 */
exports.obtenerBancos = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('banco')
      .select('id_banco, ban_nombre, ban_codigo')
      .eq('ban_estado', '00')
      .order('ban_nombre', { ascending: true });

    if (error) throw error;

    const bancos = data.map(b => ({
      id: b.id_banco,
      nombre: b.ban_nombre,
      codigo: b.ban_codigo
    }));

    res.json({
      success: true,
      data: bancos
    });

  } catch (error) {
    console.error('Error obteniendo bancos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener bancos',
      error: error.message
    });
  }
};

/**
 * Limpiar TODOS los contactos de una persona (útil para pruebas)
 */
exports.limpiarTodosContactos = async (req, res) => {
  try {
    const { id_persona } = req.params;

    console.log('🧹 Limpiando todos los contactos de persona:', id_persona);

    // Obtener primero para contar
    const { data: contactosExistentes } = await supabase
      .from('contacto')
      .select('id_contacto, con_alias')
      .eq('id_persona', id_persona);

    if (!contactosExistentes || contactosExistentes.length === 0) {
      return res.json({
        success: true,
        message: 'No hay contactos para eliminar',
        eliminados: 0
      });
    }

    // Eliminar todos (cambiar estado a '01')
    const { error } = await supabase
      .from('contacto')
      .update({ con_estado: '01' })
      .eq('id_persona', id_persona);

    if (error) throw error;

    console.log(`✅ ${contactosExistentes.length} contactos eliminados`);

    res.json({
      success: true,
      message: `${contactosExistentes.length} contactos eliminados`,
      eliminados: contactosExistentes.length
    });

  } catch (error) {
    console.error('Error limpiando contactos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar contactos',
      error: error.message
    });
  }
};

/**
 * Validar si una cuenta pertenece a Banco Pichincha
 */
exports.validarCuenta = async (req, res) => {
  try {
    const { numeroCuenta } = req.body;

    console.log('🔍 Validando cuenta:', numeroCuenta);
    console.log('📝 Tipo:', typeof numeroCuenta, '| Longitud:', numeroCuenta?.length);

    if (!numeroCuenta) {
      return res.status(400).json({
        success: false,
        message: 'Número de cuenta requerido'
      });
    }

    // Buscar la cuenta en la base de datos
    console.log('🔎 Buscando cuenta con cue_numero =', numeroCuenta);
    
    const { data, error } = await supabase
      .from('cuenta')
      .select(`
        id_cuenta,
        cue_numero,
        cue_estado,
        persona:id_persona (
          id_persona,
          per_email,
          per_tipo_persona
        )
      `)
      .eq('cue_numero', numeroCuenta)
      .eq('cue_estado', '00')
      .single();

    console.log('📊 Resultado:', { encontrado: !!data, error: error?.message });

    if (error || !data) {
      console.log('❌ Cuenta no encontrada en Banco Pichincha:', error?.message);
      return res.json({
        success: true,
        esBancoPichincha: false,
        message: 'Cuenta no encontrada en Banco Pichincha. Puede ingresar los datos manualmente.'
      });
    }

    console.log('✅ Cuenta encontrada en Banco Pichincha');

    // Determinar tipo de cuenta (ahorro o corriente)
    let tipoCuenta = '00'; // Por defecto ahorro
    const { data: cuentaAhorro } = await supabase
      .from('cuenta_ahorro')
      .select('id_cuenta')
      .eq('id_cuenta', data.id_cuenta)
      .single();
    
    if (!cuentaAhorro) {
      tipoCuenta = '01'; // Es cuenta corriente
    }

    // Obtener datos de persona natural o jurídica
    let nombreBeneficiario = '';
    let tipoIdentificacion = '00';
    let identificacion = '';

    if (data.persona.per_tipo_persona === '00') {
      // Persona Natural
      const { data: personaNatural } = await supabase
        .from('persona_natural')
        .select('pernat_primer_nombre, pernat_segundo_nombre, pernat_primer_apellido, pernat_segundo_apellido, id_pernat')
        .eq('id_persona', data.persona.id_persona)
        .single();

      if (personaNatural) {
        nombreBeneficiario = `${personaNatural.pernat_primer_nombre} ${personaNatural.pernat_segundo_nombre || ''} ${personaNatural.pernat_primer_apellido} ${personaNatural.pernat_segundo_apellido || ''}`.replace(/\s+/g, ' ').trim();
        identificacion = personaNatural.id_pernat;
        tipoIdentificacion = '00'; // Cédula
      }
    } else {
      // Persona Jurídica
      const { data: personaJuridica } = await supabase
        .from('persona_juridica')
        .select('perjur_razon_social, id_perjur')
        .eq('id_persona', data.persona.id_persona)
        .single();

      if (personaJuridica) {
        nombreBeneficiario = personaJuridica.perjur_razon_social;
        identificacion = personaJuridica.id_perjur;
        tipoIdentificacion = '02'; // RUC
      }
    }

    // Retornar datos de la cuenta
    res.json({
      success: true,
      esBancoPichincha: true,
      message: 'Cuenta validada exitosamente',
      datos: {
        numeroCuenta: data.cue_numero,
        tipoCuenta: tipoCuenta,
        tipoIdentificacion: tipoIdentificacion,
        identificacion: identificacion,
        nombreBeneficiario: nombreBeneficiario,
        email: data.persona.per_email
      }
    });

  } catch (error) {
    console.error('Error validando cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar cuenta',
      error: error.message
    });
  }
};
