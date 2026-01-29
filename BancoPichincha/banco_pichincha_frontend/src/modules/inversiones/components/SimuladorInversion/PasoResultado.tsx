import React from 'react';
import type { SimulacionInversion } from '../../types/simulador.types';
import styles from './SimuladorInversion.module.css';

interface Props {
  simulacion: SimulacionInversion;
  onContinuar: () => void;
  onVolver: () => void;
}

const PasoResultado: React.FC<Props> = ({ simulacion, onContinuar, onVolver }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className={styles.pasoContainer}>
      <button className={styles.btnVolver} onClick={onVolver}>
        ← Volver
      </button>

      <h2 className={styles.titulo}>Simula tu depósito a plazo</h2>

      <div className={styles.ajusteInfo}>
        <p className={styles.infoText}>
          Ajustamos la fecha de finalización de tu depósito a plazo al{' '}
          <strong>{formatDate(simulacion.fechaVencimiento)}</strong> para que no coincida con feriados o fines
          de semana.
        </p>
      </div>

      <div className={styles.resultadoCard}>
        <div className={styles.resultadoHeader}>
          <p className={styles.plazoDias}>En {simulacion.plazoDias} días | Tasa {simulacion.tasa}%</p>
        </div>
        <p className={styles.gananciasGrande}>Ganas: {formatCurrency(simulacion.interes)}</p>
        <p className={styles.recibirasGrande}>Recibes al final: {formatCurrency(simulacion.montoFinal)}</p>
      </div>

      <button className={styles.btnContinuar} onClick={onContinuar}>
        Continuar
      </button>
    </div>
  );
};

export default PasoResultado;
