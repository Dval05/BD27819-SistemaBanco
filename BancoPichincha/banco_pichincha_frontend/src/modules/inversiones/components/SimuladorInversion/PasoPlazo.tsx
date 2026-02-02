import React from 'react';
import { CONFIGURACION, MENSAJES, UNIDADES_PLAZO, convertirPlazo } from '../../constants/inversiones.constants';
import type { UnidadPlazo } from '../../constants/inversiones.constants';
import type { RecomendacionPlazo } from '../../types/simulador.types';
import TablaIntereses from '../TablaIntereses/TablaIntereses';
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

  const [mostrarTablaTasas, setMostrarTablaTasas] = React.useState(false);

  return (
    <>
      <div className={styles.pasoContainer}>
        <button className={styles.btnVolver} onClick={onVolver}>
          ← Volver
        </button>

        <h2 className={styles.tituloPlazo}>Simula tu depósito a plazo</h2>

        <div className={styles.montoResumenCard}>
          <p className={styles.labelResumen}>Monto de depósito</p>
          <p className={styles.valorResumen}>{formatCurrency(monto)}</p>
        </div>

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

        <div className={styles.inputPlazoGroup}>
          <label className={styles.labelPlazo}>
            Elige el plazo en {unidad === UNIDADES_PLAZO.MESES ? 'meses' : 'días'}
          </label>
          <input
            type="text"
            className={`${styles.inputPlazoGrande} ${error ? styles.inputError : ''}`}
            value={valor}
            onChange={handleValorChange}
            placeholder={unidad === UNIDADES_PLAZO.MESES ? '12' : '360'}
          />
          {error && <p className={styles.errorPlazo}>{error}</p>}
        </div>

        <div className={styles.linkTasasPlazo}>
          <button className={styles.btnLinkTasas} onClick={() => setMostrarTablaTasas(true)}>
            📊 Revisa nuestras tasas de interés
          </button>
        </div>

        {recomendaciones.length > 0 && (
          <div className={styles.recomendacionesSection}>
            <h3 className={styles.recomendacionesTitulo}>Incrementa el plazo y gana más con estas recomendaciones</h3>
            <div className={styles.recomendacionesList}>
              {recomendaciones.map((rec, index) => (
                <div
                  key={index}
                  className={styles.cardRecomendacion}
                  onClick={() => handleRecomendacionClick(rec)}
                >
                  <input type="radio" className={styles.radioRecomendacion} checked={plazoDias === rec.plazoDias} readOnly />
                  <div className={styles.recomendacionInfo}>
                    <p className={styles.diasTasa}>En {rec.plazoDias} días | Tasa {rec.tasa}%</p>
                    <p className={styles.ganancias}>Ganas: {formatCurrency(rec.interes)}</p>
                    <p className={styles.recibiras}>Recibes al final: {formatCurrency(rec.montoFinal)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.botoneraInferior}>
          <button
            className={styles.btnContinuarMonto}
            onClick={onSimular}
            disabled={plazoDias < CONFIGURACION.PLAZO_MINIMO_DIAS || plazoDias > CONFIGURACION.PLAZO_MAXIMO_DIAS || !!error}
          >
            Continuar
          </button>
        </div>
      </div>

      {mostrarTablaTasas && (
        <div className={styles.modalTasas} onClick={() => setMostrarTablaTasas(false)}>
          <div className={styles.modalTasasContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.btnCerrarModal} onClick={() => setMostrarTablaTasas(false)}>✕</button>
            <TablaIntereses />
            <div className={styles.modalTasasFooter}>
              <button className={styles.btnEntendidoTasas} onClick={() => setMostrarTablaTasas(false)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PasoPlazo;
