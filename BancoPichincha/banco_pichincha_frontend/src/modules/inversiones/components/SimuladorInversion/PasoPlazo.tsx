import React from 'react';
import { CONFIGURACION, MENSAJES, UNIDADES_PLAZO, convertirPlazo } from '../../constants/inversiones.constants';
import type { UnidadPlazo } from '../../constants/inversiones.constants';
import type { RecomendacionPlazo } from '../../types/simulador.types';
import styles from './SimuladorInversion.module.css';

interface Props {
  plazoDias: number;
  monto: number;
  recomendaciones: RecomendacionPlazo[];
  onChange: (dias: number) => void;
  onSimular: () => void;
  onVolver: () => void;
}

const PasoPlazo: React.FC<Props> = ({ plazoDias, monto, recomendaciones, onChange, onSimular, onVolver }) => {
  const [unidad, setUnidad] = React.useState<UnidadPlazo>(UNIDADES_PLAZO.MESES);
  const [valor, setValor] = React.useState(convertirPlazo.diasAMeses(plazoDias).toString());
  const [error, setError] = React.useState<string | null>(null);

  const handleUnidadChange = (nuevaUnidad: UnidadPlazo) => {
    setUnidad(nuevaUnidad);
    
    if (nuevaUnidad === UNIDADES_PLAZO.MESES) {
      const meses = convertirPlazo.diasAMeses(plazoDias);
      setValor(meses.toString());
    } else {
      setValor(plazoDias.toString());
    }
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/[^0-9]/g, '');
    setValor(inputValue);

    const numValue = parseInt(inputValue) || 0;
    const dias = unidad === UNIDADES_PLAZO.MESES 
      ? convertirPlazo.mesesADias(numValue)
      : numValue;

    onChange(dias);

    if (dias > 0 && dias < CONFIGURACION.PLAZO_MINIMO_DIAS) {
      setError(MENSAJES.PLAZO_MINIMO);
    } else if (dias > CONFIGURACION.PLAZO_MAXIMO_DIAS) {
      setError(`El máximo es ${CONFIGURACION.PLAZO_MAXIMO_DIAS} días`);
    } else {
      setError(null);
    }
  };

  const handleRecomendacionClick = (rec: RecomendacionPlazo) => {
    onChange(rec.plazoDias);
    setUnidad(UNIDADES_PLAZO.DIAS);
    setValor(rec.plazoDias.toString());
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className={styles.pasoContainer}>
      <button className={styles.btnVolver} onClick={onVolver}>
        ← Volver
      </button>

      <h2 className={styles.titulo}>Simula tu depósito a plazo</h2>

      <div className={styles.montoResumen}>
        <p className={styles.label}>Monto de depósito</p>
        <p className={styles.valorGrande}>{formatCurrency(monto)}</p>
      </div>

      {recomendaciones.length > 0 && (
        <div className={styles.recomendaciones}>
          <p className={styles.subtitulo}>Incrementa el plazo y gana más con estas recomendaciones</p>

          {recomendaciones.map((rec, index) => (
            <button
              key={index}
              className={styles.cardRecomendacion}
              onClick={() => handleRecomendacionClick(rec)}
            >
              <div className={styles.recomendacionInfo}>
                <p className={styles.plazoDias}>En {rec.plazoDias} días | Tasa {rec.tasa}%</p>
                <p className={styles.ganancias}>Ganas: {formatCurrency(rec.interes)}</p>
                <p className={styles.recibiras}>Recibes al final: {formatCurrency(rec.montoFinal)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className={styles.plazoSection}>
        <h3 className={styles.subtitulo}>Plazo del depósito</h3>

        <div className={styles.toggleUnidad}>
          <button
            className={`${styles.btnToggle} ${unidad === UNIDADES_PLAZO.MESES ? styles.active : ''}`}
            onClick={() => handleUnidadChange(UNIDADES_PLAZO.MESES)}
          >
            Meses
          </button>
          <button
            className={`${styles.btnToggle} ${unidad === UNIDADES_PLAZO.DIAS ? styles.active : ''}`}
            onClick={() => handleUnidadChange(UNIDADES_PLAZO.DIAS)}
          >
            Días
          </button>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>
            {unidad === UNIDADES_PLAZO.MESES ? 'Elige el plazo en meses' : 'Elige el plazo en días'}
          </label>
          <input
            type="text"
            className={styles.inputPlazo}
            value={valor}
            onChange={handleValorChange}
            placeholder={unidad === UNIDADES_PLAZO.MESES ? '12' : '360'}
          />
          {error && <p className={styles.errorInline}>{error}</p>}
        </div>
      </div>

      <button
        className={styles.btnContinuar}
        onClick={onSimular}
        disabled={plazoDias < CONFIGURACION.PLAZO_MINIMO_DIAS || plazoDias > CONFIGURACION.PLAZO_MAXIMO_DIAS}
      >
        Simular
      </button>
    </div>
  );
};

export default PasoPlazo;
