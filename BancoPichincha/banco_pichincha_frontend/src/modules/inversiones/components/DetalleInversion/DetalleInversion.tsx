import React from 'react';
import type { Inversion } from '../../types/inversion.types';
import { EstadoLabels } from '../../types/inversion.types';
import styles from './DetalleInversion.module.css';

interface Props {
  inversion: Inversion;
  onVolver: () => void;
}

const DetalleInversion: React.FC<Props> = ({ inversion, onVolver }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-EC', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const calcularInteres = () => {
    const monto = parseFloat(inversion.inv_monto.toString());
    let tasa = parseFloat((inversion.inv_tasa_interes || 0).toString());
    
    // Auto-detectar formato: si tasa > 1, está en porcentaje (2.65%), si <= 1, está en decimal (0.0265)
    if (tasa > 1) {
      tasa = tasa / 100; // Convertir porcentaje a decimal
    }
    
    const dias = inversion.inv_plazo_dias;
    return (monto * tasa * dias) / 360;
  };

  const interes = calcularInteres();
  const montoFinal = parseFloat(inversion.inv_monto.toString()) + interes;

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case '00':
        return styles.estadoActiva;
      case '01':
        return styles.estadoVencida;
      case '02':
        return styles.estadoCancelada;
      case '03':
        return styles.estadoRenovada;
      default:
        return '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.btnVolver} onClick={onVolver}>
          ← Volver al listado
        </button>
      </div>

      <div className={styles.contenido}>
        <div className={styles.tituloSection}>
          <h1 className={styles.titulo}>Detalle de inversión</h1>
          <span className={`${styles.badge} ${getEstadoClass(inversion.inv_estado)}`}>
            {EstadoLabels[inversion.inv_estado]}
          </span>
        </div>

        <div className={styles.cardPrincipal}>
          <div className={styles.seccion}>
            <h3 className={styles.seccionTitulo}>Información general</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Producto</span>
                <span className={styles.valor}>Depósito a Plazo Fijo</span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.label}>Número de inversión</span>
                <span className={styles.valor}>{inversion.id_inv}</span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.label}>Cuenta asociada</span>
                <span className={styles.valor}>{inversion.cuenta?.cue_numero || 'N/A'}</span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.label}>Renovación automática</span>
                <span className={styles.valor}>
                  {inversion.inv_renovacion_auto === '00' ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.separador}></div>

          <div className={styles.seccion}>
            <h3 className={styles.seccionTitulo}>Detalles de la inversión</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Monto invertido</span>
                <span className={`${styles.valor} ${styles.monto}`}>
                  {formatCurrency(inversion.inv_monto)}
                </span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.label}>Plazo</span>
                <span className={styles.valor}>{inversion.inv_plazo_dias} días</span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.label}>Tasa de interés</span>
                <span className={styles.valor}>{inversion.inv_tasa_interes || 'N/A'}%</span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.label}>Modalidad de interés</span>
                <span className={styles.valor}>{inversion.inv_modalidad_interes}</span>
              </div>
            </div>
          </div>

          <div className={styles.separador}></div>

          <div className={styles.seccion}>
            <h3 className={styles.seccionTitulo}>Fechas importantes</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Fecha de apertura</span>
                <span className={styles.valor}>{formatDate(inversion.inv_fecha_apertura)}</span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.label}>Fecha de vencimiento</span>
                <span className={styles.valor}>{formatDate(inversion.inv_fecha_vencimiento)}</span>
              </div>
            </div>
          </div>

          <div className={styles.separador}></div>

          <div className={styles.seccion}>
            <h3 className={styles.seccionTitulo}>Rendimiento estimado</h3>
            <div className={styles.resultadoCard}>
              <div className={styles.resultadoItem}>
                <span className={styles.resultadoLabel}>Intereses ganados</span>
                <span className={styles.resultadoValor}>{formatCurrency(interes)}</span>
              </div>
              <div className={styles.resultadoItem}>
                <span className={styles.resultadoLabel}>Total a recibir</span>
                <span className={`${styles.resultadoValor} ${styles.destacado}`}>
                  {formatCurrency(montoFinal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleInversion;
