import { useState, useEffect, useCallback } from 'react';
import type { Inversion, InversionCronograma, CreateInversionDTO } from '../types/inversion.types';
import { inversionService } from '../services/inversionService';

export function useInversiones(idPersona?: string) {
  const [inversiones, setInversiones] = useState<Inversion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInversiones = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('useInversiones - fetchInversiones - idPersona:', idPersona);
      const data = idPersona
        ? await inversionService.getByPersona(idPersona)
        : await inversionService.getAll();
      console.log('useInversiones - data recibida:', data);
      setInversiones(data);
    } catch (err: any) {
      console.error('useInversiones - Error:', err);
      setError(err.response?.data?.message || 'Error al cargar inversiones');
    } finally {
      setLoading(false);
    }
  }, [idPersona]);

  const createInversion = async (data: CreateInversionDTO) => {
    setLoading(true);
    setError(null);

    try {
      const created = await inversionService.create(data);
      setInversiones((prev) => [created, ...prev]);
      return created;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al crear inversión';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const cancelarInversion = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const updated = await inversionService.cancelar(id);
      setInversiones((prev) => prev.map((inv) => (inv.id_inv === id ? updated : inv)));
      return updated;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al cancelar inversión';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInversiones();
  }, [fetchInversiones]);

  return {
    inversiones,
    loading,
    error,
    refresh: fetchInversiones,
    createInversion,
    cancelarInversion,
  };
}

export function useInversionDetail(id: string | null) {
  const [inversion, setInversion] = useState<Inversion | null>(null);
  const [cronogramas, setCronogramas] = useState<InversionCronograma[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [invData, cronData] = await Promise.all([
          inversionService.getById(id),
          inversionService.getCronogramas(id),
        ]);

        setInversion(invData);
        setCronogramas(cronData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar detalle');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { inversion, cronogramas, loading, error };
}
