import axios from 'axios';
import type { Cliente, LoginResponse, RegistroResponse, Transaccion } from '../types';

const API_URL = 'http://localhost:3000/api/clientes';

interface RegistroData {
  nombre: string;
  cedula: string;
  email: string;
  telefono?: string;
  usuario: string;
  password: string;
}

const clienteService = {
  // Login - inicia sesión y regenera código DEUNA
  login: async (usuario: string, password: string): Promise<LoginResponse> => {
    const response = await axios.post<LoginResponse>(`${API_URL}/login`, { usuario, password });
    return response.data;
  },

  // Registro - crear nueva cuenta
  registro: async (clienteData: RegistroData): Promise<RegistroResponse> => {
    const response = await axios.post<RegistroResponse>(`${API_URL}/registro`, clienteData);
    return response.data;
  },

  // Crear un nuevo cliente
  crearCliente: async (clienteData: Partial<Cliente>): Promise<Cliente> => {
    const response = await axios.post<Cliente>(API_URL, clienteData);
    return response.data;
  },

  // Obtener todos los clientes
  obtenerClientes: async (): Promise<Cliente[]> => {
    const response = await axios.get<Cliente[]>(API_URL);
    return response.data;
  },

  // Obtener un cliente por ID
  obtenerClientePorId: async (id: string): Promise<Cliente> => {
    const response = await axios.get<{ ok: boolean; data: Cliente }>(`${API_URL}/${id}`);
    return response.data.data;
  },

  // Buscar cliente por código DEUNA
  buscarPorCodigo: async (codigo: string): Promise<Cliente> => {
    const response = await axios.get<{ ok: boolean; data: { nombre: string; codigoDeuna: string; _id?: string; usuario?: string } }>(`${API_URL}/codigo/${codigo}`);
    return response.data.data as Cliente;
  },

  // Actualizar un cliente
  actualizarCliente: async (id: string, clienteData: Partial<Cliente>): Promise<Cliente> => {
    const response = await axios.put<Cliente>(`${API_URL}/${id}`, clienteData);
    return response.data;
  },

  // Eliminar un cliente
  eliminarCliente: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
  },

  // Depositar saldo
  depositar: async (id: string, monto: number, descripcion: string = ''): Promise<Cliente> => {
    const response = await axios.post<{ ok: boolean; data: { cliente: Cliente; transaccion: unknown }; msg: string }>(`${API_URL}/${id}/depositar`, { monto, descripcion });
    return response.data.data.cliente;
  },

  // Transferir por código DEUNA
  transferir: async (id: string, codigoDestino: string, monto: number, descripcion: string = ''): Promise<Cliente> => {
    const response = await axios.post<{ ok: boolean; data: { exito: boolean; clienteOrigen: Cliente; clienteDestino: Cliente }; msg: string }>(`${API_URL}/${id}/transferir`, {
      codigoDestino,
      monto,
      descripcion,
    });
    return response.data.data.clienteOrigen;
  },

  // Obtener transacciones de un cliente
  obtenerTransacciones: async (id: string): Promise<Transaccion[]> => {
    const response = await axios.get<{ data: Transaccion[] }>(`${API_URL}/${id}/transacciones`);
    return response.data.data || [];
  },

  // Regenerar código DEUNA
  regenerarCodigo: async (id: string): Promise<Cliente> => {
    const response = await axios.post<{ ok: boolean; data: Cliente; msg: string }>(`${API_URL}/${id}/regenerar-codigo`);
    return response.data.data;
  },

  // Obtener estadísticas
  obtenerEstadisticas: async () => {
    const response = await axios.get(`${API_URL}/estadisticas`);
    return response.data;
  },
};

export default clienteService;
