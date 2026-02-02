/**
 * NuevoContactoSeleccion - Selección tipo de contacto
 * Permite elegir entre contacto Pichincha u otro banco
 */

import React from 'react';
import { ArrowLeft, Building2, CreditCard } from 'lucide-react';
import type { VistaTransferencia } from '../../types/transferencias.types';
import styles from './NuevoContactoSeleccion.module.css';

interface NuevoContactoSeleccionProps {
  onNavigate: (vista: VistaTransferencia, datos?: any) => void;
  onBack: () => void;
}

const NuevoContactoSeleccion: React.FC<NuevoContactoSeleccionProps> = ({ 
  onNavigate, 
  onBack 
}) => {
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Nuevo contacto</h1>
          <p className={styles.subtitle}>¿A qué banco pertenece la cuenta?</p>
        </div>
      </div>

      {/* Opciones */}
      <div className={styles.options}>
        <button 
          className={styles.optionCard}
          onClick={() => onNavigate('NUEVO_CONTACTO_PICHINCHA')}
        >
          <div className={styles.optionIcon} style={{ background: 'linear-gradient(135deg, #ffc907 0%, #e6b506 100%)' }}>
            <CreditCard size={32} />
          </div>
          <div className={styles.optionContent}>
            <h3 className={styles.optionTitle}>Cuenta Pichincha</h3>
            <p className={styles.optionDescription}>
              Añade un contacto con cuenta en Banco Pichincha. 
              Transferencias inmediatas sin comisión.
            </p>
          </div>
          <div className={styles.badge}>Sin comisión</div>
        </button>

        <button 
          className={styles.optionCard}
          onClick={() => onNavigate('NUEVO_CONTACTO_OTRO_BANCO')}
        >
          <div className={styles.optionIcon} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
            <Building2 size={32} />
          </div>
          <div className={styles.optionContent}>
            <h3 className={styles.optionTitle}>Otro banco</h3>
            <p className={styles.optionDescription}>
              Añade un contacto con cuenta en otro banco del Ecuador. 
              Transferencias interbancarias con comisión de $0.41.
            </p>
          </div>
          <div className={styles.badgeComision}>Comisión $0.41</div>
        </button>
      </div>

      {/* Info adicional */}
      <div className={styles.infoSection}>
        <h4 className={styles.infoTitle}>💡 ¿Sabías que?</h4>
        <ul className={styles.infoList}>
          <li>Las transferencias entre cuentas Pichincha son inmediatas</li>
          <li>Las transferencias interbancarias se procesan en horario bancario</li>
          <li>El límite diario de transferencias es de $15,000.00</li>
        </ul>
      </div>
    </div>
  );
};

export default NuevoContactoSeleccion;
