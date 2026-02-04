/**
 * TransferenciaConfirmacion - Pantalla de confirmación con código de seguridad
 * Código se renueva cada 10 segundos
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, AlertCircle, Shield, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';
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

const CODIGO_DURACION = 20; // segundos

const TransferenciaConfirmacion: React.FC<TransferenciaConfirmacionProps> = ({ 
  clienteId,
  datos,
  onNavigate, 
  onBack 
}) => {
  const [codigoIngresado, setCodigoIngresado] = useState('');
  const [codigoGenerado, setCodigoGenerado] = useState('');
  const [tiempoRestante, setTiempoRestante] = useState(CODIGO_DURACION);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generar código aleatorio de 6 dígitos
  const generarCodigo = useCallback(() => {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    setCodigoGenerado(codigo);
    setTiempoRestante(CODIGO_DURACION);
    setCodigoIngresado('');
    setError(null);
  }, []);

  // Efecto para generar código inicial
  useEffect(() => {
    generarCodigo();
  }, [generarCodigo]);

  // Efecto para countdown del código
  useEffect(() => {
    const timer = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev <= 1) {
          generarCodigo();
          return CODIGO_DURACION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [generarCodigo]);

  const handleCodigoChange = (value: string) => {
    // Solo números, máximo 6 dígitos
    const numerico = value.replace(/\D/g, '').slice(0, 6);
    setCodigoIngresado(numerico);
    setError(null);
  };

  const formatearMoneda = (valor: number): string => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(valor);
  };

  const handleConfirmar = async () => {
    console.log('\n=== DEBUG handleConfirmar - INICIO ===');
    console.log('codigoIngresado:', codigoIngresado);
    console.log('codigoGenerado:', codigoGenerado);
    console.log('codigoIngresado.length:', codigoIngresado.length);
    console.log('Validación pasada:', codigoIngresado === codigoGenerado);
    
    if (codigoIngresado !== codigoGenerado) {
      console.log('❌ Código incorrecto');
      setError('El código de seguridad es incorrecto');
      return;
    }

    console.log('✅ Código correcto, procediendo...');

    try {
      setProcesando(true);
      setError(null);

      // Validar que si hay contacto, tiene email
      if (datos.contacto && !datos.contacto.email) {
        setError('El contacto no tiene email registrado. Por favor, actualiza el contacto o usa una cuenta destino manual.');
        setProcesando(false);
        return;
      }

      // Determinar tipo de transferencia para el backend
      const tipoTransferencia = datos.tipoTransferencia === 'INTERBANCARIA' ? '01' : '00';
      // Construir cuentaDestino según si es contacto o cuenta directa
      const cuentaDestino = datos.contacto
        ? {
            numeroCuenta: datos.contacto.numeroCuenta,
            email: datos.contacto.email,
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

      console.log('\n=== DEBUG TransferenciaConfirmacion: handleConfirmar ===');
      console.log('clienteId:', clienteId);
      console.log('datos:', JSON.stringify(datos, null, 2));
      console.log('tipoTransferencia:', tipoTransferencia);
      console.log('cuentaDestino:', JSON.stringify(cuentaDestino, null, 2));

      const request = {
        cliId: clienteId,
        traCuentaOrigen: datos.cuentaOrigen.numeroCuenta,
        traCuentaDestino: cuentaDestino?.numeroCuenta || '',
        traMonto: datos.monto,
        traDescripcion: datos.descripcion || '',
        traTipoTransferencia: tipoTransferencia,
        traEmail: cuentaDestino?.email || '',
        traSaldoDisponible: datos.cuentaOrigen.saldoDisponible || 0,
        conId: datos.contacto?.id || undefined
      };
      
      console.log('Request final a enviar:', JSON.stringify(request, null, 2));
      console.log('Validación: cliId=', request.cliId, ', traCuentaOrigen=', request.traCuentaOrigen, ', traCuentaDestino=', request.traCuentaDestino, ', traMonto=', request.traMonto, ', traTipoTransferencia=', request.traTipoTransferencia);
      
      const resultado: TransferenciaResponse = await transferenciasService.crearTransferencia(request);
      
      console.log('✅ Transferencia exitosa:', resultado);
      
      // Navegar a pantalla de éxito
      onNavigate('EXITO', {
        transferencia: resultado,
        datosOriginales: datos
      });

    } catch (err: any) {
      console.log('❌ Error:', err);
      setError(err.response?.data?.message || 'Error al procesar la transferencia');
    } finally {
      setProcesando(false);
    }
  };

  const renderResumenLinea = (label: string, value: string, highlight?: boolean) => (
    <div className={`${styles.resumenLinea} ${highlight ? styles.highlight : ''}`}>
      <span className={styles.resumenLabel}>{label}</span>
      <span className={styles.resumenValor}>{value}</span>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack} disabled={procesando}>
          <ArrowLeft size={24} />
        </button>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Confirmar transferencia</h1>
          <p className={styles.subtitle}>Verifica los datos y confirma con el código</p>
        </div>
      </div>

      {/* Resumen de transferencia */}
      <div className={styles.resumenCard}>
        <h3 className={styles.resumenTitulo}>Resumen de la transferencia</h3>
        
        {datos.contacto ? (
          <>
            {renderResumenLinea('Beneficiario', datos.contacto.nombreBeneficiario)}
            {renderResumenLinea('Cuenta destino', datos.contacto.numeroCuenta)}
            {renderResumenLinea('Banco', datos.contacto.banco ? datos.contacto.bancoNombre! : 'Banco Pichincha')}
          </>
        ) : datos.cuentaDestino && (
          <>
            {renderResumenLinea('Cuenta destino', datos.cuentaDestino.numeroCuenta)}
            {renderResumenLinea('Tipo', datos.cuentaDestino.tipoCuenta)}
          </>
        )}

        <div className={styles.separador}></div>

        {renderResumenLinea('Cuenta origen', datos.cuentaOrigen.numeroCuenta)}
        {renderResumenLinea('Monto', formatearMoneda(datos.monto))}
        
        {datos.comision > 0 && (
          renderResumenLinea('Comisión', formatearMoneda(datos.comision))
        )}
        
        {renderResumenLinea('Total a debitar', formatearMoneda(datos.total), true)}

        {datos.descripcion && (
          <>
            <div className={styles.separador}></div>
            {renderResumenLinea('Descripción', datos.descripcion)}
          </>
        )}
      </div>

      {/* Código de seguridad */}
      <div className={styles.codigoSection}>
        <div className={styles.codigoHeader}>
          <Shield size={20} />
          <span>Código de seguridad</span>
        </div>
        
        <div className={styles.codigoGenerado}>
          <span className={styles.codigoLabel}>Tu código:</span>
          <div className={styles.codigoDisplay}>
            {codigoGenerado.split('').map((digit, index) => (
              <span key={index} className={styles.codigoDigit}>{digit}</span>
            ))}
          </div>
          <div className={styles.codigoTimer}>
            <Clock size={14} />
            <span>Expira en {tiempoRestante}s</span>
            <button 
              className={styles.refreshButton} 
              onClick={generarCodigo}
              title="Generar nuevo código"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className={styles.codigoInput}>
          <label className={styles.inputLabel}>Ingresa el código</label>
          <input
            type="text"
            className={styles.input}
            value={codigoIngresado}
            onChange={(e) => handleCodigoChange(e.target.value)}
            placeholder="000000"
            maxLength={6}
            disabled={procesando}
          />
        </div>

        {codigoIngresado.length === 6 && codigoIngresado === codigoGenerado && (
          <div className={styles.codigoValido}>
            <CheckCircle2 size={16} />
            <span>Código válido</span>
          </div>
        )}
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
        <ActionButton variant="outline" onClick={onBack} disabled={procesando}>
          Cancelar
        </ActionButton>
        <ActionButton 
          onClick={() => {
            console.log('🔴 BOTÓN PRESIONADO');
            console.log('codigoIngresado:', codigoIngresado);
            console.log('codigoIngresado.length:', codigoIngresado.length);
            console.log('disabled:', codigoIngresado.length !== 6);
            handleConfirmar();
          }}
          loading={procesando}
          disabled={codigoIngresado.length !== 6}
        >
          Confirmar transferencia
        </ActionButton>
      </div>
    </div>
  );
};

export default TransferenciaConfirmacion;
