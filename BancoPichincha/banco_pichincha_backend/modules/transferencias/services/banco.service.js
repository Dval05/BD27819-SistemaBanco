const bancoRepository = require('../repositories/banco.repository');

/**
 * Banco Service
 * Lógica de negocio para gestión de bancos
 */
class BancoService {
  /**
   * Obtiene todos los bancos disponibles para transferencias interbancarias
   * @returns {Promise<Object>} Respuesta con bancos o error
   */
  async obtenerBancosDisponibles() {
    try {
      const bancos = await bancoRepository.obtenerTodosBancos();

      if (!bancos || bancos.length === 0) {
        return {
          exito: false,
          mensaje: 'No hay bancos disponibles en el sistema',
          datos: []
        };
      }

      return {
        exito: true,
        mensaje: 'Bancos obtenidos exitosamente',
        datos: bancos.map(banco => ({
          id: banco.id_banco,
          nombre: banco.ban_nombre,
          codigo: banco.ban_codigo,
          estado: banco.ban_estado === '00' ? 'Activo' : 'Inactivo'
        }))
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al obtener bancos: ${error.message}`,
        datos: null
      };
    }
  }

  /**
   * Obtiene un banco específico por su ID
   * @param {string} idBanco - ID del banco
   * @returns {Promise<Object>} Respuesta con datos del banco
   */
  async obtenerBancoPorId(idBanco) {
    try {
      // Validación
      if (!idBanco || typeof idBanco !== 'string') {
        return {
          exito: false,
          mensaje: 'ID del banco inválido',
          datos: null
        };
      }

      const banco = await bancoRepository.obtenerBancoPorId(idBanco);

      if (!banco) {
        return {
          exito: false,
          mensaje: 'Banco no encontrado',
          datos: null
        };
      }

      return {
        exito: true,
        mensaje: 'Banco obtenido exitosamente',
        datos: {
          id: banco.id_banco,
          nombre: banco.ban_nombre,
          codigo: banco.ban_codigo,
          estado: banco.ban_estado === '00' ? 'Activo' : 'Inactivo'
        }
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al obtener banco: ${error.message}`,
        datos: null
      };
    }
  }

  /**
   * Obtiene un banco por su código
   * @param {string} codigo - Código del banco
   * @returns {Promise<Object>} Respuesta con datos del banco
   */
  async obtenerBancoPorCodigo(codigo) {
    try {
      // Validación
      if (!codigo || typeof codigo !== 'string' || codigo.trim().length === 0) {
        return {
          exito: false,
          mensaje: 'Código de banco inválido',
          datos: null
        };
      }

      const banco = await bancoRepository.obtenerBancoPorCodigo(codigo.toUpperCase());

      if (!banco) {
        return {
          exito: false,
          mensaje: 'Banco no encontrado con ese código',
          datos: null
        };
      }

      return {
        exito: true,
        mensaje: 'Banco obtenido exitosamente',
        datos: {
          id: banco.id_banco,
          nombre: banco.ban_nombre,
          codigo: banco.ban_codigo,
          estado: banco.ban_estado === '00' ? 'Activo' : 'Inactivo'
        }
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al obtener banco por código: ${error.message}`,
        datos: null
      };
    }
  }

  /**
   * Valida si un banco existe y está activo
   * @param {string} idBanco - ID del banco
   * @returns {Promise<Object>} Resultado de validación
   */
  async validarBancoExistente(idBanco) {
    try {
      const banco = await bancoRepository.obtenerBancoPorId(idBanco);

      if (!banco) {
        return {
          valido: false,
          mensaje: 'Banco no existe en el sistema'
        };
      }

      if (banco.ban_estado !== '00') {
        return {
          valido: false,
          mensaje: 'Banco no está activo en el sistema'
        };
      }

      return {
        valido: true,
        mensaje: 'Banco válido y activo',
        banco: {
          id: banco.id_banco,
          nombre: banco.ban_nombre,
          codigo: banco.ban_codigo
        }
      };
    } catch (error) {
      return {
        valido: false,
        mensaje: `Error al validar banco: ${error.message}`
      };
    }
  }
}

module.exports = new BancoService();
