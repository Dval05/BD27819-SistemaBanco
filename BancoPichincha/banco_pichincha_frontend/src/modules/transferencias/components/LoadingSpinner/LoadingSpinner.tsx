/**
 * LoadingSpinner - Componente de carga
 * Muestra un spinner animado durante operaciones asíncronas
 */

import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  message 
}) => {
  return (
    <div className={styles.container}>
      <div className={`${styles.spinner} ${styles[size]}`}>
        <div className={styles.ring}></div>
        <div className={styles.ring}></div>
        <div className={styles.ring}></div>
      </div>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
