import axios from 'axios';
import type { Inversion, InversionCronograma, CreateInversionDTO } from '../types/inversion.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class InversionService {
  async getAll(): Promise<Inversion[]> {
    const response = await axios.get(`${API_URL}/inversiones`);
    return response.data.data;
  }

  async getById(id: string): Promise<Inversion> {
    const response = await axios.get(`${API_URL}/inversiones/${id}`);
    return response.data.data;
  }

  async getByCuenta(idCuenta: string): Promise<Inversion[]> {
    const response = await axios.get(`${API_URL}/inversiones/cuenta/${idCuenta}`);
    return response.data.data;
  }

  async getByPersona(idPersona: string): Promise<Inversion[]> {
    const response = await axios.get(`${API_URL}/inversiones/persona/${idPersona}`);
    return response.data.data;
  }

  async create(data: CreateInversionDTO): Promise<Inversion> {
    const response = await axios.post(`${API_URL}/inversiones`, data);
    return response.data.data;
  }

  async updateEstado(id: string, estado: string): Promise<Inversion> {
    const response = await axios.patch(`${API_URL}/inversiones/${id}/estado`, { estado });
    return response.data.data;
  }

  async cancelar(id: string): Promise<Inversion> {
    const response = await axios.post(`${API_URL}/inversiones/${id}/cancelar`);
    return response.data.data;
  }

  async getCronogramas(idInversion: string): Promise<InversionCronograma[]> {
    const response = await axios.get(`${API_URL}/inversiones/${idInversion}/cronogramas`);
    return response.data.data;
  }
}

export const inversionService = new InversionService();
