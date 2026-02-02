/**
 * NuevoContactoPichincha - Formulario para agregar contacto Pichincha
 * Valida cuenta de 10 dígitos antes de guardar
 */

import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle, CreditCard } from 'lucide-react';
import { ActionButton } from '../../components';
import { transferenciasService } from '../../services/transferencias.service';
import type { VistaTransferencia, Contacto } from '../../types/transferencias.types';
import styles from './NuevoContactoPichincha.module.css';

interface NuevoContactoPichinchaProps {
  clienteId: number | string;
  onNavigate: (vista: VistaTransferencia, datos?: any) => void;
  onBack: () => void;
  onContactoCreado?: (contacto: Contacto) => void;
}

interface FormData {
  numeroCuenta: string;
  email: string;
  alias: string;
}

interface ValidacionCuenta {
  valida: boolean;
  nombreTitular: string | null;
  tipoCuenta: string | null;
}

const NuevoContactoPichincha: React.FC<NuevoContactoPichinchaProps> = ({ 
  clienteId,
  onNavigate, 
  onBack,
  onContactoCreado
}) => {
  const [formData, setFormData] = useState<FormData>({
    numeroCuenta: '',
    email: '',
    alias: ''
  });
  const [validacion, setValidacion] = useState<ValidacionCuenta | null>(null);
  const [validando, setValidando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof FormData, value: string) => {
    // Solo números para cuenta
    if (field === 'numeroCuenta') {
      value = value.replace(/\D/g, '').slice(0, 10);
      // Resetear validación si cambia la cuenta
      setValidacion(null);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleValidarCuenta = async () => {
    if (formData.numeroCuenta.length !== 10) {
      setError('La cuenta debe tener 10 dígitos');
      return;
    }

    try {
      setValidando(true);
      setError(null);
      
      const resultado = await transferenciasService.validarCuentaPichincha(formData.numeroCuenta);
      
      if (resultado.existe) {
        setValidacion({
          valida: true,
          nombreTitular: resultado.nombreTitular || null,
          tipoCuenta: resultado.tipoCuenta || null
        });
      } else {
        setError('La cuenta no existe o no pertenece a Banco Pichincha');
        setValidacion(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al validar cuenta');
      setValidacion(null);
    } finally {
      setValidando(false);
    }
  };

  const handleGuardar = async () => {
    if (!validacion?.valida) {
      setError('Primero debes validar la cuenta');
      return;
    }

    if (!formData.alias.trim()) {
      setError('El alias es obligatorio');
      return;
    }

    try {
      setGuardando(true);
      setError(null);

      const nuevoContacto = await transferenciasService.crearContacto({
        cliId: clienteId,
        conNumeroCuenta: formData.numeroCuenta,
        conNombreBeneficiario: validacion.nombreTitular!,
        conAlias: formData.alias.trim(),
        conEmail: formData.email.trim() || undefined,
        conTipoCuenta: validacion.tipoCuenta === 'Ahorros' ? '00' : '01',
        conTipoIdentificacion: '00',
        conIdentificacion: ''
      });

      if (onContactoCreado) {
        onContactoCreado(nuevoContacto);
      }

      // Navegar a monto con el contacto creado
      onNavigate('MONTO', {
        contacto: nuevoContacto,
        tipoTransferencia: 'INTERNA'
      });

    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar contacto');
    } finally {
      setGuardando(false);
    }
  };

  const formatearCuenta = (cuenta: string): string => {
    if (cuenta.length <= 4) return cuenta;
    if (cuenta.length <= 8) return `${cuenta.slice(0, 4)}-${cuenta.slice(4)}`;
    return `${cuenta.slice(0, 4)}-${cuenta.slice(4, 8)}-${cuenta.slice(8)}`;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Contacto Pichincha</h1>
          <p className={styles.subtitle}>Ingresa los datos de la cuenta</p>
        </div>
      </div>

      {/* Formulario */}
      <div className={styles.form}>
        {/* Número de cuenta */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Número de cuenta
            <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWithButton}>
            <div className={styles.inputWrapper}>
              <CreditCard size={20} className={styles.inputIcon} />
              <input
                type="text"
                className={styles.input}
                value={formatearCuenta(formData.numeroCuenta)}
                onChange={(e) => handleChange('numeroCuenta', e.target.value)}
                placeholder="0000-0000-00"
                maxLength={12}
                disabled={validacion?.valida}
              />
              {validacion?.valida && (
                <CheckCircle2 size={20} className={styles.validIcon} />
              )}
            </div>
            <ActionButton
              onClick={handleValidarCuenta}
              loading={validando}
              disabled={formData.numeroCuenta.length !== 10 || validacion?.valida}
              size="medium"
            >
              {validacion?.valida ? 'Validada' : 'Validar'}
            </ActionButton>
          </div>
          <span className={styles.hint}>Cuenta de 10 dígitos</span>
        </div>

        {/* Resultado validación */}
        {validacion?.valida && (
          <div className={styles.validacionResult}>
            <CheckCircle2 size={24} />
            <div className={styles.validacionInfo}>
              <span className={styles.validacionNombre}>{validacion.nombreTitular}</span>
              <span className={styles.validacionTipo}>{validacion.tipoCuenta}</span>
            </div>
          </div>
        )}

        {/* Email */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Email (opcional)</label>
          <input
            type="email"
            className={styles.inputFull}
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="ejemplo@correo.com"
            disabled={!validacion?.valida}
          />
          <span className={styles.hint}>Para enviar comprobante de transferencia</span>
        </div>

        {/* Alias */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Alias
            <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            className={styles.inputFull}
            value={formData.alias}
            onChange={(e) => handleChange('alias', e.target.value)}
            placeholder="Ej: Mamá, Juan trabajo, etc."
            maxLength={50}
            disabled={!validacion?.valida}
          />
          <span className={styles.hint}>Un nombre para identificar este contacto</span>
        </div>

        {/* Error */}
        {error && (
          <div className={styles.error}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Botón guardar */}
        <div className={styles.actions}>
          <ActionButton
            variant="outline"
            onClick={onBack}
            disabled={guardando}
          >
            Cancelar
          </ActionButton>
          <ActionButton
            onClick={handleGuardar}
            loading={guardando}
            disabled={!validacion?.valida || !formData.alias.trim()}
          >
            Guardar y continuar
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default NuevoContactoPichincha;
