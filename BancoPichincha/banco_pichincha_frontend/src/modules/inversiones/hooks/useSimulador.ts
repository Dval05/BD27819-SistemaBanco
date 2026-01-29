import { useState } from 'react';
import { simuladorService } from '../services/simuladorService';
import type { ResultadoSimulacion, RecomendacionPlazo } from '../types/simulador.types';

export function useSimulador() {
  const [resultado, setResultado] = useState<ResultadoSimulacion | null>(null);
  const [recomendaciones, setRecomendaciones] = useState<RecomendacionPlazo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simular = async (monto: number, plazoDias: number) => {
    setLoading(true);
    setError(null);

    try {
      const data = await simuladorService.simular(monto, plazoDias);
      setResultado(data);
      return data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al simular inversión';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const cargarRecomendaciones = async (monto: number) => {
    setLoading(true);
    setError(null);

    try {
      const data = await simuladorService.obtenerRecomendaciones(monto);
      setRecomendaciones(data);
      return data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al cargar recomendaciones';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const limpiar = () => {
    setResultado(null);
    setRecomendaciones([]);
    setError(null);
  };

  return {
    resultado,
    recomendaciones,
    loading,
    error,
    simular,
    cargarRecomendaciones,
    limpiar,
  };
}
