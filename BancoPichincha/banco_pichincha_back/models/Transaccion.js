import mongoose from 'mongoose';

const transaccionSchema = new mongoose.Schema(
  {
    // Tipo de transacción
    tipo: {
      type: String,
      enum: ['DEPOSITO', 'TRANSFERENCIA_ENVIADA', 'TRANSFERENCIA_RECIBIDA'],
      required: true,
    },
    // Monto de la transacción
    monto: {
      type: Number,
      required: [true, 'El monto es requerido'],
      min: [0.01, 'El monto mínimo es $0.01'],
    },
    // Descripción opcional
    descripcion: {
      type: String,
      trim: true,
      default: '',
    },
    // Cliente que realiza la transacción
    clienteOrigen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      required: true,
    },
    // Cliente destino (solo para transferencias)
    clienteDestino: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
    },
    // Código DEUNA usado en la transferencia
    codigoDeuna: {
      type: String,
    },
    // Saldo después de la transacción
    saldoResultante: {
      type: Number,
      required: true,
    },
    // Estado de la transacción
    estado: {
      type: String,
      enum: ['COMPLETADA', 'PENDIENTE', 'FALLIDA'],
      default: 'COMPLETADA',
    },
    // Código de referencia único
    referencia: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generar referencia única antes de guardar
transaccionSchema.pre('save', function(next) {
  if (!this.referencia) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.referencia = `TXN-${timestamp}-${random}`;
  }
  next();
});

// Índices para búsquedas rápidas
transaccionSchema.index({ clienteOrigen: 1, createdAt: -1 });
transaccionSchema.index({ clienteDestino: 1, createdAt: -1 });
transaccionSchema.index({ referencia: 1 });

const Transaccion = mongoose.model('Transaccion', transaccionSchema);

export default Transaccion;
