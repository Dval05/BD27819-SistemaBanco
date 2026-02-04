/**
 * CuentaSelector - Selector de cuenta origen
 * Permite al usuario seleccionar desde qué cuenta realizar la transferencia
 */

import React from 'react';
import { CreditCard, ChevronDown, Wallet, Coins } from 'lucide-react';
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

  const obtenerNombreTipoCuenta = (tipo: string): string => {
    if (tipo.includes('CORRIENTE') || tipo === '00') {
      return 'Cuenta Corriente';
    } else if (tipo.includes('AHORROS') || tipo === '01') {
      return 'Cuenta de Ahorros';
    }
    return tipo;
  };

  const obtenerIconoCuenta = (tipo: string) => {
    if (tipo.includes('CORRIENTE') || tipo === '00') {
      return <Wallet size={20} />;
    } else if (tipo.includes('AHORROS') || tipo === '01') {
      return <Coins size={20} />;
    }
    return <CreditCard size={20} />;
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
          {cuentaSeleccionada ? obtenerIconoCuenta(cuentaSeleccionada.tipoCuenta) : <CreditCard size={24} />}
        </div>

        {cuentaSeleccionada ? (
          <div className={styles.cuentaInfo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={styles.tipoCuenta}>{obtenerNombreTipoCuenta(cuentaSeleccionada.tipoCuenta)}</span>
              <span className={`${styles.mainTypeBadge} ${cuentaSeleccionada.tipoCuenta.includes('CORRIENTE') || cuentaSeleccionada.tipoCuenta === '00' ? styles.correinteBadge : styles.ahorrosBadge}`}>
                {cuentaSeleccionada.tipoCuenta.includes('CORRIENTE') || cuentaSeleccionada.tipoCuenta === '00' ? 'CORRIENTE' : 'AHORROS'}
              </span>
            </div>
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
              <div className={`${styles.optionIcon} ${cuenta.tipoCuenta.includes('CORRIENTE') || cuenta.tipoCuenta === '00' ? styles.corriente : styles.ahorros}`}>
                {obtenerIconoCuenta(cuenta.tipoCuenta)}
              </div>
              <div className={styles.optionInfo}>
                <span className={styles.optionTipo}>
                  {obtenerNombreTipoCuenta(cuenta.tipoCuenta)}
                  <span className={`${styles.typeBadge} ${cuenta.tipoCuenta.includes('CORRIENTE') || cuenta.tipoCuenta === '00' ? styles.corriente : styles.ahorros}`}>
                    {cuenta.tipoCuenta.includes('CORRIENTE') || cuenta.tipoCuenta === '00' ? 'CORRIENTE' : 'AHORROS'}
                  </span>
                </span>
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
