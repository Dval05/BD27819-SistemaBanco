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
  nombre: string;
  numero: string;
  numeroCompleto: string;
  fechaExpiracion: string;
  estado: string;
  saldo: number;
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
  }
};

export default clienteService;
