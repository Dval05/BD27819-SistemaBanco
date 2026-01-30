import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/cajero';

/**
 * Servicio para operaciones del Cajero Automático
 */
const cajeroService = {
  /**
   * Generar una tarjeta débito
   */
  async generarTarjeta(id_cuenta: string, id_persona: string) {
    try {
      const response = await axios.post(`${API_BASE}/tarjeta/generar`, {
        id_cuenta,
        id_persona
      });
      return {
        ok: response.data.success,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Verificar si existe tarjeta para una cuenta
   */
  async verificarTarjeta(id_cuenta: string) {
    try {
      const response = await axios.get(`${API_BASE}/tarjeta/verificar/${id_cuenta}`);
      return {
        ok: response.data.success,
        existe: response.data.existe,
        data: response.data.data
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Cambiar PIN de la tarjeta
   */
  async cambiarPin(id_tarjeta: string, nuevoPin: string) {
    try {
      const response = await axios.put(`${API_BASE}/tarjeta/cambiar-pin/${id_tarjeta}`, {
        nuevoPin
      });
      return {
        ok: response.data.success,
        message: response.data.message
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Solicitar retiro sin tarjeta
   */
  async solicitarRetiroSinTarjeta(id_cuenta: string, numero_celular: string, monto: number) {
    try {
      const response = await axios.post(`${API_BASE}/retiro-sin-tarjeta/solicitar`, {
        id_cuenta,
        numero_celular,
        monto
      });
      return {
        ok: response.data.success,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Generar código temporal
   */
  async generarCodigoTemporal(numero_celular: string, id_cuenta: string) {
    try {
      const response = await axios.post(`${API_BASE}/retiro-sin-tarjeta/generar-codigo`, {
        numero_celular,
        id_cuenta
      });
      return {
        ok: response.data.success,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Validar código temporal
   */
  async validarCodigoTemporal(id_retst: string, codigoIngresado: string) {
    try {
      const response = await axios.post(`${API_BASE}/retiro-sin-tarjeta/validar-codigo`, {
        id_retst,
        codigoIngresado
      });
      return {
        ok: response.data.success,
        message: response.data.message
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Validar tarjeta en cajero
   */
  async validarTarjetaEnCajero(id_cuenta: string, ultimos4digitos: string) {
    try {
      const response = await axios.post(`${API_BASE}/retiro/validar-tarjeta`, {
        id_cuenta,
        ultimos4digitos
      });
      return {
        ok: response.data.success,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Procesar retiro en cajero
   */
  async procesarRetiro(id_cuenta: string, monto: number, tipo_cuenta: string, metodo: string) {
    try {
      const response = await axios.post(`${API_BASE}/retiro/procesar`, {
        id_cuenta,
        monto,
        tipo_cuenta,
        metodo
      });
      return {
        ok: response.data.success,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtener historial de retiros
   */
  async obtenerHistorialRetiros(id_cuenta: string) {
    try {
      const response = await axios.get(`${API_BASE}/retiro/historial/${id_cuenta}`);
      return {
        ok: response.data.success,
        data: response.data.data
      };
    } catch (error: any) {
      throw error;
    }
  }
};

export default cajeroService;
