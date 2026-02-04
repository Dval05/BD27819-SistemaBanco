/**
 * TransferenciaMonto - Pantalla de ingreso de monto
 * Muestra saldo disponible, límites y permite ingresar cantidad
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Info } from 'lucide-react';
import { ActionButton, LoadingSpinner, CuentaSelector } from '../../components';
import { transferenciasService } from '../../services/transferencias.service';
import type { VistaTransferencia, Contacto, Cuenta, LimiteTransaccional } from '../../types/transferencias.types';
import styles from './TransferenciaMonto.module.css';

interface TransferenciaMontoProps {
  clienteId: number | string;
  contacto?: Contacto;
  tipoTransferencia: 'INTERNA' | 'INTERBANCARIA' | 'ENTRE_CUENTAS';
  cuentas: Cuenta[];
  onNavigate: (vista: VistaTransferencia, datos?: any) => void;
  onBack: () => void;
}

const COMISION_INTERBANCARIA = 0.41;
const LIMITE_DIARIO = 15000;

const TransferenciaMonto: React.FC<TransferenciaMontoProps> = ({ 
  clienteId,
  contacto,
  tipoTransferencia,
  cuentas,
  onNavigate, 
  onBack 
}) => {
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cuentaOrigen, setCuentaOrigen] = useState<Cuenta | null>(null);
  const [cuentaDestino, setCuentaDestino] = useState<Cuenta | null>(null);
  const [contactoLocal, setContactoLocal] = useState<Contacto | undefined>(contacto);
  const [limites, setLimites] = useState<LimiteTransaccional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('TransferenciaMonto: contacto recibido como prop:', contacto);
    setContactoLocal(contacto);
  }, [contacto]);

  // Cuando cambian las cuentas disponibles, actualizar la selección
  useEffect(() => {
    if (cuentas && cuentas.length > 0 && !cuentaOrigen) {
      setCuentaOrigen(cuentas[0]);
    }
  }, [cuentas]);

  useEffect(() => {
    cargarLimites();
  }, [clienteId]);

  const cargarLimites = async () => {
    try {
      setLoading(true);
      const data = await transferenciasService.obtenerLimitesDisponibles(clienteId);
      setLimites(data);
    } catch (err) {
      // Error silencioso
    } finally {
      setLoading(false);
    }
  };

  const handleMontoChange = (value: string) => {
    // Permitir solo números y un punto decimal
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value) || value === '') {
      setMonto(value);
      setError(null);
    }
  };

  const montoNumerico = parseFloat(monto) || 0;
  const esInterbancaria = tipoTransferencia === 'INTERBANCARIA';
  const comision = esInterbancaria ? COMISION_INTERBANCARIA : 0;
  const total = montoNumerico + comision;

  const validarMonto = (): boolean => {
    if (!monto || montoNumerico <= 0) {
      setError('Ingresa un monto válido');
      return false;
    }

    if (!cuentaOrigen) {
      setError('Selecciona una cuenta de origen');
      return false;
    }

    if (tipoTransferencia === 'ENTRE_CUENTAS' && !cuentaDestino) {
      setError('Selecciona una cuenta de destino');
      return false;
    }

    if (tipoTransferencia === 'ENTRE_CUENTAS' && cuentaOrigen.id === cuentaDestino?.id) {
      setError('Las cuentas de origen y destino deben ser diferentes');
      return false;
    }

    if (total > cuentaOrigen.saldoDisponible) {
      setError('Saldo insuficiente para realizar esta transferencia');
      return false;
    }

    if (montoNumerico > LIMITE_DIARIO) {
      setError(`El monto excede el límite diario de $${LIMITE_DIARIO.toLocaleString()}`);
      return false;
    }

    if (limites && montoNumerico > limites.disponibleDiario) {
      setError(`Excede tu límite disponible del día: $${limites.disponibleDiario.toFixed(2)}`);
      return false;
    }

    return true;
  };

  const handleContinuar = () => {
    if (!validarMonto()) return;

    const datosTransferencia = {
      contacto: contactoLocal,
      tipoTransferencia,
      cuentaOrigen,
      cuentaDestino: tipoTransferencia === 'ENTRE_CUENTAS' ? cuentaDestino : undefined,
      monto: montoNumerico,
      comision,
      total,
      descripcion: descripcion.trim()
    };

    onNavigate('CONFIRMACION', datosTransferencia);
  };

  const formatearMoneda = (valor: number): string => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(valor);
  };

  const cuentasParaDestino = cuentas.filter(c => c.id !== cuentaOrigen?.id);

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner message="Cargando información..." />
      </div>
    );
  }

  // Validar que hay cuentas disponibles
  if (!cuentas || cuentas.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onBack}>
            <ArrowLeft size={24} />
          </button>
          <div className={styles.headerText}>
            <h1 className={styles.title}>Ingresa el monto</h1>
          </div>
        </div>
        <div className={styles.error}>
          <AlertCircle size={18} />
          <span>No tienes cuentas disponibles para realizar una transferencia</span>
        </div>
        <div className={styles.actions}>
          <ActionButton variant="outline" onClick={onBack}>
            Volver
          </ActionButton>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <div className={styles.headerText}>
          <h1 className={styles.title}>
            {tipoTransferencia === 'ENTRE_CUENTAS' 
              ? 'Transferir entre mis cuentas'
              : 'Ingresa el monto'
            }
          </h1>
          {contactoLocal && (
            <p className={styles.subtitle}>
              Para: {contactoLocal.alias || contactoLocal.nombreBeneficiario}
            </p>
          )}
        </div>
      </div>

      {/* Beneficiario info */}
      {contactoLocal && (
        <div className={styles.beneficiarioCard}>
          <div className={styles.beneficiarioInfo}>
            <span className={styles.beneficiarioNombre}>{contactoLocal.nombreBeneficiario}</span>
            <span className={styles.beneficiarioCuenta}>
              {contactoLocal.numeroCuenta 
                ? contactoLocal.numeroCuenta.replace(/(\d{4})(\d{4})(\d+)/, '$1 $2 $3')
                : 'Cuenta no disponible'
              }
            </span>
            <span className={styles.beneficiarioBanco}>
              {contactoLocal.banco ? contactoLocal.bancoNombre : 'Banco Pichincha'}
            </span>
          </div>
          {esInterbancaria && (
            <span className={styles.badgeInterbancaria}>Interbancaria</span>
          )}
        </div>
      )}

      {/* Cuenta origen */}
      <CuentaSelector
        cuentas={cuentas}
        cuentaSeleccionada={cuentaOrigen}
        onSelect={setCuentaOrigen}
      />

      {/* Cuenta destino (solo entre cuentas) */}
      {tipoTransferencia === 'ENTRE_CUENTAS' && (
        <div className={styles.cuentaDestinoSection}>
          <label className={styles.label}>Cuenta destino</label>
          <CuentaSelector
            cuentas={cuentasParaDestino}
            cuentaSeleccionada={cuentaDestino}
            onSelect={setCuentaDestino}
          />
        </div>
      )}

      {/* Input monto */}
      <div className={styles.montoSection}>
        <label className={styles.label}>Monto a transferir</label>
        <div className={styles.montoInputWrapper}>
          <span className={styles.montoPrefix}>$</span>
          <input
            type="text"
            className={styles.montoInput}
            value={monto}
            onChange={(e) => handleMontoChange(e.target.value)}
            placeholder="0.00"
            autoFocus
          />
        </div>

        {/* Límites */}
        <div className={styles.limitesInfo}>
          <div className={styles.limiteItem}>
            <span className={styles.limiteLabel}>Límite diario</span>
            <span className={styles.limiteValor}>{formatearMoneda(LIMITE_DIARIO)}</span>
          </div>
          {limites && (
            <div className={styles.limiteItem}>
              <span className={styles.limiteLabel}>Disponible hoy</span>
              <span className={styles.limiteValor}>{formatearMoneda(limites.disponibleDiario)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Descripción */}
      <div className={styles.descripcionSection}>
        <label className={styles.label}>Descripción (opcional)</label>
        <input
          type="text"
          className={styles.descripcionInput}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ej: Pago de arriendo"
          maxLength={100}
        />
      </div>

      {/* Comisión interbancaria */}
      {esInterbancaria && montoNumerico > 0 && (
        <div className={styles.comisionInfo}>
          <Info size={18} />
          <div className={styles.comisionDetalles}>
            <span>Comisión interbancaria: {formatearMoneda(comision)}</span>
            <span className={styles.comisionTotal}>Total a debitar: {formatearMoneda(total)}</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Acciones */}
      <div className={styles.actions}>
        <ActionButton variant="outline" onClick={onBack}>
          Cancelar
        </ActionButton>
        <ActionButton onClick={handleContinuar} disabled={!monto || montoNumerico <= 0}>
          Continuar
        </ActionButton>
      </div>
    </div>
  );
};

export default TransferenciaMonto;
