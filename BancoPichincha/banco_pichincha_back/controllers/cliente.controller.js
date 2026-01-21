import clienteService from '../services/cliente.service.js';

class ClienteController {
  // Login de cliente
  static async login(req, res) {
    try {
      const { usuario, password } = req.body;

      if (!usuario || !password) {
        return res.status(400).json({
          ok: false,
          msg: 'Usuario y contraseña son requeridos',
        });
      }

      const cliente = await clienteService.login(usuario, password);

      res.json({
        ok: true,
        data: cliente,
        msg: `¡Bienvenido ${cliente.nombre}! Tu nuevo código DEUNA es: ${cliente.codigoDeuna}`,
      });
    } catch (err) {
      console.error('Error login:', err);
      res.status(401).json({
        ok: false,
        msg: err.message || 'Error al iniciar sesión',
      });
    }
  }

  // Crear un nuevo cliente (registro)
  static async crear(req, res) {
    try {
      const { nombre, cedula, email, telefono, usuario, password } = req.body;

      if (!nombre || !cedula || !email || !usuario || !password) {
        return res.status(400).json({
          ok: false,
          msg: 'Nombre, cédula, email, usuario y contraseña son requeridos',
        });
      }

      // Validar longitud mínima de usuario
      if (usuario.length < 4) {
        return res.status(400).json({
          ok: false,
          msg: 'El usuario debe tener al menos 4 caracteres',
        });
      }

      // Validar longitud mínima de contraseña
      if (password.length < 6) {
        return res.status(400).json({
          ok: false,
          msg: 'La contraseña debe tener al menos 6 caracteres',
        });
      }

      const cliente = await clienteService.crearCliente({
        nombre,
        cedula,
        email,
        telefono,
        usuario,
        password,
      });

      res.status(201).json({
        ok: true,
        data: cliente,
        msg: `¡Cuenta creada exitosamente! Ya puedes iniciar sesión con tu usuario: ${cliente.usuario}`,
      });
    } catch (err) {
      console.error('Error crear cliente:', err);
      
      // Error de validación de Mongoose (incluye cédula inválida)
      if (err.name === 'ValidationError') {
        const mensajes = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
          ok: false,
          msg: mensajes.join('. '),
        });
      }
      
      if (err.code === 11000) {
        // Determinar qué campo está duplicado
        const campo = Object.keys(err.keyPattern)[0];
        const mensajes = {
          cedula: 'La cédula ya está registrada',
          email: 'El email ya está registrado',
          usuario: 'El usuario ya existe, elige otro',
        };
        return res.status(400).json({
          ok: false,
          msg: mensajes[campo] || 'Ya existe un registro con esos datos',
        });
      }
      res.status(500).json({
        ok: false,
        msg: 'Error interno al crear cliente',
      });
    }
  }

  // Obtener todos los clientes
  static async obtenerTodos(req, res) {
    try {
      const clientes = await clienteService.obtenerClientes();

      res.json({
        ok: true,
        data: clientes,
      });
    } catch (err) {
      console.error('Error obtener clientes:', err);
      res.status(500).json({
        ok: false,
        msg: 'Error interno al obtener clientes',
      });
    }
  }

  // Obtener un cliente por ID
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const cliente = await clienteService.obtenerClientePorId(id);

      if (!cliente) {
        return res.status(404).json({
          ok: false,
          msg: 'Cliente no encontrado',
        });
      }

      res.json({
        ok: true,
        data: cliente,
      });
    } catch (err) {
      console.error('Error obtener cliente:', err);
      res.status(500).json({
        ok: false,
        msg: 'Error interno al obtener cliente',
      });
    }
  }

  // Buscar cliente por código DEUNA
  static async buscarPorCodigo(req, res) {
    try {
      const { codigo } = req.params;
      const cliente = await clienteService.obtenerClientePorCodigo(codigo);

      if (!cliente) {
        return res.status(404).json({
          ok: false,
          msg: 'Código DEUNA no encontrado',
        });
      }

      // Solo devolver información básica por seguridad
      res.json({
        ok: true,
        data: {
          _id: cliente._id,
          nombre: cliente.nombre,
          usuario: cliente.usuario,
          codigoDeuna: cliente.codigoDeuna,
        },
      });
    } catch (err) {
      console.error('Error buscar por código:', err);
      res.status(500).json({
        ok: false,
        msg: 'Error interno al buscar cliente',
      });
    }
  }

  // Actualizar un cliente
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { nombre, telefono, email } = req.body;

      const cliente = await clienteService.actualizarCliente(id, {
        nombre,
        telefono,
        email,
      });

      if (!cliente) {
        return res.status(404).json({
          ok: false,
          msg: 'Cliente no encontrado',
        });
      }

      res.json({
        ok: true,
        data: cliente,
      });
    } catch (err) {
      console.error('Error actualizar cliente:', err);
      res.status(500).json({
        ok: false,
        msg: 'Error interno al actualizar cliente',
      });
    }
  }

  // Eliminar un cliente
  static async eliminar(req, res) {
    try {
      const { id } = req.params;
      const cliente = await clienteService.eliminarCliente(id);

      if (!cliente) {
        return res.status(404).json({
          ok: false,
          msg: 'Cliente no encontrado',
        });
      }

      res.json({
        ok: true,
        msg: 'Cliente desactivado exitosamente',
      });
    } catch (err) {
      console.error('Error eliminar cliente:', err);
      res.status(500).json({
        ok: false,
        msg: 'Error interno al eliminar cliente',
      });
    }
  }

  // Depositar saldo
  static async depositar(req, res) {
    try {
      const { id } = req.params;
      const { monto, descripcion } = req.body;

      if (!monto || monto <= 0) {
        return res.status(400).json({
          ok: false,
          msg: 'El monto debe ser mayor a 0',
        });
      }

      const resultado = await clienteService.depositarSaldo(id, Number(monto), descripcion);

      res.json({
        ok: true,
        data: resultado,
        msg: `Depósito de $${monto.toFixed(2)} realizado exitosamente`,
      });
    } catch (err) {
      console.error('Error depositar:', err);
      res.status(500).json({
        ok: false,
        msg: err.message || 'Error al realizar depósito',
      });
    }
  }

  // Transferir por código DEUNA
  static async transferir(req, res) {
    try {
      const { id } = req.params; // ID del cliente origen
      const { codigoDestino, monto, descripcion } = req.body;

      if (!codigoDestino) {
        return res.status(400).json({
          ok: false,
          msg: 'El código DEUNA de destino es requerido',
        });
      }

      if (!monto || monto <= 0) {
        return res.status(400).json({
          ok: false,
          msg: 'El monto debe ser mayor a 0',
        });
      }

      const resultado = await clienteService.transferirPorCodigo(
        id,
        codigoDestino,
        Number(monto),
        descripcion
      );

      res.json({
        ok: true,
        data: resultado,
        msg: `Transferencia de $${monto.toFixed(2)} a ${resultado.clienteDestino.nombre} realizada exitosamente`,
      });
    } catch (err) {
      console.error('Error transferir:', err);
      res.status(400).json({
        ok: false,
        msg: err.message || 'Error al realizar transferencia',
      });
    }
  }

  // Obtener historial de transacciones
  static async obtenerTransacciones(req, res) {
    try {
      const { id } = req.params;
      const { limite } = req.query;

      const transacciones = await clienteService.obtenerTransacciones(id, Number(limite) || 50);

      res.json({
        ok: true,
        data: transacciones,
      });
    } catch (err) {
      console.error('Error obtener transacciones:', err);
      res.status(500).json({
        ok: false,
        msg: 'Error interno al obtener transacciones',
      });
    }
  }

  // Regenerar código DEUNA
  static async regenerarCodigo(req, res) {
    try {
      const { id } = req.params;
      const cliente = await clienteService.regenerarCodigo(id);

      res.json({
        ok: true,
        data: cliente,
        msg: `Tu nuevo código DEUNA es: ${cliente.codigoDeuna}`,
      });
    } catch (err) {
      console.error('Error regenerar código:', err);
      res.status(500).json({
        ok: false,
        msg: err.message || 'Error al regenerar código',
      });
    }
  }

  // Obtener estadísticas
  static async obtenerEstadisticas(req, res) {
    try {
      const estadisticas = await clienteService.obtenerEstadisticas();

      res.json({
        ok: true,
        data: estadisticas,
      });
    } catch (err) {
      console.error('Error obtener estadísticas:', err);
      res.status(500).json({
        ok: false,
        msg: 'Error interno al obtener estadísticas',
      });
    }
  }
}

export default ClienteController;
