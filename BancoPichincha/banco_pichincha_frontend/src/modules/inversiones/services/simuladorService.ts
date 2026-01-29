import axios from 'axios';
import type { ResultadoSimulacion, RecomendacionPlazo, TablaTasas } from '../types/simulador.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class SimuladorService {
  async simular(monto: number, plazoDias: number): Promise<ResultadoSimulacion> {
    const response = await axios.post(`${API_URL}/inversiones/simular`, {
      monto,
      plazoDias,
    });
    return response.data.data;
  }

  async obtenerRecomendaciones(monto: number): Promise<RecomendacionPlazo[]> {
    const response = await axios.get(`${API_URL}/inversiones/recomendaciones`, {
      params: { monto },
    });
    return response.data.data;
  }

  async obtenerTablaTasas(): Promise<TablaTasas> {
    const response = await axios.get(`${API_URL}/inversiones/tasas`);
    return response.data.data;
  }
}

export const simuladorService = new SimuladorService();
