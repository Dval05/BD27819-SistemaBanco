/**
 * TransferenciaExito - Pantalla de transferencia exitosa
 * Muestra resumen y opciones post-transferencia
 */

import React from 'react';
import { CheckCircle2, Download, Share2, Home, RefreshCw, ArrowRight } from 'lucide-react';
import { useNotificacion } from '../../../../contexts/NotificacionContext';
import { ActionButton } from '../../components';
import { exportarComprobantePDF } from '../../../../services/exportService';
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
  const { info } = useNotificacion();
  
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
    try {
      console.log('=== Iniciando descarga de comprobante ===');
      console.log('Transferencia:', transferencia);
      console.log('Datos originales:', datosOriginales);

      // Determinar tipo de transferencia
      let tipoTransferencia = 'Transferencia Interna';
      if (datosOriginales.tipoTransferencia === 'INTERBANCARIA') {
        tipoTransferencia = 'Transferencia Interbancaria';
      } else if (datosOriginales.tipoTransferencia === 'ENTRE_CUENTAS') {
        tipoTransferencia = 'Transferencia Entre Mis Cuentas';
      }

      // Obtener número de cuenta destino con validación
      let cuentaDestino = '';
      if (datosOriginales.contacto && datosOriginales.contacto.numeroCuenta) {
        cuentaDestino = datosOriginales.contacto.numeroCuenta;
      } else if (datosOriginales.cuentaDestino && datosOriginales.cuentaDestino.numeroCuenta) {
        cuentaDestino = datosOriginales.cuentaDestino.numeroCuenta;
      }

      console.log('Cuenta destino:', cuentaDestino);

      // Validar datos requeridos
      if (!datosOriginales.cuentaOrigen || !datosOriginales.cuentaOrigen.numeroCuenta) {
        throw new Error('No se encontró información de cuenta origen');
      }

      // Preparar datos para el PDF
      const datosPDF = {
        numeroOperacion: String(transferencia.numeroOperacion || transferencia.id || 'N/A'),
        fecha: transferencia.fecha || new Date().toISOString(),
        cuentaOrigen: {
          tipoCuenta: datosOriginales.cuentaOrigen.tipoCuenta || 'Cuenta',
          numeroCuenta: datosOriginales.cuentaOrigen.numeroCuenta
        },
        beneficiario: getBeneficiarioNombre(),
        cuentaDestino: cuentaDestino || 'No disponible',
        tipoTransferencia: tipoTransferencia,
        monto: Number(datosOriginales.monto) || 0,
        comision: Number(datosOriginales.comision) || 0,
        total: Number(datosOriginales.total) || 0,
        descripcion: datosOriginales.descripcion || ''
      };

      console.log('Datos PDF:', datosPDF);

      // Generar y descargar PDF
      exportarComprobantePDF(datosPDF);
      info('Comprobante descargado exitosamente', 'Éxito');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      info(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'Error');
    }
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
