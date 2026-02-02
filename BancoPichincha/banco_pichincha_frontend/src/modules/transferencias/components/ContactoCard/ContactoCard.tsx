/**
 * ContactoCard - Componente de tarjeta de contacto
 * Muestra información de un contacto guardado
 */

import React from 'react';
import { User, Building2, ChevronRight } from 'lucide-react';
import type { Contacto } from '../../types/transferencias.types';
import styles from './ContactoCard.module.css';

interface ContactoCardProps {
  contacto: Contacto;
  onClick: (contacto: Contacto) => void;
}

const ContactoCard: React.FC<ContactoCardProps> = ({ contacto, onClick }) => {
  const formatearCuenta = (cuenta: string): string => {
    if (!cuenta) return '';
    return `****${cuenta.slice(-4)}`;
  };

  const esInterbancario = contacto.banco !== null;

  return (
    <div className={styles.card} onClick={() => onClick(contacto)}>
      <div className={styles.avatar}>
        {esInterbancario ? (
          <Building2 size={24} />
        ) : (
          <User size={24} />
        )}
      </div>
      
      <div className={styles.info}>
        <h4 className={styles.alias}>{contacto.alias || contacto.nombreBeneficiario}</h4>
        <p className={styles.nombre}>{contacto.nombreBeneficiario}</p>
        <div className={styles.detalles}>
          <span className={styles.cuenta}>{formatearCuenta(contacto.numeroCuenta)}</span>
          <span className={styles.separador}>•</span>
          <span className={styles.banco}>
            {esInterbancario ? contacto.bancoNombre || 'Otro banco' : 'Banco Pichincha'}
          </span>
        </div>
      </div>

      <div className={styles.arrow}>
        <ChevronRight size={20} />
      </div>
    </div>
  );
};

export default ContactoCard;
