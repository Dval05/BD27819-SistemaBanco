/**
 * CuentaSelector - Selector de cuenta origen
 * Permite al usuario seleccionar desde qué cuenta realizar la transferencia
 */

import React from 'react';
import { CreditCard, ChevronDown } from 'lucide-react';
import type { Cuenta } from '../../types/transferencias.types';
import styles from './CuentaSelector.module.css';

interface CuentaSelectorProps {
  cuentas: Cuenta[];
  cuentaSeleccionada: Cuenta | null;
  onSelect: (cuenta: Cuenta) => void;
  disabled?: boolean;
}

const CuentaSelector: React.FC<CuentaSelectorProps> = ({
  cuentas,
  cuentaSeleccionada,
  onSelect,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const formatearSaldo = (saldo: number): string => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(saldo);
  };

  const formatearCuenta = (cuenta: string): string => {
    return cuenta.replace(/(\d{4})(\d{4})(\d{2})/, '$1-$2-$3');
  };

  const handleSelect = (cuenta: Cuenta) => {
    onSelect(cuenta);
    setIsOpen(false);
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>Cuenta origen</label>
      
      <div 
        className={`${styles.selector} ${disabled ? styles.disabled : ''} ${isOpen ? styles.open : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className={styles.iconContainer}>
          <CreditCard size={24} />
        </div>

        {cuentaSeleccionada ? (
          <div className={styles.cuentaInfo}>
            <span className={styles.tipoCuenta}>{cuentaSeleccionada.tipoCuenta}</span>
            <span className={styles.numeroCuenta}>
              {formatearCuenta(cuentaSeleccionada.numeroCuenta)}
            </span>
            <span className={styles.saldo}>
              Disponible: {formatearSaldo(cuentaSeleccionada.saldoDisponible)}
            </span>
          </div>
        ) : (
          <span className={styles.placeholder}>Selecciona una cuenta</span>
        )}

        <ChevronDown 
          size={20} 
          className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`} 
        />
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          {cuentas.map((cuenta) => (
            <div
              key={cuenta.id}
              className={`${styles.option} ${cuentaSeleccionada?.id === cuenta.id ? styles.selected : ''}`}
              onClick={() => handleSelect(cuenta)}
            >
              <div className={styles.optionIcon}>
                <CreditCard size={20} />
              </div>
              <div className={styles.optionInfo}>
                <span className={styles.optionTipo}>{cuenta.tipoCuenta}</span>
                <span className={styles.optionNumero}>
                  {formatearCuenta(cuenta.numeroCuenta)}
                </span>
              </div>
              <span className={styles.optionSaldo}>
                {formatearSaldo(cuenta.saldoDisponible)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CuentaSelector;
