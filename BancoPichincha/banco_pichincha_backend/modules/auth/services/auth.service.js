const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const authRepository = require('../repositories/auth.repository');
const cuentaService = require('../../cuentas/services/cuenta.service');

class AuthService {
  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  async login(usuario, password) {
    if (!usuario || !password) {
      throw { status: 400, message: 'Usuario y contraseña son requeridos' };
    }

    const persona = await authRepository.findByUsuario(usuario);
    
    console.log('Login attempt:', { usuario, personaFound: !!persona });
    
    if (!persona) {
      console.log('Usuario no encontrado en la base de datos');
      throw { status: 401, message: 'Usuario no encontrado. Registra una cuenta primero.' };
    }

    const passwordHash = this.hashPassword(password);
    
    console.log('Password check:', { 
      inputHash: passwordHash, 
      storedHash: persona.per_contrasenia,
      matchHash: persona.per_contrasenia === passwordHash,
      matchPlain: persona.per_contrasenia === password
    });

    const passwordValid = persona.per_contrasenia === passwordHash || persona.per_contrasenia === password;
    
    if (!passwordValid) {
      throw { status: 401, message: 'Contraseña incorrecta' };
    }

    if (persona.per_estado !== '00') {
      throw { status: 403, message: 'Usuario inactivo' };
    }

    let datosAdicionales = null;
    if (persona.per_tipo_persona === '00') {
      datosAdicionales = await authRepository.findPersonaNatural(persona.id_persona);
    } else {
      datosAdicionales = await authRepository.findPersonaJuridica(persona.id_persona);
    }

    // Obtener cuenta del usuario
    const cuenta = await cuentaService.obtenerCuentaPorPersona(persona.id_persona);
    const response = this._formatPersonaResponse(persona, datosAdicionales);
    if (cuenta) {
      response.id_cuenta = cuenta.id_cuenta;
      response.numeroCuenta = cuenta.cue_numero;
      response.saldo = cuenta.cue_saldo_disponible;
    }
    return response;
  }

  async registro(data) {
    this._validateRegistro(data);

    const existente = await authRepository.findByUsuario(data.usuario);
    if (existente) {
      throw { status: 400, message: 'El usuario ya existe' };
    }

    const idPersona = uuidv4();
    const passwordHash = this.hashPassword(data.password);

    const persona = {
      id_persona: idPersona,
      per_email: data.email,
      per_telefono: data.telefono || 0,
      per_tipo_persona: '00',
      per_estado: '00',
      per_usuario: data.usuario,
      per_contrasenia: passwordHash
    };

    await authRepository.create(persona);

    const personaNatural = {
      id_persona: idPersona,
      id_pernat: uuidv4(),
      pernat_primer_nombre: data.primerNombre || data.nombre?.split(' ')[0] || '',
      pernat_segundo_nombre: data.segundoNombre || data.nombre?.split(' ')[1] || '',
      pernat_primer_apellido: data.primerApellido || data.nombre?.split(' ')[2] || '',
      pernat_segundo_apellido: data.segundoApellido || '',
      pernat_fecha_naci: data.fechaNacimiento || '1990-01-01'
    };

    await authRepository.createPersonaNatural(personaNatural);

    // Crear cuenta de ahorro flexible automáticamente
    let cuentaAhorro = null;
    try {
      cuentaAhorro = await cuentaService.crearCuentaAhorroFlexible(idPersona);
      console.log('Cuenta de ahorro flexible creada automáticamente para nuevo usuario:', idPersona);
    } catch (cuentaError) {
      console.error('Error al crear cuenta de ahorro automática:', cuentaError);
      // No lanzamos error para no afectar el registro
    }

    const createdPersona = await authRepository.findById(idPersona);
    const response = this._formatPersonaResponse(createdPersona, personaNatural);
    
    // Agregar información de la cuenta creada
    if (cuentaAhorro) {
      response.cuentaAhorro = cuentaAhorro;
    }
    
    return response;
  }

  async getProfile(id) {
    const persona = await authRepository.findById(id);
    if (!persona) {
      throw { status: 404, message: 'Usuario no encontrado' };
    }

    let datosAdicionales = null;
    if (persona.per_tipo_persona === '00') {
      datosAdicionales = await authRepository.findPersonaNatural(persona.id_persona);
    } else {
      datosAdicionales = await authRepository.findPersonaJuridica(persona.id_persona);
    }

    return this._formatPersonaResponse(persona, datosAdicionales);
  }

  _validateRegistro(data) {
    if (!data.usuario || data.usuario.length < 4) {
      throw { status: 400, message: 'Usuario debe tener al menos 4 caracteres' };
    }
    if (!data.password || data.password.length < 6) {
      throw { status: 400, message: 'Contraseña debe tener al menos 6 caracteres' };
    }
    if (!data.email) {
      throw { status: 400, message: 'Email es requerido' };
    }
  }

  _formatPersonaResponse(persona, datosAdicionales) {
    const response = {
      id: persona.id_persona,
      id_persona: persona.id_persona,
      usuario: persona.per_usuario,
      email: persona.per_email,
      telefono: persona.per_telefono,
      tipoPersona: persona.per_tipo_persona === '00' ? 'NATURAL' : 'JURIDICA',
      estado: persona.per_estado === '00' ? 'ACTIVO' : 'INACTIVO'
    };

    if (datosAdicionales) {
      if (persona.per_tipo_persona === '00') {
        response.nombre = `${datosAdicionales.pernat_primer_nombre} ${datosAdicionales.pernat_segundo_nombre || ''} ${datosAdicionales.pernat_primer_apellido} ${datosAdicionales.pernat_segundo_apellido || ''}`.trim();
        response.primerNombre = datosAdicionales.pernat_primer_nombre;
        response.segundoNombre = datosAdicionales.pernat_segundo_nombre;
        response.primerApellido = datosAdicionales.pernat_primer_apellido;
        response.segundoApellido = datosAdicionales.pernat_segundo_apellido;
        response.fechaNacimiento = datosAdicionales.pernat_fecha_naci;
      } else {
        response.razonSocial = datosAdicionales.perjur_razon_social;
        response.nombreComercial = datosAdicionales.perjur_nombre_comercial;
        response.ruc = datosAdicionales.perjur_ruc;
      }
    }

    return response;
  }
}

module.exports = new AuthService();
