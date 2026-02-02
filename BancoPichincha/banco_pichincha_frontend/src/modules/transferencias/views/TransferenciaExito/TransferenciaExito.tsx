/**
 * TransferenciaExito - Pantalla de transferencia exitosa
 * Muestra resumen y opciones post-transferencia
 */

import React from 'react';
import { CheckCircle2, Download, Share2, Home, RefreshCw, ArrowRight } from 'lucide-react';
import { ActionButton } from '../../components';
import type { VistaTransferencia, TransferenciaResponse, Contacto, Cuenta } from '../../types/transferencias.types';
import styles from './TransferenciaExito.module.css';

interface DatosOriginales {
  contacto?: Contacto;
  tipoTransferencia: 'INTERNA' | 'INTERBANCARIA' | 'ENTRE_CUENTAS';
  cuentaOrigen: Cuenta;
  cuentaDestino?: Cuenta;
  monto: number;
  comision: number;
  total: number;
  descripcion: string;
}

interface TransferenciaExitoProps {
  transferencia: TransferenciaResponse;
  datosOriginales: DatosOriginales;
  onNavigate: (vista: VistaTransferencia, datos?: any) => void;
  onVolverInicio: () => void;
}

const TransferenciaExito: React.FC<TransferenciaExitoProps> = ({ 
  transferencia,
  datosOriginales,
  onNavigate,
  onVolverInicio
}) => {
  const formatearMoneda = (valor: number): string => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(valor);
  };

  const formatearFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDescargarComprobante = () => {
    // Aquí se implementaría la descarga del PDF
    alert('Funcionalidad de descarga próximamente');
  };

  const handleCompartir = () => {
    // Aquí se implementaría compartir
    if (navigator.share) {
      navigator.share({
        title: 'Comprobante de transferencia',
        text: `Transferencia realizada por ${formatearMoneda(datosOriginales.monto)}`,
      });
    }
  };

  const handleNuevaTransferencia = () => {
    onNavigate('INICIO');
  };

  const getBeneficiarioNombre = (): string => {
    if (datosOriginales.contacto) {
      return datosOriginales.contacto.nombreBeneficiario;
    }
    if (datosOriginales.cuentaDestino) {
      return `Mi ${datosOriginales.cuentaDestino.tipoCuenta}`;
    }
    return 'Beneficiario';
  };

  return (
    <div className={styles.container}>
      {/* Success animation */}
      <div className={styles.successIcon}>
        <div className={styles.iconCircle}>
          <CheckCircle2 size={48} />
        </div>
        <div className={styles.pulse}></div>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>¡Transferencia exitosa!</h1>
        <p className={styles.subtitle}>
          Tu transferencia ha sido procesada correctamente
        </p>
      </div>

      {/* Monto destacado */}
      <div className={styles.montoDestacado}>
        <span className={styles.montoLabel}>Monto transferido</span>
        <span className={styles.montoValor}>{formatearMoneda(datosOriginales.monto)}</span>
      </div>

      {/* Detalles */}
      <div className={styles.detallesCard}>
        <div className={styles.detalleFlujo}>
          <div className={styles.cuentaBox}>
            <span className={styles.cuentaLabel}>Desde</span>
            <span className={styles.cuentaValor}>{datosOriginales.cuentaOrigen.tipoCuenta}</span>
            <span className={styles.cuentaNumero}>
              ****{datosOriginales.cuentaOrigen.numeroCuenta.slice(-4)}
            </span>
          </div>
          
          <div className={styles.flujoArrow}>
            <ArrowRight size={20} />
          </div>
          
          <div className={styles.cuentaBox}>
            <span className={styles.cuentaLabel}>Hacia</span>
            <span className={styles.cuentaValor}>{getBeneficiarioNombre()}</span>
            <span className={styles.cuentaNumero}>
              {datosOriginales.contacto 
                ? `****${datosOriginales.contacto.numeroCuenta.slice(-4)}`
                : datosOriginales.cuentaDestino 
                  ? `****${datosOriginales.cuentaDestino.numeroCuenta.slice(-4)}`
                  : ''}
            </span>
          </div>
        </div>

        <div className={styles.separador}></div>

        <div className={styles.detallesLista}>
          <div className={styles.detalleLine}>
            <span>Número de operación</span>
            <span className={styles.operacion}>{transferencia.numeroOperacion || transferencia.id}</span>
          </div>
          <div className={styles.detalleLine}>
            <span>Fecha y hora</span>
            <span>{formatearFecha(transferencia.fecha || new Date().toISOString())}</span>
          </div>
          {datosOriginales.comision > 0 && (
            <div className={styles.detalleLine}>
              <span>Comisión</span>
              <span>{formatearMoneda(datosOriginales.comision)}</span>
            </div>
          )}
          <div className={styles.detalleLine}>
            <span>Total debitado</span>
            <span className={styles.totalDebitado}>{formatearMoneda(datosOriginales.total)}</span>
          </div>
          {datosOriginales.descripcion && (
            <div className={styles.detalleLine}>
              <span>Descripción</span>
              <span>{datosOriginales.descripcion}</span>
            </div>
          )}
        </div>
      </div>

      {/* Acciones secundarias */}
      <div className={styles.accionesSecundarias}>
        <button className={styles.accionSecundaria} onClick={handleDescargarComprobante}>
          <Download size={20} />
          <span>Descargar comprobante</span>
        </button>
        <button className={styles.accionSecundaria} onClick={handleCompartir}>
          <Share2 size={20} />
          <span>Compartir</span>
        </button>
      </div>

      {/* Acciones principales */}
      <div className={styles.accionesPrincipales}>
        <ActionButton 
          variant="outline" 
          onClick={onVolverInicio}
          icon={<Home size={18} />}
          fullWidth
        >
          Volver al inicio
        </ActionButton>
        <ActionButton 
          onClick={handleNuevaTransferencia}
          icon={<RefreshCw size={18} />}
          fullWidth
        >
          Nueva transferencia
        </ActionButton>
      </div>
    </div>
  );
};

export default TransferenciaExito;
