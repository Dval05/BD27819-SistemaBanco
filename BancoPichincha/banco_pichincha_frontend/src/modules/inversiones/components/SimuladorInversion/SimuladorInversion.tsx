import React, { useState, useEffect } from 'react';
import PasoMonto from './PasoMonto';
import { CONFIGURACION } from '../../constants/inversiones.constants';
import styles from './SimuladorInversion.module.css';

interface Props {
  onSimulacionCompleta: (monto: number, plazoDias: number) => void;
  onCancelar: () => void;
  // Simulador control desde el padre
  resultado: any | null;
  recomendaciones: any[];
  loading: boolean;
  error: string | null;
  simular: (monto: number, plazoDias: number) => Promise<any>;
  cargarRecomendaciones: (monto: number) => Promise<any>;
}

const SimuladorInversion: React.FC<Props> = ({
  onSimulacionCompleta,
  onCancelar,
  resultado,
  recomendaciones,
  loading,
  error,
  simular,
  cargarRecomendaciones,
}) => {
  const [monto, setMonto] = useState(CONFIGURACION.MONTO_MINIMO);
  const [plazoDias, setPlazoDias] = useState(360);

  useEffect(() => {
    if (monto >= CONFIGURACION.MONTO_MINIMO) {
      cargarRecomendaciones(monto);
    }
  }, [monto]);

  // Auto-simular cuando monto y plazo son válidos
  useEffect(() => {
    const timerSimular = setTimeout(() => {
      if (monto >= CONFIGURACION.MONTO_MINIMO && 
          monto <= CONFIGURACION.MONTO_MAXIMO &&
          plazoDias >= CONFIGURACION.PLAZO_MINIMO_DIAS && 
          plazoDias <= CONFIGURACION.PLAZO_MAXIMO_DIAS) {
        simular(monto, plazoDias);
      }
    }, 500);

    return () => clearTimeout(timerSimular);
  }, [monto, plazoDias]);

  const handleMontoChange = (nuevoMonto: number) => {
    setMonto(nuevoMonto);
  };

  const handlePlazoChange = (nuevoPlazo: number) => {
    setPlazoDias(nuevoPlazo);
  };

  const handleSimular = async () => {
    try {
      await simular(monto, plazoDias);
      // Ya no cambiamos de paso, el resultado se muestra en el mismo componente
    } catch (err) {
      // Error silencioso
    }
  };

  const handleContinuar = () => {
    onSimulacionCompleta(monto, plazoDias);
  };

  return (
    <div className={styles.simuladorContainer}>
      <div className={styles.header}>
        <h1 className={styles.headerTitulo}>Simula tu depósito a plazo</h1>
        <button className={styles.btnCerrar} onClick={onCancelar}>
          ←
        </button>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <p>{error}</p>
        </div>
      )}

      <PasoMonto
        monto={monto}
        plazoDias={plazoDias}
        recomendaciones={recomendaciones}
        onMontoChange={handleMontoChange}
        onPlazoChange={handlePlazoChange}
        onSimular={handleSimular}
        onContinuar={handleContinuar}
        resultado={resultado}
        loading={loading}
      />
    </div>
  );
};

export default SimuladorInversion;
