import { useState, useEffect, useCallback } from 'react';
import type { Inversion, InversionCronograma, CreateInversionDTO } from '../../types/inversion.types';
import { inversionService } from '../../services/inversionService';

export function useInversiones() {
  const [inversiones, setInversiones] = useState<Inversion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInversiones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inversionService.getAll();
      setInversiones(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar inversiones');
    } finally {
      setLoading(false);
    }
  }, []);

  const createInversion = async (data: CreateInversionDTO) => {
    setLoading(true);
    try {
      const created = await inversionService.create(data);
      setInversiones(prev => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear inversión');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelarInversion = async (id: string) => {
    setLoading(true);
    try {
      const updated = await inversionService.updateEstado(id, '02');
      setInversiones(prev => prev.map(inv => inv.id_inv === id ? updated : inv));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar inversión');
      throw err;
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
    cancelarInversion
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
          inversionService.getCronogramas(id)
        ]);
        setInversion(invData);
        setCronogramas(cronData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar detalle');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { inversion, cronogramas, loading, error };
}
