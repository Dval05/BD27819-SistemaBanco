import { useState, useEffect } from 'react';
import { cuentaService } from '../services/cuentaService';
import type { Cuenta } from '../types/inversion.types';

export function useCuentas(idPersona: string | null) {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idPersona) return;

    const cargarCuentas = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await cuentaService.getCuentasByPersona(idPersona);
        
        // ✅ ASEGURAR QUE EL SALDO SEA NÚMERO
        const cuentasFormateadas = data
          .filter((cuenta: any) => cuenta.cue_estado === '00')
          .map((cuenta: any) => ({
            ...cuenta,
            cue_saldo_disponible: Number(cuenta.cue_saldo_disponible) || 0
          }));
        
        setCuentas(cuentasFormateadas);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar cuentas');
      } finally {
        setLoading(false);
      }
    };

    cargarCuentas();
  }, [idPersona]);

  return { cuentas, loading, error };
}
