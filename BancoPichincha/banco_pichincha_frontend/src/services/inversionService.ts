import type { Inversion, InversionCronograma, InversionMovimiento, CreateInversionDTO } from '../types/inversion.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const inversionService = {
  async getAll(): Promise<Inversion[]> {
    const response = await fetch(`${API_URL}/inversiones`);
    const result: ApiResponse<Inversion[]> = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },

  async getById(id: string): Promise<Inversion> {
    const response = await fetch(`${API_URL}/inversiones/${id}`);
    const result: ApiResponse<Inversion> = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },

  async getByCuenta(idCuenta: string): Promise<Inversion[]> {
    const response = await fetch(`${API_URL}/inversiones/cuenta/${idCuenta}`);
    const result: ApiResponse<Inversion[]> = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },

  async create(data: CreateInversionDTO): Promise<Inversion> {
    const response = await fetch(`${API_URL}/inversiones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result: ApiResponse<Inversion> = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },

  async update(id: string, data: Partial<CreateInversionDTO>): Promise<Inversion> {
    const response = await fetch(`${API_URL}/inversiones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result: ApiResponse<Inversion> = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },

  async updateEstado(id: string, estado: string): Promise<Inversion> {
    const response = await fetch(`${API_URL}/inversiones/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    });
    const result: ApiResponse<Inversion> = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/inversiones/${id}`, {
      method: 'DELETE'
    });
    const result: ApiResponse<null> = await response.json();
    if (!result.success) throw new Error(result.message);
  },

  async getCronogramas(idInv: string): Promise<InversionCronograma[]> {
    const response = await fetch(`${API_URL}/inversiones/${idInv}/cronogramas`);
    const result: ApiResponse<InversionCronograma[]> = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },

  async getMovimientos(idInv: string): Promise<InversionMovimiento[]> {
    const response = await fetch(`${API_URL}/inversiones/${idInv}/movimientos`);
    const result: ApiResponse<InversionMovimiento[]> = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  }
};
