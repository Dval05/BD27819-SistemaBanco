import React, { useState, useEffect } from 'react';
import { useCuentas } from '../../hooks/useCuentas';
import { MENSAJES } from '../../constants/inversiones.constants';
import type { Cuenta } from '../../types/inversion.types';
import styles from './SeleccionCuenta.module.css';

interface Props {
  idPersona: string;
  montoRequerido: number;
  onCuentaSeleccionada: (cuenta: Cuenta) => void;
  onVolver: () => void;
  onCancelar: () => void;
}

const SeleccionCuenta: React.FC<Props> = ({ 
  idPersona, 
  montoRequerido, 
  onCuentaSeleccionada, 
  onVolver,
  onCancelar 
}) => {
  const { cuentas, loading, error } = useCuentas(idPersona);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<Cuenta | null>(null);
  const [errorSaldo, setErrorSaldo] = useState<string | null>(null);

  // ✅ DEBUG: Ver qué datos llegan
  useEffect(() => {
    console.log('=== DEBUG SELECCIÓN CUENTA ===');
    console.log('Monto requerido:', montoRequerido, typeof montoRequerido);
    console.log('Cuentas cargadas:', cuentas.length);
    cuentas.forEach((cuenta, index) => {
      console.log(`Cuenta ${index}:`, {
        numero: cuenta.cue_numero,
        saldo: cuenta.cue_saldo_disponible,
        tipo_saldo: typeof cuenta.cue_saldo_disponible,
        saldo_parseado: Number(cuenta.cue_saldo_disponible)
      });
    });
  }, [cuentas, montoRequerido]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleSeleccionarCuenta = (cuenta: Cuenta) => {
    setCuentaSeleccionada(cuenta);
    
    // ✅ CONVERSIÓN ROBUSTA A NÚMERO
    const saldoNumerico = Number(cuenta.cue_saldo_disponible);
    const montoNumerico = Number(montoRequerido);
    
    console.log('Comparación:', {
      saldo: saldoNumerico,
      monto: montoNumerico,
      suficiente: saldoNumerico >= montoNumerico
    });
    
    if (isNaN(saldoNumerico) || isNaN(montoNumerico)) {
      setErrorSaldo('Error en los montos. Por favor, recarga la página.');
      return;
    }
    
    if (saldoNumerico < montoNumerico) {
      setErrorSaldo(
        `${MENSAJES.SALDO_INSUFICIENTE}. Necesitas $${montoNumerico.toFixed(2)} pero tienes $${saldoNumerico.toFixed(2)}`
      );
    } else {
      setErrorSaldo(null);
    }
  };

  const handleContinuar = () => {
    if (!cuentaSeleccionada) return;
    
    const saldoNumerico = Number(cuentaSeleccionada.cue_saldo_disponible);
    const montoNumerico = Number(montoRequerido);
    
    if (saldoNumerico >= montoNumerico) {
      console.log('✅ Continuando con cuenta seleccionada:', cuentaSeleccionada);
      onCuentaSeleccionada(cuentaSeleccionada);
    } else {
      console.error('❌ Saldo insuficiente:', { saldoNumerico, montoNumerico });
    }
  };

  const tieneSaldoSuficiente = (cuenta: Cuenta): boolean => {
    const saldo = Number(cuenta.cue_saldo_disponible);
    const monto = Number(montoRequerido);
    
    // ✅ VALIDACIÓN SEGURA
    if (isNaN(saldo) || isNaN(monto)) {
      console.warn('⚠️ Valores inválidos:', { saldo, monto });
      return false;
    }
    
    return saldo >= monto;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Cargando cuentas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>{error}</p>
          <button className={styles.btnVolver} onClick={onVolver}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  // ✅ VALIDACIÓN: Verificar si hay cuentas con saldo suficiente
  const cuentasConSaldo = cuentas.filter(c => tieneSaldoSuficiente(c));

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

      <h2 className={styles.titulo}>Selección de Cuenta</h2>

      {/* ✅ DEBUG INFO (quitar después) */}
      <div style={{ 
        background: '#f0f0f0', 
        padding: '10px', 
        margin: '10px 0', 
        borderRadius: '5px',
        fontSize: '0.85rem'
      }}>
        <strong>DEBUG:</strong> Monto requerido: ${Number(montoRequerido).toFixed(2)} | 
        Cuentas con saldo: {cuentasConSaldo.length}/{cuentas.length}
      </div>

      {cuentasConSaldo.length === 0 && (
        <div className={styles.alertaError}>
          <p className={styles.alertaIcono}>⚠️</p>
          <p className={styles.alertaTexto}>
            {MENSAJES.SALDO_INSUFICIENTE}. Necesitas al menos ${Number(montoRequerido).toFixed(2)}
          </p>
        </div>
      )}

      <div className={styles.descripcion}>
        <p>Elige la cuenta con la que realizarás el depósito del dinero y donde recibirás tus intereses.</p>
      </div>

      <div className={styles.cuentasList}>
        {cuentas.map((cuenta) => {
          const suficiente = tieneSaldoSuficiente(cuenta);
          const esSeleccionada = cuentaSeleccionada?.id_cuenta === cuenta.id_cuenta;
          const saldoNumerico = Number(cuenta.cue_saldo_disponible);

          return (
            <button
              key={cuenta.id_cuenta}
              className={`${styles.cuentaCard} ${esSeleccionada ? styles.selected : ''} ${
                !suficiente ? styles.disabled : ''
              }`}
              onClick={() => suficiente && handleSeleccionarCuenta(cuenta)}
              disabled={!suficiente}
            >
              <div className={styles.cuentaHeader}>
                <div className={styles.radioCircle}>
                  {esSeleccionada && <div className={styles.radioInner} />}
                </div>
                <div className={styles.cuentaInfo}>
                  <p className={styles.cuentaTipo}>
                    {cuenta.tipo === 'ahorro' ? 'Cuenta de Ahorros' : 'Cuenta Corriente'}
                  </p>
                  <p className={styles.cuentaNumero}>
                    Nro. {cuenta.cue_numero}
                  </p>
                </div>
              </div>

              <div className={styles.cuentaSaldo}>
                <p className={styles.saldoLabel}>Saldo disponible</p>
                <p className={`${styles.saldoValor} ${!suficiente ? styles.saldoInsuficiente : ''}`}>
                  {formatCurrency(saldoNumerico)}
                </p>
              </div>

              {!suficiente && (
                <p className={styles.mensajeInsuficiente}>
                  ⚠️ Saldo insuficiente. Necesitas {formatCurrency(Number(montoRequerido))}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {errorSaldo && (
        <div className={styles.errorBanner}>
          <p>{errorSaldo}</p>
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.checkbox}>
          <input type="checkbox" id="terminos" defaultChecked />
          <label htmlFor="terminos">
            He leído y acepto el Convenio de{' '}
            <a href="#" className={styles.link}>
              Tratamiento de Datos personales
            </a>
          </label>
        </div>

        <button
          className={styles.btnContinuar}
          onClick={handleContinuar}
          disabled={!cuentaSeleccionada || !!errorSaldo}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default SeleccionCuenta;
