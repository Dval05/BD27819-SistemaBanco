/**
 * Servicio de Transferencias
 * Consume los endpoints del backend de transferencias
 */

import axios from 'axios';
import type {
  Banco,
  Contacto,
  LimiteTransaccional,
  CrearContactoRequest,
  CrearTransferenciaRequest,
  TransferenciaResponse,
  ValidacionCuentaResponse
} from '../types/transferencias.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BASE_URL = `${API_URL}/transferencias`;

/**
 * Servicio para gestionar transferencias bancarias
 */
export const transferenciasService = {
  // ============================================
  // BANCOS
  // ============================================
  
  /**
   * Obtiene lista de todos los bancos disponibles
   */
  obtenerBancos: async (): Promise<Banco[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/bancos`);
      // Compatibilidad con la respuesta del backend: { exito, mensaje, datos }
      return response.data.datos || response.data.data || response.data || [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Valida si un banco existe y está activo
   */
  validarBanco: async (bancoId: number): Promise<{ valido: boolean; mensaje: string }> => {
    try {
      const response = await axios.get(`${BASE_URL}/bancos/${bancoId}/validar`);
      return response.data;
    } catch (error) {
      return { valido: false, mensaje: 'Error al validar banco' };
    }
  },

  // ============================================
  // CONTACTOS
  // ============================================
  
  /**
   * Obtiene todos los contactos guardados del cliente
   */
  obtenerContactos: async (clienteId: number | string): Promise<Contacto[]> => {
    if (!clienteId) return [];
    try {
      const response = await axios.get(`${BASE_URL}/contactos/cliente/${clienteId}`);
      return response.data.datos || response.data.data || response.data || [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Crea un nuevo contacto
   */
  crearContacto: async (contacto: CrearContactoRequest): Promise<Contacto> => {
    // El backend espera idPersona, no cliId
    const contactoRequest: any = { ...contacto };
    
    // Convertir cliId a idPersona
    if (contactoRequest.cliId !== undefined) {
      contactoRequest.idPersona = contactoRequest.cliId;
      delete contactoRequest.cliId;
    }
    
    // Convertir banId a idBanco
    if (contactoRequest.banId !== undefined) {
      contactoRequest.idBanco = contactoRequest.banId;
      delete contactoRequest.banId;
    }
    
    // Remover SOLO propiedades undefined que son opcionales (no remover campos obligatorios)
    const camposObligatorios = ['idPersona', 'conAlias', 'conNumeroCuenta', 'conEmail', 'conTipoCuenta', 'conTipoIdentificacion', 'conIdentificacion'];
    Object.keys(contactoRequest).forEach(key => {
      // Solo remover undefined si NO es un campo obligatorio
      if (contactoRequest[key] === undefined && !camposObligatorios.includes(key)) {
        delete contactoRequest[key];
      }
    });
    
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(`${BASE_URL}/contactos`, contactoRequest, { headers });
    
    // Transformar respuesta del backend (snake_case) a camelCase
    const contactoData = response.data.data || response.data;
    if (contactoData) {
      return {
        ...contactoData,
        numeroCuenta: contactoData.con_numero_cuenta || contactoData.numeroCuenta,
        nombreBeneficiario: contactoData.con_nombre_beneficiario || contactoData.nombreBeneficiario,
        alias: contactoData.con_alias || contactoData.alias,
        email: contactoData.con_email || contactoData.email,
        tipoCuenta: contactoData.con_tipo_cuenta || contactoData.tipoCuenta,
        tipoIdentificacion: contactoData.con_tipo_identificacion || contactoData.tipoIdentificacion,
        identificacion: contactoData.con_identificacion || contactoData.identificacion,
        banco: contactoData.id_banco || contactoData.banco,
        bancoNombre: contactoData.ban_nombre || contactoData.bancoNombre
      };
    }
    return contactoData;
  },

  /**
   * Elimina (desactiva) un contacto
   */
  eliminarContacto: async (contactoId: number): Promise<{ exito: boolean; mensaje: string }> => {
    try {
      const response = await axios.delete(`${BASE_URL}/contactos/${contactoId}`);
      return response.data;
    } catch (error: any) {
      return {
        exito: false,
        mensaje: error.response?.data?.message || 'Error al eliminar contacto'
      };
    }
  },

  // ============================================
  // LÍMITES TRANSACCIONALES
  // ============================================
  
  /**
   * Obtiene los límites disponibles del cliente
   */
  obtenerLimitesDisponibles: async (idCuenta: number | string): Promise<LimiteTransaccional> => {
    if (!idCuenta) return {
      montoMaximoDiario: 15000,
      montoMaximoTransaccion: 15000,
      cantidadMaximaDiaria: 20,
      disponibleDiario: 15000,
      cantidadDisponible: 20,
      transferenciasHoy: 0
    };
    try {
      // Usar ruta /limites/persona/:idPersona para pasar idPersona en lugar de idCuenta
      const response = await axios.get(`${BASE_URL}/limites/persona/${idCuenta}/disponibles`);
      return response.data.datos || response.data.data || response.data || {
        montoMaximoDiario: 15000,
        montoMaximoTransaccion: 15000,
        cantidadMaximaDiaria: 20,
        disponibleDiario: 15000,
        cantidadDisponible: 20,
        transferenciasHoy: 0
      };
    } catch (error) {
      return {
        montoMaximoDiario: 15000,
        montoMaximoTransaccion: 15000,
        cantidadMaximaDiaria: 20,
        disponibleDiario: 15000,
        cantidadDisponible: 20,
        transferenciasHoy: 0
      };
    }
  },

  /**
   * Valida si un monto cumple con los límites
   */
  validarLimite: async (
    clienteId: number | string,
    monto: number
  ): Promise<{ valido: boolean; mensaje: string; disponible?: number }> => {
    try {
      const response = await axios.post(`${BASE_URL}/limites/validar`, {
        cliId: clienteId,
        monto
      });
      return response.data;

    } catch (error: any) {
      return {
        valido: false,
        mensaje: error.response?.data?.message || 'Error al validar límite'
      };
    }
  },

  // ============================================
  // TRANSFERENCIAS
  // ============================================
  
  /**
   * Crea y ejecuta una transferencia
   */
  crearTransferencia: async (datos: CrearTransferenciaRequest): Promise<TransferenciaResponse> => {
    // Validar datos obligatorios
    console.log('\n=== DEBUG frontend: crearTransferencia ===');
    console.log('1. Datos recibidos en servicio:', JSON.stringify(datos, null, 2));
    
    if (!datos.traCuentaOrigen || !datos.traCuentaDestino || !datos.traMonto || !datos.traTipoTransferencia) {
      console.log('❌ Faltan datos requeridos');
      throw new Error('Faltan datos requeridos para la transferencia');
    }
    
    const url = `${BASE_URL}/crear`;
    console.log('2. URL del POST:', url);
    console.log('3. Payload a enviar:', JSON.stringify(datos, null, 2));
    
    try {
      // Obtener el token del localStorage
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.post(url, datos, { headers });
      console.log('4. Respuesta recibida:', response.status, response.data);
      return response.data.datos || response.data.data || response.data;
    } catch (error: any) {
      console.log('❌ Error en POST:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  /**
   * Obtiene el estado de una transferencia
   */
  obtenerEstadoTransferencia: async (transferenciaId: number): Promise<any> => {
    try {
      const response = await axios.get(`${BASE_URL}/${transferenciaId}/estado`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  /**
   * Obtiene el historial de transferencias del cliente
   */
  obtenerHistorial: async (clienteId: number, pagina = 1, limite = 20): Promise<any> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/historial/${clienteId}?pagina=${pagina}&limite=${limite}`
      );
      return response.data.data || response.data;
    } catch (error) {
      return { transferencias: [], total: 0 };
    }
  },

  // ============================================
  // VALIDACIONES (Pichincha)
  // ============================================
  
  /**
   * Valida una cuenta de Banco Pichincha
   */
  validarCuentaPichincha: async (numeroCuenta: string): Promise<ValidacionCuentaResponse> => {
    try {
      // Limpiar el número de cuenta: solo dígitos
      const cuentaLimpia = (numeroCuenta || '').replace(/\D/g, '').slice(0, 10);
      const response = await axios.post(`${BASE_URL}/validar-cuenta-pichincha`, {
        numeroCuenta: cuentaLimpia
      });
      return response.data.data || response.data;
    } catch (error: any) {
      // Simulación para desarrollo si el endpoint no existe aún
      if (numeroCuenta.length === 10 && /^\d+$/.test(numeroCuenta)) {
        return {
          existe: true,
          nombreTitular: 'Titular Cuenta Demo',
          tipoCuenta: 'Ahorros'
        };
      }
      return {
        existe: false,
        mensaje: 'La cuenta no existe o no pertenece a Banco Pichincha'
      };
    }
  },

  // ============================================
  // LÍMITES TRANSACCIONALES
  // ============================================

  /**
   * Guarda los límites de transferencia para un cliente
   */
  guardarLimites: async (clienteId: number | string, limites: any): Promise<any> => {
    try {
      const url = `${BASE_URL}/limites/guardar`;
      const response = await axios.post(url, {
        idPersona: clienteId,
        montoMaximoDiario: limites.montoMaximoDiario,
        montoMaximoTransaccion: limites.montoMaximoTransaccion,
        cantidadMaximaDiaria: limites.cantidadMaximaDiaria
      });
      return response.data;
    } catch (error: any) {
      console.error('Error al guardar límites:', error);
      throw error;
    }  }
};

export default transferenciasService;