import React, { useEffect, useState } from 'react';
import { simuladorService } from '../../services/simuladorService';
import type { TablaTasas, GrupoTasas } from '../../types/simulador.types';
import styles from './TablaIntereses.module.css';

const TablaIntereses: React.FC = () => {
  const [tablaTasas, setTablaTasas] = useState<TablaTasas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarTasas = async () => {
      try {
        const data = await simuladorService.obtenerTablaTasas();
        setTablaTasas(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar tasas');
      } finally {
        setLoading(false);
      }
    };

    cargarTasas();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Cargando tabla de intereses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>Error: {error}</p>
      </div>
    );
  }

  if (!tablaTasas) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.titulo}>Tabla de interés</h2>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thPlazo}>Plazo</th>
              {tablaTasas.rangos[0]?.tasas.map((rango, index) => (
                <th key={index} className={styles.thMonto}>
                  {rango.montoMax
                    ? `De ${formatCurrency(rango.montoMin)} a ${formatCurrency(rango.montoMax)}`
                    : `De ${formatCurrency(rango.montoMin)} en adelante`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tablaTasas.rangos.map((grupo: GrupoTasas, index: number) => (
              <tr key={index}>
                <td className={styles.tdPlazo}>{grupo.label}</td>
                {grupo.tasas.map((rango, idx) => (
                  <td key={idx} className={styles.tdTasa}>
                    {rango.tasa}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.infoAdicional}>
        <button className={styles.btnInfo}>
          El depósito a plazo cuenta con seguro de depósito ▼
        </button>
        <p className={styles.infoTexto}>
          <strong>Nota:</strong> La tasa de interés varía según el monto y plazo elegido.
        </p>
      </div>
    </div>
  );
};

export default TablaIntereses;
