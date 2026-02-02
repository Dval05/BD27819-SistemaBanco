/**
 * NuevoContactoOtroBanco - Formulario para agregar contacto interbancario
 * Incluye selector de banco, tipo identificación, tipo cuenta
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Building2, User, CreditCard, ChevronDown } from 'lucide-react';
import { ActionButton, LoadingSpinner } from '../../components';
import { transferenciasService } from '../../services/transferencias.service';
import type { VistaTransferencia, Banco, Contacto, TipoIdentificacion, TipoCuenta } from '../../types/transferencias.types';
import styles from './NuevoContactoOtroBanco.module.css';

interface NuevoContactoOtroBancoProps {
  clienteId: number | string;
  onNavigate: (vista: VistaTransferencia, datos?: any) => void;
  onBack: () => void;
  onContactoCreado?: (contacto: Contacto) => void;
}

interface FormData {
  bancoId: number | null;
  tipoIdentificacion: TipoIdentificacion;
  identificacion: string;
  nombreBeneficiario: string;
  tipoCuenta: TipoCuenta;
  numeroCuenta: string;
  email: string;
  alias: string;
}

const TIPOS_IDENTIFICACION = [
  { value: '00', label: 'Cédula' },
  { value: '01', label: 'RUC' },
  { value: '02', label: 'Pasaporte' }
];

const TIPOS_CUENTA = [
  { value: '00', label: 'Ahorros' },
  { value: '01', label: 'Corriente' }
];

const NuevoContactoOtroBanco: React.FC<NuevoContactoOtroBancoProps> = ({ 
  clienteId,
  onNavigate, 
  onBack,
  onContactoCreado
}) => {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [formData, setFormData] = useState<FormData>({
    bancoId: null,
    tipoIdentificacion: '00',
    identificacion: '',
    nombreBeneficiario: '',
    tipoCuenta: '00',
    numeroCuenta: '',
    email: '',
    alias: ''
  });
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  useEffect(() => {
    cargarBancos();
  }, []);

  const cargarBancos = async () => {
    try {
      setLoading(true);
      const data = await transferenciasService.obtenerBancos();
      // Excluir Banco Pichincha
      const bancosOtros = data.filter((b: Banco) => b.codigo !== '0010');
      setBancos(bancosOtros);
    } catch (err: any) {
      setError('Error al cargar bancos');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    // Validaciones específicas
    if (field === 'identificacion') {
      const maxLength = formData.tipoIdentificacion === '00' ? 10 : 
                       formData.tipoIdentificacion === '01' ? 13 : 20;
      value = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, maxLength);
    }
    if (field === 'numeroCuenta') {
      value = value.replace(/\D/g, '').slice(0, 20);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validarFormulario = (): boolean => {
    if (!formData.bancoId) {
      setError('Selecciona un banco');
      return false;
    }
    if (!formData.identificacion) {
      setError('La identificación es obligatoria');
      return false;
    }
    if (formData.tipoIdentificacion === '00' && formData.identificacion.length !== 10) {
      setError('La cédula debe tener 10 dígitos');
      return false;
    }
    if (!formData.nombreBeneficiario.trim()) {
      setError('El nombre del beneficiario es obligatorio');
      return false;
    }
    if (!formData.numeroCuenta) {
      setError('El número de cuenta es obligatorio');
      return false;
    }
    if (!formData.alias.trim()) {
      setError('El alias es obligatorio');
      return false;
    }
    return true;
  };

  const handleGuardar = async () => {
    if (!validarFormulario()) return;

    try {
      setGuardando(true);
      setError(null);

      const nuevoContacto = await transferenciasService.crearContacto({
        cliId: clienteId,
        banId: formData.bancoId!,
        conTipoIdentificacion: formData.tipoIdentificacion,
        conIdentificacion: formData.identificacion,
        conNombreBeneficiario: formData.nombreBeneficiario.trim(),
        conTipoCuenta: formData.tipoCuenta,
        conNumeroCuenta: formData.numeroCuenta,
        conEmail: formData.email.trim() || undefined,
        conAlias: formData.alias.trim()
      });

      if (onContactoCreado) {
        onContactoCreado(nuevoContacto);
      }

      // Navegar a monto con el contacto creado
      onNavigate('MONTO', {
        contacto: nuevoContacto,
        tipoTransferencia: 'INTERBANCARIA'
      });

    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar contacto');
    } finally {
      setGuardando(false);
    }
  };

  const renderDropdown = (
    id: string, 
    options: { value: string | number; label: string }[], 
    selectedValue: string | number | null, 
    onSelect: (value: any) => void,
    placeholder: string,
    icon?: React.ReactNode
  ) => (
    <div className={styles.dropdown}>
      <div 
        className={`${styles.dropdownTrigger} ${dropdownOpen === id ? styles.open : ''}`}
        onClick={() => setDropdownOpen(dropdownOpen === id ? null : id)}
      >
        {icon && <span className={styles.dropdownIcon}>{icon}</span>}
        <span className={selectedValue ? styles.dropdownValue : styles.dropdownPlaceholder}>
          {selectedValue !== null 
            ? options.find(o => o.value === selectedValue)?.label 
            : placeholder}
        </span>
        <ChevronDown size={18} className={styles.dropdownArrow} />
      </div>
      {dropdownOpen === id && (
        <div className={styles.dropdownList}>
          {options.map(option => (
            <div 
              key={option.value}
              className={`${styles.dropdownItem} ${option.value === selectedValue ? styles.selected : ''}`}
              onClick={() => {
                onSelect(option.value);
                setDropdownOpen(null);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner message="Cargando bancos..." />
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
          <h1 className={styles.title}>Contacto otro banco</h1>
          <p className={styles.subtitle}>Completa los datos del beneficiario</p>
        </div>
      </div>

      {/* Formulario */}
      <div className={styles.form}>
        {/* Banco */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Banco <span className={styles.required}>*</span>
          </label>
          {renderDropdown(
            'banco',
            bancos.map(b => ({ value: b.id, label: b.nombre })),
            formData.bancoId,
            (value) => handleChange('bancoId', value),
            'Selecciona un banco',
            <Building2 size={18} />
          )}
        </div>

        {/* Tipo identificación */}
        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Tipo ID <span className={styles.required}>*</span>
            </label>
            {renderDropdown(
              'tipoId',
              TIPOS_IDENTIFICACION,
              formData.tipoIdentificacion,
              (value) => handleChange('tipoIdentificacion', value),
              'Tipo'
            )}
          </div>
          <div className={styles.fieldGroupLarge}>
            <label className={styles.label}>
              Identificación <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              className={styles.input}
              value={formData.identificacion}
              onChange={(e) => handleChange('identificacion', e.target.value)}
              placeholder={formData.tipoIdentificacion === '00' ? '0000000000' : 'Número'}
            />
          </div>
        </div>

        {/* Nombre beneficiario */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Nombre del beneficiario <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <User size={18} className={styles.inputIcon} />
            <input
              type="text"
              className={styles.inputWithIcon}
              value={formData.nombreBeneficiario}
              onChange={(e) => handleChange('nombreBeneficiario', e.target.value)}
              placeholder="Nombre completo"
              maxLength={100}
            />
          </div>
        </div>

        {/* Tipo cuenta y número */}
        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Tipo cuenta <span className={styles.required}>*</span>
            </label>
            {renderDropdown(
              'tipoCuenta',
              TIPOS_CUENTA,
              formData.tipoCuenta,
              (value) => handleChange('tipoCuenta', value),
              'Tipo'
            )}
          </div>
          <div className={styles.fieldGroupLarge}>
            <label className={styles.label}>
              Número de cuenta <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <CreditCard size={18} className={styles.inputIcon} />
              <input
                type="text"
                className={styles.inputWithIcon}
                value={formData.numeroCuenta}
                onChange={(e) => handleChange('numeroCuenta', e.target.value)}
                placeholder="Número de cuenta"
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Email (opcional)</label>
          <input
            type="email"
            className={styles.input}
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="ejemplo@correo.com"
          />
        </div>

        {/* Alias */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Alias <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            className={styles.input}
            value={formData.alias}
            onChange={(e) => handleChange('alias', e.target.value)}
            placeholder="Ej: Proveedor Juan, etc."
            maxLength={50}
          />
        </div>

        {/* Comisión info */}
        <div className={styles.comisionInfo}>
          <AlertCircle size={18} />
          <span>Las transferencias interbancarias tienen una comisión de $0.41 USD</span>
        </div>

        {/* Error */}
        {error && (
          <div className={styles.error}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <ActionButton variant="outline" onClick={onBack} disabled={guardando}>
            Cancelar
          </ActionButton>
          <ActionButton onClick={handleGuardar} loading={guardando}>
            Guardar y continuar
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default NuevoContactoOtroBanco;
