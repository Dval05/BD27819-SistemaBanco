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
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error al obtener bancos:', error);
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
      console.error('Error al validar banco:', error);
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
    try {
      const response = await axios.get(`${BASE_URL}/contactos/cliente/${clienteId}`);
      return response.data.datos || response.data.data || response.data || [];
    } catch (error) {
      console.error('Error al obtener contactos:', error);
      return [];
    }
  },

  /**
   * Crea un nuevo contacto
   */
  crearContacto: async (contacto: CrearContactoRequest): Promise<Contacto> => {
    const response = await axios.post(`${BASE_URL}/contactos`, contacto);
    return response.data.data || response.data;
  },

  /**
   * Elimina (desactiva) un contacto
   */
  eliminarContacto: async (contactoId: number): Promise<{ exito: boolean; mensaje: string }> => {
    try {
      const response = await axios.delete(`${BASE_URL}/contactos/${contactoId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error al eliminar contacto:', error);
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
  obtenerLimitesDisponibles: async (clienteId: number | string): Promise<LimiteTransaccional> => {
    try {
      const response = await axios.get(`${BASE_URL}/limites/${clienteId}/disponible`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error al obtener límites:', error);
      // Retornar límites por defecto si falla
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
      console.error('Error al validar límite:', error);
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
    const response = await axios.post(`${BASE_URL}/crear`, datos);
    return response.data.data || response.data;
  },

  /**
   * Obtiene el estado de una transferencia
   */
  obtenerEstadoTransferencia: async (transferenciaId: number): Promise<any> => {
    try {
      const response = await axios.get(`${BASE_URL}/${transferenciaId}/estado`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estado:', error);
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
      console.error('Error al obtener historial:', error);
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
      const response = await axios.post(`${BASE_URL}/validar-cuenta-pichincha`, {
        numeroCuenta
      });
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Error al validar cuenta:', error);
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
  }
};

export default transferenciasService;

