/**
 * Módulo de Contactos
 * Gestión de contactos para transferencias
 */

import { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2, Mail, CreditCard, Building2, User, Loader2, X, CheckCircle2 } from 'lucide-react';
import { useNotificacion } from '../../contexts/NotificacionContext';
import type { Cliente } from '../../types';
import contactosService, { type Contacto, type Banco } from '../../services/contactosService';
import './Contactos.css';

interface ContactosProps {
  cliente: Cliente;
}

function Contactos({ cliente }: ContactosProps) {
  const { exito, error: notificarError, advertencia } = useNotificacion();
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validandoCuenta, setValidandoCuenta] = useState(false);
  const [cuentaValidada, setCuentaValidada] = useState(false);
  const [cuentaEsBancoPichincha, setCuentaEsBancoPichincha] = useState(false);
  const [formData, setFormData] = useState({
    alias: '',
    nombreBeneficiario: '',
    tipoIdentificacion: '00',
    identificacion: '',
    numeroCuenta: '',
    email: '',
    tipoCuenta: '00',
    id_banco: ''
  });

  useEffect(() => {
    cargarContactos();
    cargarBancos();
  }, [cliente.id]);

  const cargarContactos = async () => {
    try {
      setLoading(true);
      const data = await contactosService.obtenerContactos(cliente.id);
      setContactos(data);
    } catch (error) {
      console.error('Error cargando contactos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarBancos = async () => {
    try {
      const data = await contactosService.obtenerBancos();
      setBancos(data);
    } catch (error) {
      console.error('Error cargando bancos:', error);
    }
  };

  const abrirModal = (contacto?: Contacto) => {
    if (contacto) {
      setEditingId(contacto.id);
      setFormData({
        alias: contacto.alias,
        nombreBeneficiario: contacto.nombreBeneficiario || '',
        tipoIdentificacion: contacto.tipoIdentificacion,
        identificacion: contacto.identificacion,
        numeroCuenta: contacto.numeroCuenta,
        email: contacto.email,
        tipoCuenta: contacto.tipoCuenta,
        id_banco: contacto.banco?.id || ''
      });
      setCuentaValidada(true);
    } else {
      setEditingId(null);
      setFormData({
        alias: '',
        nombreBeneficiario: '',
        tipoIdentificacion: '00',
        identificacion: '',
        numeroCuenta: '',
        email: '',
        tipoCuenta: '00',
        id_banco: ''
      });
      setCuentaValidada(false);
      setCuentaEsBancoPichincha(false);
    }
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingId(null);
    setCuentaValidada(false);
    setCuentaEsBancoPichincha(false);
  };

  const validarCuenta = async () => {
    if (!formData.numeroCuenta || formData.numeroCuenta.length < 8) {
      advertencia('Ingrese un número de cuenta válido', 'Validación de Cuenta');
      return;
    }

    try {
      setValidandoCuenta(true);
      const resultado = await contactosService.validarCuenta(formData.numeroCuenta);

      if (resultado.esBancoPichincha && resultado.datos) {
        // Cuenta pertenece a Banco Pichincha - autocompletar
        setCuentaEsBancoPichincha(true);
        setCuentaValidada(true);
        setFormData({
          ...formData,
          tipoIdentificacion: resultado.datos.tipoIdentificacion,
          identificacion: resultado.datos.identificacion,
          nombreBeneficiario: resultado.datos.nombreBeneficiario,
          email: resultado.datos.email,
          tipoCuenta: resultado.datos.tipoCuenta,
          id_banco: '' // Banco Pichincha
        });
        exito(resultado.message + '\n\nDatos autocompletados automáticamente.', 'Cuenta Validada');
      } else {
        // Cuenta NO pertenece a Banco Pichincha - permitir ingreso manual
        setCuentaEsBancoPichincha(false);
        setCuentaValidada(true);
        advertencia(resultado.message, 'Cuenta Externa');
      }
    } catch (error: any) {
      notificarError('Error al validar cuenta: ' + error.message, 'Error de Validación');
    } finally {
      setValidandoCuenta(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await contactosService.editarContacto(editingId, {
          alias: formData.alias,
          nombreBeneficiario: formData.nombreBeneficiario,
          email: formData.email,
          id_banco: formData.id_banco || null
        });
        exito('Contacto actualizado exitosamente', 'Actualización Exitosa');
      } else {
        await contactosService.crearContacto({
          id_persona: cliente.id,
          ...formData,
          id_banco: formData.id_banco || null
        });
        exito('Contacto creado exitosamente', 'Creación Exitosa');
      }
      
      cerrarModal();
      cargarContactos();
    } catch (error: any) {
      notificarError(error.message, 'Error');
    }
  };

  const handleEliminar = async (id: string, alias: string) => {
    if (!confirm(`¿Eliminar contacto "${alias}"?`)) return;
    
    try {
      await contactosService.eliminarContacto(id);
      exito('Contacto eliminado exitosamente', 'Eliminación Exitosa');
      cargarContactos();
    } catch (error: any) {
      notificarError(error.message, 'Error');
    }
  };

  const limpiarTodosContactos = async () => {
    if (!confirm('⚠️ ¿Eliminar TODOS tus contactos? Esta acción no se puede deshacer.')) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/contactos/limpiar/${cliente.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        exito(`${data.eliminados} contactos eliminados exitosamente`, 'Limpieza Completada');
        cargarContactos();
      } else {
        notificarError(data.message, 'Error');
      }
    } catch (error) {
      notificarError('Error al limpiar contactos', 'Error');
    }
  };

  const getTipoCuentaLabel = (tipo: string) => {
    return tipo === '00' ? 'Corriente' : 'Ahorros';
  };

  if (loading) {
    return (
      <div className="contactos-loading">
        <Loader2 className="spinner" size={32} />
        <p>Cargando contactos...</p>
      </div>
    );
  }

  return (
    <div className="contactos-module">
      <header className="contactos-header">
        <h1>Mis Contactos</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {contactos.length > 0 && (
            <button 
              className="btn-nuevo" 
              onClick={limpiarTodosContactos}
              style={{ background: '#EF5350', color: 'white' }}
            >
              🧹 Limpiar Todos
            </button>
          )}
          <button className="btn-nuevo" onClick={() => abrirModal()}>
            <UserPlus size={18} />
            Nuevo Contacto
          </button>
        </div>
      </header>

      {contactos.length === 0 ? (
        <div className="contactos-empty">
          <User size={64} />
          <h2>No tienes contactos guardados</h2>
          <p>Agrega contactos frecuentes para transferir más rápido</p>
          <button className="btn-primary" onClick={() => abrirModal()}>
            <UserPlus size={18} />
            Agregar primer contacto
          </button>
        </div>
      ) : (
        <div className="contactos-grid">
          {contactos.map((contacto) => (
            <div key={contacto.id} className="contacto-card">
              <div className="contacto-header">
                <h3>{contacto.alias}</h3>
                <div className="contacto-acciones">
                  <button 
                    className="btn-icon" 
                    onClick={() => abrirModal(contacto)}
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    className="btn-icon btn-danger" 
                    onClick={() => handleEliminar(contacto.id, contacto.alias)}
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="contacto-info">
                {contacto.nombreBeneficiario && (
                  <div className="info-item">
                    <User size={16} />
                    <span>{contacto.nombreBeneficiario}</span>
                  </div>
                )}
                
                <div className="info-item">
                  <CreditCard size={16} />
                  <span>{contacto.numeroCuenta}</span>
                  <span className="info-badge">{getTipoCuentaLabel(contacto.tipoCuenta)}</span>
                </div>
                
                <div className="info-item">
                  <Building2 size={16} />
                  <span>{contacto.banco ? contacto.banco.nombre : 'Banco Pichincha'}</span>
                </div>
                
                <div className="info-item">
                  <Mail size={16} />
                  <span>{contacto.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Editar Contacto' : 'Nuevo Contacto'}</h2>
              <button className="btn-close" onClick={cerrarModal}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Alias *</label>
                <input
                  type="text"
                  value={formData.alias}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                  placeholder="ej: Mamá, Hermano, Tienda..."
                  required
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label>Nombre del Beneficiario</label>
                <input
                  type="text"
                  value={formData.nombreBeneficiario}
                  onChange={(e) => setFormData({ ...formData, nombreBeneficiario: e.target.value })}
                  placeholder="Opcional"
                  disabled={!!editingId}
                />
              </div>

              {!editingId && (
                <>
                  <div className="form-group">
                    <label>Número de Cuenta *</label>
                    <div className="input-with-button">
                      <input
                        type="text"
                        value={formData.numeroCuenta}
                        onChange={(e) => {
                          setFormData({ ...formData, numeroCuenta: e.target.value });
                          setCuentaValidada(false);
                          setCuentaEsBancoPichincha(false);
                        }}
                        placeholder="1234567890"
                        required
                      />
                      <button
                        type="button"
                        className="btn-validar"
                        onClick={validarCuenta}
                        disabled={validandoCuenta || !formData.numeroCuenta || cuentaValidada}
                      >
                        {validandoCuenta ? (
                          <>
                            <Loader2 className="spinner" size={16} />
                            Validando...
                          </>
                        ) : cuentaValidada ? (
                          <>
                            <CheckCircle2 size={16} />
                            Validada
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16} />
                            Validar Cuenta
                          </>
                        )}
                      </button>
                    </div>
                    {cuentaValidada && (
                      <small className={cuentaEsBancoPichincha ? 'validacion-exito' : 'validacion-info'}>
                        {cuentaEsBancoPichincha 
                          ? '✅ Cuenta de Banco Pichincha - Datos autocompletados'
                          : 'ℹ️ Cuenta externa - Complete los datos manualmente'
                        }
                      </small>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Tipo de Identificación *</label>
                      <select
                        value={formData.tipoIdentificacion}
                        onChange={(e) => setFormData({ ...formData, tipoIdentificacion: e.target.value })}
                        required
                        disabled={cuentaEsBancoPichincha}
                      >
                        <option value="00">Cédula</option>
                        <option value="01">RUC</option>
                        <option value="02">Pasaporte</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Identificación *</label>
                      <input
                        type="text"
                        value={formData.identificacion}
                        onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                        placeholder="1234567890"
                        required
                        disabled={cuentaEsBancoPichincha}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Tipo de Cuenta *</label>
                    <select
                      value={formData.tipoCuenta}
                      onChange={(e) => setFormData({ ...formData, tipoCuenta: e.target.value })}
                      required
                      disabled={cuentaEsBancoPichincha}
                    >
                      <option value="00">Corriente</option>
                      <option value="01">Ahorros</option>
                    </select>
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  required
                  disabled={cuentaEsBancoPichincha}
                />
              </div>

              <div className="form-group">
                <label>Banco</label>
                <select
                  value={formData.id_banco}
                  onChange={(e) => setFormData({ ...formData, id_banco: e.target.value })}
                  disabled={!!editingId || cuentaEsBancoPichincha}
                >
                  <option value="">Banco Pichincha (mismo banco)</option>
                  {bancos.map((banco) => (
                    <option key={banco.id} value={banco.id}>
                      {banco.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Guardar Cambios' : 'Crear Contacto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Contactos;
