import mongoose from 'mongoose';
import crypto from 'crypto';

// Función para generar código único tipo DEUNA (8 caracteres alfanuméricos)
function generarCodigoDeuna() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Función para validar cédula ecuatoriana
function validarCedulaEcuatoriana(cedula) {
  // Verificar que tenga 10 dígitos
  if (!cedula || cedula.length !== 10) {
    return false;
  }

  // Verificar que solo contenga números
  if (!/^\d{10}$/.test(cedula)) {
    return false;
  }

  // Obtener código de provincia (primeros 2 dígitos)
  const provincia = parseInt(cedula.substring(0, 2), 10);
  
  // Verificar que la provincia sea válida (01-24 o 30 para extranjeros)
  if (provincia < 1 || (provincia > 24 && provincia !== 30)) {
    return false;
  }

  // Obtener tercer dígito (tipo de cédula: 0-5 para personas naturales)
  const tercerDigito = parseInt(cedula.charAt(2), 10);
  if (tercerDigito > 5) {
    return false;
  }

  // Algoritmo de validación del dígito verificador (módulo 10)
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula.charAt(i), 10) * coeficientes[i];
    if (valor > 9) {
      valor -= 9;
    }
    suma += valor;
  }

  const digitoVerificadorCalculado = (10 - (suma % 10)) % 10;
  const digitoVerificador = parseInt(cedula.charAt(9), 10);

  return digitoVerificadorCalculado === digitoVerificador;
}

const clienteSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del cliente es requerido'],
      trim: true,
    },
    cedula: {
      type: String,
      required: [true, 'La cédula es requerida'],
      unique: true,
      trim: true,
      validate: {
        validator: validarCedulaEcuatoriana,
        message: 'La cédula ecuatoriana no es válida'
      }
    },
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    telefono: {
      type: String,
      trim: true,
    },
    // Credenciales de acceso
    usuario: {
      type: String,
      required: [true, 'El usuario es requerido'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [4, 'El usuario debe tener al menos 4 caracteres'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es requerida'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    },
    // Código único DEUNA para recibir transferencias (se regenera en cada login)
    codigoDeuna: {
      type: String,
      unique: true,
      default: generarCodigoDeuna,
    },
    // Saldo disponible
    saldo: {
      type: Number,
      default: 0,
      min: [0, 'El saldo no puede ser negativo'],
    },
    // Estado de la cuenta
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Método para regenerar código DEUNA
clienteSchema.methods.regenerarCodigo = function() {
  this.codigoDeuna = generarCodigoDeuna();
  return this.save();
};

// Método para verificar contraseña
clienteSchema.methods.verificarPassword = function(password) {
  return this.password === password;
};

export default mongoose.model('Cliente', clienteSchema);
