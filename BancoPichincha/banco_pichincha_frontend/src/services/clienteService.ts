import axios from 'axios';
import type { Cliente, LoginResponse, RegistroResponse, Transaccion } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface RegistroData {
  cedula: string;
  nombre?: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  email: string;
  telefono?: number;
  usuario: string;
  password: string;
  fechaNacimiento?: string;
}

export interface Cuenta {
  id: string;
  tipo: 'cuenta';
  nombre: string;
  numero: string;
  numeroCompleto: string;
  saldo: number;
  estado: string;
  fechaApertura: string;
}

export interface Tarjeta {
  id: string;
  tipo: 'tarjeta';
  subtipo: 'credito' | 'debito';
  nombre: string;
  marca: string;
  numero: string;
  numeroCompleto: string;
  fechaExpiracion: string;
  estado: string;
  estadoCodigo?: string;
  cvv?: string;
  cupoDisponible: number;
  saldoActual: number;
  fechaCorte?: number;
  fechaMaximaPago?: number;
  pagoMinimo: number;
  tasaInteres: number;
  // Campos para tarjetas de débito
  tipoCuenta?: 'ahorro' | 'corriente';
  numeroCuenta?: string;
  idCuenta?: string;
}

export interface InversionProducto {
  id: string;
  tipo: 'inversion';
  nombre: string;
  monto: number;
  tasaInteres: number;
  plazo: number;
  estado: string;
  fechaInicio: string;
}

export interface Movimiento {
  id: string;
  fecha: string;
  tipo: string;
  tipoDescripcion: string;
  descripcion: string;
  monto: number;
  montoOriginal: number;
  estado: string;
  estadoCodigo: string;
  idCuenta: string;
}

export interface MovimientosResponse {
  success: boolean;
  data: Movimiento[];
  total: number;
}

export interface ProductosResponse {
  ok: boolean;
  data: {
    cuentas: Cuenta[];
    tarjetas: Tarjeta[];
    inversiones: InversionProducto[];
  };
}

const clienteService = {
  login: async (usuario: string, password: string): Promise<LoginResponse> => {
    const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, { usuario, password });
    return response.data;
  },

  registro: async (clienteData: RegistroData): Promise<RegistroResponse> => {
    const response = await axios.post<RegistroResponse>(`${API_URL}/auth/registro`, clienteData);
    return response.data;
  },

  obtenerPerfil: async (id: string): Promise<Cliente> => {
    const response = await axios.get<{ ok: boolean; data: Cliente }>(`${API_URL}/auth/perfil/${id}`);
    return response.data.data;
  },

  obtenerProductos: async (idPersona: string): Promise<ProductosResponse['data']> => {
    const response = await axios.get<ProductosResponse>(`${API_URL}/auth/productos/${idPersona}`);
    return response.data.data;
  },

  obtenerTransacciones: async (idCuenta: string): Promise<Transaccion[]> => {
    const response = await axios.get<{ success: boolean; data: Transaccion[] }>(`${API_URL}/transacciones/cuenta/${idCuenta}`);
    return response.data.data || [];
  },

  obtenerMovimientos: async (idCuenta: string, filtros?: { tipo?: string; fechaInicio?: string; fechaFin?: string }): Promise<Movimiento[]> => {
    const params = new URLSearchParams();
    if (filtros?.tipo && filtros.tipo !== 'todos') {
      params.append('tipo', filtros.tipo);
    }
    if (filtros?.fechaInicio) {
      params.append('fechaInicio', filtros.fechaInicio);
    }
    if (filtros?.fechaFin) {
      params.append('fechaFin', filtros.fechaFin);
    }
    
    const queryString = params.toString();
    const url = `${API_URL}/transacciones/cuenta/${idCuenta}${queryString ? `?${queryString}` : ''}`;
    
    const response = await axios.get<MovimientosResponse>(url);
    return response.data.data || [];
  },

  crearCuentaAhorro: async (idPersona: string): Promise<{ ok: boolean; msg: string; data: Cuenta }> => {
    const response = await axios.post<{ ok: boolean; msg: string; data: any }>(`${API_URL}/cuentas/ahorro`, { idPersona });
    return response.data;
  },

  crearCuentaConTarjeta: async (idPersona: string, tipoCuenta: 'ahorro' | 'corriente'): Promise<{ ok: boolean; msg: string; data: any }> => {
    const response = await axios.post<{ ok: boolean; msg: string; data: any }>(`${API_URL}/cuentas/crear-con-tarjeta`, { 
      idPersona, 
      tipoCuenta 
    });
    return response.data;
  },

  // Métodos para gestión de tarjetas
  obtenerEstadoTarjeta: async (idTarjeta: string): Promise<{ success: boolean; data: any }> => {
    const response = await axios.get<{ success: boolean; data: any }>(`${API_URL}/cajero/tarjeta/estado/${idTarjeta}`);
    return response.data;
  },

  bloquearTarjeta: async (idTarjeta: string, tipoBloqueo: 'temporal' | 'permanente'): Promise<{ success: boolean; message: string }> => {
    const response = await axios.put<{ success: boolean; message: string }>(`${API_URL}/cajero/tarjeta/bloquear/${idTarjeta}`, { tipo_bloqueo: tipoBloqueo });
    return response.data;
  },

  desbloquearTarjeta: async (idTarjeta: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.put<{ success: boolean; message: string }>(`${API_URL}/cajero/tarjeta/desbloquear/${idTarjeta}`);
    return response.data;
  },

  cancelarTarjeta: async (idTarjeta: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.delete<{ success: boolean; message: string }>(`${API_URL}/cajero/tarjeta/cancelar/${idTarjeta}`);
    return response.data;
  },

  // ============================================
  // MÉTODOS DE CONTACTOS
  // ============================================
  
  obtenerContactos: async (clienteId: string): Promise<{ exito: boolean; datos: Contacto[] }> => {
    const response = await axios.get<{ exito: boolean; datos: Contacto[] }>(`${API_URL}/transferencias/contactos/cliente/${clienteId}`);
    return response.data;
  },

  crearContacto: async (clienteId: string, contacto: CrearContactoData): Promise<{ exito: boolean; mensaje: string; datos: Contacto }> => {
    const response = await axios.post<{ exito: boolean; mensaje: string; datos: Contacto }>(`${API_URL}/transferencias/contactos`, {
      idPersona: clienteId,
      ...contacto
    });
    return response.data;
  },

  actualizarContacto: async (idContacto: string, datos: Partial<CrearContactoData>): Promise<{ exito: boolean; mensaje: string; datos: Contacto }> => {
    const response = await axios.put<{ exito: boolean; mensaje: string; datos: Contacto }>(`${API_URL}/transferencias/contactos/${idContacto}`, datos);
    return response.data;
  },

  eliminarContacto: async (idContacto: string): Promise<{ exito: boolean; mensaje: string }> => {
    const response = await axios.delete<{ exito: boolean; mensaje: string }>(`${API_URL}/transferencias/contactos/${idContacto}`);
    return response.data;
  }
};

// Interfaces adicionales para contactos
export interface Contacto {
  id: string;
  alias: string;
  nombreBeneficiario: string;
  tipoIdentificacion: string;
  identificacion: string;
  numeroCuenta: string;
  email: string;
  tipoCuenta: string;
  tipoCuentaDescripcion: string;
  banco?: string;
  bancoNombre?: string;
  esFavorito?: boolean;
}

export interface CrearContactoData {
  conAlias: string;
  conNombreBeneficiario?: string;
  conTipoIdentificacion: string;
  conIdentificacion: string;
  conNumeroCuenta: string;
  conEmail: string;
  conTipoCuenta: string;
  idBanco?: string;
}

export default clienteService;
