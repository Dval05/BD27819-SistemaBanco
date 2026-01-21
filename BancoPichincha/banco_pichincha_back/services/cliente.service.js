import Cliente from '../models/Cliente.js';
import Transaccion from '../models/Transaccion.js';

class ClienteService {
  // Login de cliente - regenera código DEUNA automáticamente
  async login(usuario, password) {
    const cliente = await Cliente.findOne({ usuario: usuario.toLowerCase(), activo: true });
    
    if (!cliente) {
      throw new Error('Usuario no encontrado');
    }

    if (!cliente.verificarPassword(password)) {
      throw new Error('Contraseña incorrecta');
    }

    // Regenerar código DEUNA en cada login
    await cliente.regenerarCodigo();

    return cliente;
  }

  // Crear nuevo cliente
  async crearCliente(datosCliente) {
    const cliente = new Cliente(datosCliente);
    return await cliente.save();
  }

  // Obtener todos los clientes
  async obtenerClientes() {
    return await Cliente.find({ activo: true }).sort({ createdAt: -1 });
  }

  // Obtener cliente por ID
  async obtenerClientePorId(id) {
    return await Cliente.findById(id);
  }

  // Obtener cliente por código DEUNA
  async obtenerClientePorCodigo(codigoDeuna) {
    return await Cliente.findOne({ codigoDeuna: codigoDeuna.toUpperCase(), activo: true });
  }

  // Actualizar cliente
  async actualizarCliente(id, datosCliente) {
    return await Cliente.findByIdAndUpdate(
      id,
      datosCliente,
      { new: true, runValidators: true }
    );
  }

  // Eliminar cliente (soft delete)
  async eliminarCliente(id) {
    return await Cliente.findByIdAndUpdate(id, { activo: false }, { new: true });
  }

  // Depositar saldo
  async depositarSaldo(clienteId, monto, descripcion = 'Depósito de saldo') {
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }

    if (monto <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    // Actualizar saldo
    cliente.saldo += monto;
    await cliente.save();

    // Registrar transacción
    const transaccion = new Transaccion({
      tipo: 'DEPOSITO',
      monto,
      descripcion,
      clienteOrigen: cliente._id,
      saldoResultante: cliente.saldo,
    });
    await transaccion.save();

    return { cliente, transaccion };
  }

  // Transferir por código DEUNA
  async transferirPorCodigo(clienteOrigenId, codigoDestino, monto, descripcion = '') {
    // Validar monto
    if (monto <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    // Obtener cliente origen
    const clienteOrigen = await Cliente.findById(clienteOrigenId);
    if (!clienteOrigen) {
      throw new Error('Cliente origen no encontrado');
    }

    // Verificar saldo suficiente
    if (clienteOrigen.saldo < monto) {
      throw new Error('Saldo insuficiente');
    }

    // Buscar cliente destino por código DEUNA
    const clienteDestino = await this.obtenerClientePorCodigo(codigoDestino);
    if (!clienteDestino) {
      throw new Error('Código DEUNA no válido o no encontrado');
    }

    // Verificar que no sea el mismo cliente
    if (clienteOrigen._id.toString() === clienteDestino._id.toString()) {
      throw new Error('No puedes transferir a tu propia cuenta');
    }

    // Realizar la transferencia
    clienteOrigen.saldo -= monto;
    clienteDestino.saldo += monto;

    await clienteOrigen.save();
    await clienteDestino.save();

    // Registrar transacción enviada
    const transaccionEnviada = new Transaccion({
      tipo: 'TRANSFERENCIA_ENVIADA',
      monto,
      descripcion: descripcion || `Transferencia a ${clienteDestino.nombre}`,
      clienteOrigen: clienteOrigen._id,
      clienteDestino: clienteDestino._id,
      codigoDeuna: codigoDestino.toUpperCase(),
      saldoResultante: clienteOrigen.saldo,
    });
    await transaccionEnviada.save();

    // Registrar transacción recibida
    const transaccionRecibida = new Transaccion({
      tipo: 'TRANSFERENCIA_RECIBIDA',
      monto,
      descripcion: descripcion || `Transferencia de ${clienteOrigen.nombre}`,
      clienteOrigen: clienteDestino._id,
      clienteDestino: clienteOrigen._id,
      codigoDeuna: clienteOrigen.codigoDeuna,
      saldoResultante: clienteDestino.saldo,
    });
    await transaccionRecibida.save();

    return {
      exito: true,
      clienteOrigen,
      clienteDestino,
      transaccion: transaccionEnviada,
    };
  }

  // Obtener historial de transacciones de un cliente
  async obtenerTransacciones(clienteId, limite = 50) {
    return await Transaccion.find({ clienteOrigen: clienteId })
      .sort({ createdAt: -1 })
      .limit(limite)
      .populate('clienteDestino', 'nombre codigoDeuna');
  }

  // Regenerar código DEUNA
  async regenerarCodigo(clienteId) {
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }
    return await cliente.regenerarCodigo();
  }

  // Obtener estadísticas generales
  async obtenerEstadisticas() {
    const totalClientes = await Cliente.countDocuments({ activo: true });
    const saldoTotal = await Cliente.aggregate([
      { $match: { activo: true } },
      { $group: { _id: null, total: { $sum: '$saldo' } } }
    ]);
    const transaccionesHoy = await Transaccion.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });
    const totalTransacciones = await Transaccion.countDocuments();

    return {
      totalClientes,
      saldoTotal: saldoTotal[0]?.total || 0,
      transaccionesHoy,
      totalTransacciones,
    };
  }
}

export default new ClienteService();
