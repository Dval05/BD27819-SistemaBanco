import React from 'react';
import { CONFIGURACION, MENSAJES, UNIDADES_PLAZO, convertirPlazo } from '../../constants/inversiones.constants';
import type { UnidadPlazo } from '../../constants/inversiones.constants';
import type { RecomendacionPlazo } from '../../types/simulador.types';
import TablaIntereses from '../TablaIntereses/TablaIntereses';
import styles from './SimuladorInversion.module.css';

interface Props {
  monto: number;
  plazoDias: number;
  recomendaciones: RecomendacionPlazo[];
  onMontoChange: (monto: number) => void;
  onPlazoChange: (dias: number) => void;
  onSimular: () => void;
  onContinuar: () => void;
  resultado: any | null;
  loading: boolean;
}

const PasoMonto: React.FC<Props> = ({ monto, plazoDias, recomendaciones, onMontoChange, onPlazoChange, onSimular, onContinuar, resultado, loading }) => {
  const [valorInputMonto, setValorInputMonto] = React.useState(monto.toString());
  const [errorMonto, setErrorMonto] = React.useState<string | null>(null);
  const [mostrarTablaTasas, setMostrarTablaTasas] = React.useState(false);
  
  const [unidad, setUnidad] = React.useState<UnidadPlazo>(UNIDADES_PLAZO.MESES);
  const [valorPlazo, setValorPlazo] = React.useState(convertirPlazo.diasAMeses(plazoDias).toString());
  const [errorPlazo, setErrorPlazo] = React.useState<string | null>(null);

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setValorInputMonto(value);
    
    const numValue = parseFloat(value) || 0;
    onMontoChange(numValue);

    if (numValue > 0 && numValue < CONFIGURACION.MONTO_MINIMO) {
      setErrorMonto(MENSAJES.MONTO_MINIMO);
    } else if (numValue > CONFIGURACION.MONTO_MAXIMO) {
      setErrorMonto(`El máximo es $${CONFIGURACION.MONTO_MAXIMO.toLocaleString()}`);
    } else {
      setErrorMonto(null);
    }
  };

  const handleUnidadChange = (nuevaUnidad: UnidadPlazo) => {
    setUnidad(nuevaUnidad);
    
    if (nuevaUnidad === UNIDADES_PLAZO.MESES) {
      const meses = convertirPlazo.diasAMeses(plazoDias);
      setValorPlazo(meses.toString());
    } else {
      setValorPlazo(plazoDias.toString());
    }
  };

  const handlePlazoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/[^0-9]/g, '');
    setValorPlazo(inputValue);

    const numValue = parseInt(inputValue) || 0;
    const dias = unidad === UNIDADES_PLAZO.MESES 
      ? convertirPlazo.mesesADias(numValue)
      : numValue;

    onPlazoChange(dias);

    // Validar según la unidad seleccionada
    if (unidad === UNIDADES_PLAZO.MESES) {
      if (numValue > 0 && numValue < CONFIGURACION.PLAZO_MINIMO_MESES) {
        setErrorPlazo(`Escribe un valor entre ${CONFIGURACION.PLAZO_MINIMO_MESES} y ${CONFIGURACION.PLAZO_MAXIMO_MESES} meses`);
      } else if (numValue > CONFIGURACION.PLAZO_MAXIMO_MESES) {
        setErrorPlazo(`El máximo es ${CONFIGURACION.PLAZO_MAXIMO_MESES} meses`);
      } else {
        setErrorPlazo(null);
      }
    } else {
      if (numValue > 0 && numValue < CONFIGURACION.PLAZO_MINIMO_DIAS) {
        setErrorPlazo(`Escribe un valor entre ${CONFIGURACION.PLAZO_MINIMO_DIAS} y ${CONFIGURACION.PLAZO_MAXIMO_DIAS} días`);
      } else if (numValue > CONFIGURACION.PLAZO_MAXIMO_DIAS) {
        setErrorPlazo(`El máximo es ${CONFIGURACION.PLAZO_MAXIMO_DIAS} días`);
      } else {
        setErrorPlazo(null);
      }
    }
  };

  const handleRecomendacionClick = (rec: RecomendacionPlazo) => {
    onPlazoChange(rec.plazoDias);
    setUnidad(UNIDADES_PLAZO.DIAS);
    setValorPlazo(rec.plazoDias.toString());
  };

  const formatDisplay = (value: string) => {
    if (!value) return '';
    return parseFloat(value).toLocaleString('en-US');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const puedeSimular = monto >= CONFIGURACION.MONTO_MINIMO && 
                       monto <= CONFIGURACION.MONTO_MAXIMO && 
                       plazoDias >= CONFIGURACION.PLAZO_MINIMO_DIAS && 
                       plazoDias <= CONFIGURACION.PLAZO_MAXIMO_DIAS &&
                       !errorMonto && !errorPlazo;

  // Filtrar recomendaciones para mostrar solo las que tienen un plazo mayor al actual
  const recomendacionesFiltradas = recomendaciones.filter(rec => rec.plazoDias > plazoDias);

  return (
    <>
      <div className={styles.pasoContainer}>
        <h2 className={styles.tituloMonto}>Monto de depósito</h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '60px', marginBottom: '20px' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: '500', color: '#1a1a2e' }}>$</span>
          <input
            id="inputMonto"
            type="text"
            className={styles.montoInputVisible}
            value={valorInputMonto}
            onChange={handleMontoChange}
            placeholder="0"
          />
        </div>

        <p className={styles.ayudaMonto}>
          Ingresa un monto entre $ {CONFIGURACION.MONTO_MINIMO.toLocaleString()} y $ {CONFIGURACION.MONTO_MAXIMO.toLocaleString()}
        </p>

        {errorMonto && <p className={styles.errorMonto}>{errorMonto}</p>}

        <div className={styles.linkTasas}>
          <button className={styles.btnLinkTasas} onClick={() => setMostrarTablaTasas(true)}>
            📊 Revisa nuestras tasas de interés
          </button>
        </div>

        {/* Sección de Plazo */}
        <div className={styles.separador}></div>
        
        <h3 className={styles.subtituloPlazo}>Plazo del depósito</h3>

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
            className={`${styles.inputPlazoGrande} ${errorPlazo ? styles.inputError : ''}`}
            value={valorPlazo}
            onChange={handlePlazoChange}
            placeholder={unidad === UNIDADES_PLAZO.MESES ? '1' : '31'}
          />
          {errorPlazo && <p className={styles.errorPlazo}>{errorPlazo}</p>}
        </div>

        {/* Resultado de simulación */}
        {resultado && (
          <div className={styles.resultadoSimulacion}>
            <h3 className={styles.resultadoTitulo}>El resultado de tu simulación:</h3>
            <div className={styles.infoSimulacion}>
              <p className={styles.infoTexto}>
                Ajustamos la fecha de finalización de tu depósito a plazo al{' '}
                <strong>{new Date(resultado.simulacion.fechaVencimiento).toLocaleDateString('es-EC')}</strong>{' '}
                para que no coincida con feriados o fines de semana.
              </p>
            </div>

            <div className={styles.resultadoCard}>
              <p className={styles.diasTasa}>
                En {unidad === UNIDADES_PLAZO.MESES ? `${convertirPlazo.diasAMeses(resultado.simulacion.plazoDias)} ${convertirPlazo.diasAMeses(resultado.simulacion.plazoDias) === 1 ? 'mes' : 'meses'}` : `${resultado.simulacion.plazoDias} días`} | Tasa {resultado.simulacion.tasa}%
              </p>
              <p className={styles.ganancias}>Ganas: {formatCurrency(resultado.simulacion.interes)}</p>
              <p className={styles.recibiras}>Recibes al final: {formatCurrency(resultado.simulacion.montoFinal)}</p>
              <p className={styles.fechaVencimiento}>
                Recibirás tu dinero el: <strong>{new Date(resultado.simulacion.fechaVencimiento).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Recomendaciones */}
        {recomendacionesFiltradas.length > 0 && (
          <div className={styles.recomendacionesSection}>
            <h3 className={styles.recomendacionesTitulo}>Incrementa el plazo y gana más con estas recomendaciones</h3>
            <div className={styles.recomendacionesList}>
              {recomendacionesFiltradas.map((rec, index) => (
                <div
                  key={index}
                  className={styles.cardRecomendacion}
                  onClick={() => handleRecomendacionClick(rec)}
                >
                  <input type="radio" className={styles.radioRecomendacion} checked={plazoDias === rec.plazoDias} readOnly />
                  <div className={styles.recomendacionInfo}>
                    <p className={styles.diasTasa}>
                      En {unidad === UNIDADES_PLAZO.MESES ? `${convertirPlazo.diasAMeses(rec.plazoDias)} ${convertirPlazo.diasAMeses(rec.plazoDias) === 1 ? 'mes' : 'meses'}` : `${rec.plazoDias} días`} | Tasa {rec.tasa}%
                    </p>
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
            onClick={onContinuar}
            disabled={!puedeSimular || loading || !resultado}
          >
            {loading ? 'Simulando...' : 'Continuar'}
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

export default PasoMonto;
