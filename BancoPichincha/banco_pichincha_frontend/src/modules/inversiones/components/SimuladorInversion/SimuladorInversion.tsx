import React, { useState, useEffect } from 'react';
import PasoMonto from './PasoMonto';
import PasoPlazo from './PasoPlazo';
import PasoResultado from './PasoResultado';
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

enum Paso {
  MONTO = 1,
  PLAZO = 2,
  RESULTADO = 3,
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
  const [paso, setPaso] = useState<Paso>(Paso.MONTO);
  const [monto, setMonto] = useState(CONFIGURACION.MONTO_MINIMO);
  const [plazoDias, setPlazoDias] = useState(360);

  // Los valores del simulador se reciben desde props (control levantado al padre)

  useEffect(() => {
    if (paso === Paso.PLAZO && monto >= CONFIGURACION.MONTO_MINIMO) {
      cargarRecomendaciones(monto);
    }
  }, [paso, monto]);

  const handleMontoChange = (nuevoMonto: number) => {
    setMonto(nuevoMonto);
  };

  const handleContinuarMonto = () => {
    setPaso(Paso.PLAZO);
  };

  const handlePlazoChange = (nuevoPlazo: number) => {
    setPlazoDias(nuevoPlazo);
  };

  const handleSimular = async () => {
    try {
      await simular(monto, plazoDias);
      setPaso(Paso.RESULTADO);
    } catch (err) {
      // El error ya está manejado por el hook
      console.error(err);
    }
  };

  const handleVolverDesdePlazo = () => {
    setPaso(Paso.MONTO);
  };

  const handleVolverDesdeResultado = () => {
    setPaso(Paso.PLAZO);
  };

  const handleContinuar = () => {
    onSimulacionCompleta(monto, plazoDias);
  };

  return (
    <div className={styles.simuladorContainer}>
      <div className={styles.header}>
        <button className={styles.btnCerrar} onClick={onCancelar}>
          ✕
        </button>
      </div>

      {loading && (
        <div className={styles.loading}>
          <p>Cargando...</p>
        </div>
      )}

      {error && (
        <div className={styles.errorBanner}>
          <p>{error}</p>
        </div>
      )}

      {!loading && (
        <>
          {paso === Paso.MONTO && (
            <PasoMonto monto={monto} onChange={handleMontoChange} onContinuar={handleContinuarMonto} />
          )}

          {paso === Paso.PLAZO && (
            <PasoPlazo
              plazoDias={plazoDias}
              monto={monto}
              recomendaciones={recomendaciones}
              onChange={handlePlazoChange}
              onSimular={handleSimular}
              onVolver={handleVolverDesdePlazo}
            />
          )}

          {paso === Paso.RESULTADO && resultado && (
            <PasoResultado
              simulacion={resultado.simulacion}
              onContinuar={handleContinuar}
              onVolver={handleVolverDesdeResultado}
            />
          )}
        </>
      )}
    </div>
  );
};

export default SimuladorInversion;
