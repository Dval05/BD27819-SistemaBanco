/**
 * TransferenciaConfirmacion - Pantalla de confirmación de transferencia
 * Muestra resumen con datos censurados para confirmar
 */

import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { ActionButton } from '../../components';
import { transferenciasService } from '../../services/transferencias.service';
import type { VistaTransferencia, Contacto, Cuenta, TransferenciaResponse } from '../../types/transferencias.types';
import styles from './TransferenciaConfirmacion.module.css';

interface DatosTransferencia {
  contacto?: Contacto;
  tipoTransferencia: 'INTERNA' | 'INTERBANCARIA' | 'ENTRE_CUENTAS';
  cuentaOrigen: Cuenta;
  cuentaDestino?: Cuenta;
  monto: number;
  comision: number;
  total: number;
  descripcion: string;
}

interface TransferenciaConfirmacionProps {
  clienteId: number | string;
  datos: DatosTransferencia;
  onNavigate: (vista: VistaTransferencia, datos?: any) => void;
  onBack: () => void;
}

const TransferenciaConfirmacion: React.FC<TransferenciaConfirmacionProps> = ({ 
  clienteId,
  datos,
  onNavigate, 
  onBack 
}) => {
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generar número de referencia aleatorio
  const numeroReferencia = Math.floor(100000 + Math.random() * 900000).toString();

  const formatearMoneda = (valor: number): string => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(valor);
  };

  const handleConfirmar = async () => {
    try {
      setProcesando(true);
      setError(null);

      // Determinar tipo de transferencia para el backend
      const tipoTransferencia = datos.tipoTransferencia === 'INTERBANCARIA' ? '01' : '00';
      // Construir cuentaDestino según si es contacto o cuenta directa
      const cuentaDestino = datos.contacto
        ? {
            numeroCuenta: datos.contacto.numeroCuenta,
            email: datos.contacto.email || '',
            tipoIdentificacion: datos.contacto.tipoIdentificacion || '',
            identificacion: datos.contacto.identificacion || '',
            tipoCuenta: datos.contacto.tipoCuenta || '',
            idBanco: tipoTransferencia === '01' ? datos.contacto.banco : undefined,
            nombreBeneficiario: datos.contacto.nombreBeneficiario || '',
            idContacto: datos.contacto.id || undefined
          }
        : datos.cuentaDestino
        ? {
            numeroCuenta: datos.cuentaDestino.numeroCuenta,
            email: '',
            tipoIdentificacion: '',
            identificacion: '',
            tipoCuenta: datos.cuentaDestino.tipoCuenta,
            idBanco: undefined,
            nombreBeneficiario: '',
            idContacto: undefined
          }
        : undefined;

      const request = {
        idPersona: clienteId,
        idCuenta: datos.cuentaOrigen.id || datos.cuentaOrigen.numeroCuenta,
        monto: datos.monto,
        descripcion: datos.descripcion || '',
        tipoTransferencia,
        cuentaDestino,
        saldoDisponible: datos.cuentaOrigen.saldoDisponible || 0,
        saldoDisponibleAnterior: datos.cuentaOrigen.saldoDisponible || 0,
        guardarContacto: datos.contacto ? { guardar: false } : undefined,
        conId: datos.contacto?.id || undefined
      };
      const resultado: TransferenciaResponse = await transferenciasService.crearTransferencia(request);
      // Navegar a pantalla de éxito
      onNavigate('EXITO', {
        transferencia: resultado,
        datosOriginales: datos
      });

    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar la transferencia');
    } finally {
      setProcesando(false);
    }
  };

  // Obtener nombre del beneficiario
  const getNombreBeneficiario = () => {
    if (datos.contacto) {
      return datos.contacto.nombreBeneficiario || datos.contacto.alias || 'Beneficiario';
    }
    if (datos.cuentaDestino) {
      return 'Cuenta propia';
    }
    return 'Beneficiario';
  };

  // Obtener alias del contacto
  const getAliasContacto = () => {
    if (datos.contacto?.alias) {
      return datos.contacto.alias;
    }
    return null;
  };

  // Obtener cuenta destino
  const getCuentaDestino = () => {
    if (datos.contacto) {
      return datos.contacto.numeroCuenta;
    }
    if (datos.cuentaDestino) {
      return datos.cuentaDestino.numeroCuenta;
    }
    return '';
  };

  // Obtener banco destino
  const getBancoDestino = () => {
    if (datos.contacto?.bancoNombre) {
      return datos.contacto.bancoNombre;
    }
    return 'Banco Pichincha';
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack} disabled={procesando}>
          <ArrowLeft size={24} />
        </button>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Transferir</h1>
        </div>
      </div>

      {/* Card de confirmación */}
      <div className={styles.confirmacionCard}>
        <p className={styles.subtitulo}>Confirma los datos de la transferencia</p>

        {/* Icono de check */}
        <div className={styles.iconoConfirmacion}>
          <CheckCircle />
        </div>

        {/* Número de referencia */}
        <div className={styles.referencia}>
          <FileText />
          <span>{numeroReferencia}</span>
        </div>

        {/* Monto */}
        <div className={styles.montoSection}>
          <p className={styles.montoLabel}>Vas a transferir:</p>
          <p className={styles.montoDestacado}>{formatearMoneda(datos.monto)}</p>
          <p className={styles.cuentaOrigen}>De la cuenta: {datos.cuentaOrigen.tipoCuenta}</p>
        </div>

        {/* Datos del beneficiario */}
        <div className={styles.datosSection}>
          <div className={styles.datoLinea}>
            <span className={styles.datoLabel}>Beneficiario: </span>
            <span className={styles.datoValor}>{getNombreBeneficiario()}</span>
          </div>

          {getAliasContacto() && (
            <div className={styles.datoLinea}>
              <span className={styles.datoLabel}>Alias del contacto: </span>
              <span className={styles.datoValor}>{getAliasContacto()}</span>
            </div>
          )}

          <div className={styles.datoLinea}>
            <span className={styles.datoLabel}>A la cuenta: </span>
            <span className={styles.datoValor}>{getCuentaDestino()}</span>
          </div>

          <div className={styles.datoLinea}>
            <span className={styles.datoLabel}>Banco destino: </span>
            <span className={styles.datoValor}>{getBancoDestino()}</span>
          </div>
        </div>

        {/* Info sin costo */}
        <p className={styles.sinCosto}>
          {datos.comision > 0 
            ? `Comisión: ${formatearMoneda(datos.comision)}`
            : 'Esta transacción no tiene costo'
          }
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Acciones */}
      <div className={styles.actions}>
        <ActionButton 
          onClick={handleConfirmar} 
          loading={procesando}
        >
          Confirmar transferencia
        </ActionButton>
        <ActionButton variant="outline" onClick={onBack} disabled={procesando}>
          Cancelar
        </ActionButton>
      </div>
    </div>
  );
};

export default TransferenciaConfirmacion;
