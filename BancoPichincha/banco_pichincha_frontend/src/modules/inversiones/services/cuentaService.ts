import axios from 'axios';
import type { Cuenta } from '../types/inversion.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class CuentaService {
  async getCuentasByPersona(idPersona: string): Promise<Cuenta[]> {
    const response = await axios.get(`${API_URL}/cuentas/persona/${idPersona}`);
    return response.data.data;
  }

  async getCuentaById(idCuenta: string): Promise<Cuenta> {
    const response = await axios.get(`${API_URL}/cuentas/${idCuenta}`);
    return response.data.data;
  }
}

export const cuentaService = new CuentaService();
