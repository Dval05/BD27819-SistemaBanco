import React, { useState } from 'react';
import { useInversiones } from '../../hooks/useInversiones';
import { MENSAJES } from '../../constants/inversiones.constants';
import type { Cuenta } from '../../types/inversion.types';
import styles from './ConfirmacionInversion.module.css';

interface Props {
  monto: number;
  plazoDias: number;
  tasa: number;
  interes: number;
  montoFinal: number;
  cuenta: Cuenta;
  onExito: () => void;
  onVolver: () => void;
  onCancelar: () => void;
}

const ConfirmacionInversion: React.FC<Props> = ({
  monto,
  plazoDias,
  tasa,
  interes,
  montoFinal,
  cuenta,
  onExito,
  onVolver,
  onCancelar,
}) => {
  const [procesando, setProcesando] = useState(false);
  const { createInversion } = useInversiones();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleConfirmar = async () => {
    setProcesando(true);

    try {
      await createInversion({
        idCuenta: cuenta.id_cuenta,
        producto: 'DEPOSITO_PLAZO',
        monto,
        plazoDias,
        modalidadInteres: 'AL_VENCIMIENTO',
        renovacionAuto: '01', // No
      });

      alert(MENSAJES.EXITO_CREACION);
      onExito();
    } catch (error: any) {
      alert(error.message || MENSAJES.ERROR_CREACION);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.btnAtras} onClick={onVolver}>
          ← Volver
        </button>
        <button className={styles.btnCerrar} onClick={onCancelar}>
          ✕
        </button>
      </div>

      <h2 className={styles.titulo}>Confirma tu depósito a plazo</h2>

      <div className={styles.resumenCard}>
        <div className={styles.resumenHeader}>
          <h3 className={styles.resumenTitulo}>Resumen de tu inversión</h3>
        </div>

        <div className={styles.resumenDetalle}>
          <div className={styles.detalleItem}>
            <span className={styles.detalleLabel}>Monto a invertir</span>
            <span className={styles.detalleValor}>{formatCurrency(monto)}</span>
          </div>

          <div className={styles.detalleItem}>
            <span className={styles.detalleLabel}>Plazo</span>
            <span className={styles.detalleValor}>{plazoDias} días</span>
          </div>

          <div className={styles.detalleItem}>
            <span className={styles.detalleLabel}>Tasa de interés</span>
            <span className={styles.detalleValor}>{tasa}%</span>
          </div>

          <div className={styles.detalleItem}>
            <span className={styles.detalleLabel}>Intereses ganados</span>
            <span className={`${styles.detalleValor} ${styles.interes}`}>
              {formatCurrency(interes)}
            </span>
          </div>

          <div className={`${styles.detalleItem} ${styles.total}`}>
            <span className={styles.detalleLabel}>Total a recibir</span>
            <span className={styles.detalleValor}>{formatCurrency(montoFinal)}</span>
          </div>
        </div>
      </div>

      <div className={styles.cuentaInfo}>
        <h4 className={styles.cuentaTitulo}>Cuenta seleccionada</h4>
        <div className={styles.cuentaDetalle}>
          <p className={styles.cuentaTipo}>
            {cuenta.tipo === 'ahorro' ? 'Cuenta de Ahorros' : 'Cuenta Corriente'}
          </p>
          <p className={styles.cuentaNumero}>Nro. {cuenta.cue_numero}</p>
        </div>
      </div>

      <div className={styles.infoAdicional}>
        <div className={styles.infoItem}>
          <span className={styles.infoIcono}>ℹ️</span>
          <p className={styles.infoTexto}>
            El dinero se debitará de tu cuenta seleccionada y se creará el depósito a plazo fijo.
          </p>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoIcono}>📅</span>
          <p className={styles.infoTexto}>
            Al vencimiento, recibirás el capital más los intereses en la misma cuenta.
          </p>
        </div>
      </div>

      <button className={styles.btnConfirmar} onClick={handleConfirmar} disabled={procesando}>
        {procesando ? 'Procesando...' : 'Confirmar depósito'}
      </button>

      {/* Confirmación directa sin Clave Digital */}
    </div>
  );
};

export default ConfirmacionInversion;
