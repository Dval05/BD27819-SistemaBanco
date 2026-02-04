import React, { useState } from 'react';
import { useInversiones } from '../../hooks/useInversiones';
import { EstadoLabels } from '../../types/inversion.types';
import type { Inversion } from '../../types/inversion.types';
import styles from './ListadoInversiones.module.css';

interface Props {
  idPersona: string;
  onVerDetalle: (inversion: Inversion) => void;
}

const ListadoInversiones: React.FC<Props> = ({ idPersona, onVerDetalle }) => {
  const { inversiones, loading, error, refresh } = useInversiones(idPersona);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Filtrar inversiones por estado Y por persona (doble verificación)
  const inversionesValidadas = inversiones.filter((inv) => {
    const perteneceAPersona = inv.cuenta?.id_persona === idPersona;
    return perteneceAPersona;
  });

  const inversionesFiltradas =
    filtroEstado === 'TODOS'
      ? inversionesValidadas
      : inversionesValidadas.filter((inv) => inv.inv_estado === filtroEstado);

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

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Cargando inversiones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p className={styles.error}>{error}</p>
          <button className={styles.btnReintentar} onClick={refresh}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.titulo}>Mis Inversiones</h2>
        <button className={styles.btnRefresh} onClick={refresh} title="Actualizar">
          🔄
        </button>
      </div>

      <div className={styles.filtros}>
        <button
          className={`${styles.filtroBtn} ${filtroEstado === 'TODOS' ? styles.active : ''}`}
          onClick={() => setFiltroEstado('TODOS')}
        >
          Todos
        </button>
        <button
          className={`${styles.filtroBtn} ${filtroEstado === '00' ? styles.active : ''}`}
          onClick={() => setFiltroEstado('00')}
        >
          Activas
        </button>
        <button
          className={`${styles.filtroBtn} ${filtroEstado === '01' ? styles.active : ''}`}
          onClick={() => setFiltroEstado('01')}
        >
          Vencidas
        </button>
        <button
          className={`${styles.filtroBtn} ${filtroEstado === '02' ? styles.active : ''}`}
          onClick={() => setFiltroEstado('02')}
        >
          Canceladas
        </button>
      </div>

      {inversionesFiltradas.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <p className={styles.emptyText}>
            {filtroEstado === 'TODOS'
              ? 'No tienes inversiones registradas'
              : `No tienes inversiones ${EstadoLabels[filtroEstado]?.toLowerCase()}`}
          </p>
        </div>
      ) : (
        <div className={styles.inversionesList}>
          {inversionesFiltradas.map((inversion) => (
            <div key={inversion.id_inv} className={styles.inversionCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitulo}>
                  <h3 className={styles.producto}>Depósito a Plazo Fijo</h3>
                  <span className={`${styles.badge} ${getEstadoClass(inversion.inv_estado)}`}>
                    {EstadoLabels[inversion.inv_estado]}
                  </span>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Monto invertido</span>
                    <span className={styles.infoValor}>{formatCurrency(inversion.inv_monto)}</span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Plazo</span>
                    <span className={styles.infoValor}>{inversion.inv_plazo_dias} días</span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Tasa de interés</span>
                    <span className={styles.infoValor}>
                      {inversion.inv_tasa_interes || 'N/A'}%
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Fecha de apertura</span>
                    <span className={styles.infoValor}>
                      {formatDate(inversion.inv_fecha_apertura)}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Fecha de vencimiento</span>
                    <span className={styles.infoValor}>
                      {formatDate(inversion.inv_fecha_vencimiento)}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Modalidad</span>
                    <span className={styles.infoValor}>{inversion.inv_modalidad_interes}</span>
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button
                  className={styles.btnVerDetalle}
                  onClick={() => onVerDetalle(inversion)}
                >
                  Ver detalle →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListadoInversiones;
