/**
 * Módulo de Contactos
 * Gestión de contactos para transferencias
 */

import { useState, useEffect } from 'react';
import { Search, Plus, User, Mail, ChevronRight, Trash2, Loader2, X, AlertTriangle } from 'lucide-react';
import type { Cliente } from '../../types';
import clienteService, { type Contacto } from '../../services/clienteService';
import './Contactos.css';

interface ContactosProps {
  cliente: Cliente;
  onNavigate: (moduleId: string, data?: any) => void;
}

function Contactos({ cliente, onNavigate }: ContactosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para modal de agregar contacto
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  // Estados para confirmación de eliminación
  const [contactoAEliminar, setContactoAEliminar] = useState<Contacto | null>(null);
  const [eliminando, setEliminando] = useState(false);
  
  // Formulario de nuevo contacto
  const [formData, setFormData] = useState({
    conAlias: '',
    conNombreBeneficiario: '',
    conTipoIdentificacion: '00', // Cédula por defecto
    conIdentificacion: '',
    conNumeroCuenta: '',
    conEmail: '',
    conTipoCuenta: '00' // Ahorro por defecto
  });

  // Cargar contactos al montar
  useEffect(() => {
    cargarContactos();
  }, [cliente.id]);

  const cargarContactos = async () => {
    if (!cliente.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await clienteService.obtenerContactos(cliente.id);
      if (response.exito) {
        setContactos(response.datos || []);
      } else {
        setContactos([]);
      }
    } catch (err: any) {
      console.error('Error al cargar contactos:', err);
      setError('No se pudieron cargar los contactos');
      setContactos([]);
    } finally {
      setLoading(false);
    }
  };

  const contactosFiltrados = contactos.filter(c => 
    c.alias?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nombreBeneficiario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.numeroCuenta?.includes(searchTerm)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validarFormulario = () => {
    if (!formData.conAlias.trim()) {
      alert('El alias es requerido');
      return false;
    }
    if (!formData.conIdentificacion.trim()) {
      alert('La identificación es requerida');
      return false;
    }
    if (!formData.conNumeroCuenta.trim()) {
      alert('El número de cuenta es requerido');
      return false;
    }
    if (!formData.conEmail.trim()) {
      alert('El email es requerido');
      return false;
    }
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.conEmail)) {
      alert('El formato del email no es válido');
      return false;
    }
    return true;
  };

  const handleGuardarContacto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;
    
    try {
      setGuardando(true);
      const response = await clienteService.crearContacto(cliente.id, formData);
      
      if (response.exito) {
        alert('✅ Contacto guardado exitosamente');
        setShowModal(false);
        setFormData({
          conAlias: '',
          conNombreBeneficiario: '',
          conTipoIdentificacion: '00',
          conIdentificacion: '',
          conNumeroCuenta: '',
          conEmail: '',
          conTipoCuenta: '00'
        });
        cargarContactos();
      } else {
        alert('❌ ' + (response.mensaje || 'Error al guardar contacto'));
      }
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.mensaje || 'Error al guardar contacto'));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarContacto = async () => {
    if (!contactoAEliminar) return;
    
    try {
      setEliminando(true);
      const response = await clienteService.eliminarContacto(contactoAEliminar.id);
      
      if (response.exito) {
        alert('✅ Contacto eliminado exitosamente');
        setContactoAEliminar(null);
        cargarContactos();
      } else {
        alert('❌ ' + (response.mensaje || 'Error al eliminar contacto'));
      }
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.mensaje || 'Error al eliminar contacto'));
    } finally {
      setEliminando(false);
    }
  };

  const getTipoCuentaLabel = (tipo: string) => {
    switch (tipo) {
      case '00': return 'Ahorros';
      case '01': return 'Corriente';
      default: return tipo;
    }
  };

  if (loading) {
    return (
      <div className="contactos-module">
        <div className="contactos-loading">
          <Loader2 className="spinner" size={32} />
          <p>Cargando contactos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="contactos-module">
      <header className="contactos-header">
        <h1>Mis Contactos</h1>
        <button className="add-contacto-btn" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Agregar contacto
        </button>
      </header>

      <div className="contactos-search">
        <Search size={20} />
        <input 
          type="text"
          placeholder="Buscar por nombre o número de cuenta"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && (
        <div className="contactos-error">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {contactosFiltrados.length === 0 ? (
        <div className="contactos-empty">
          <User size={48} />
          <h3>No tienes contactos registrados</h3>
          <p>Agrega contactos para realizar transferencias más rápido</p>
          <button className="add-contacto-btn primary" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            Agregar mi primer contacto
          </button>
        </div>
      ) : (
        <div className="contactos-list">
          {contactosFiltrados.map((contacto) => (
            <div 
              key={contacto.id} 
              className="contacto-card"
              onClick={() => onNavigate('transferencias', { contacto })}
            >
              <div className="contacto-avatar">
                {(contacto.alias || contacto.nombreBeneficiario || 'C').charAt(0).toUpperCase()}
              </div>
              <div className="contacto-info">
                <span className="contacto-nombre">{contacto.alias || contacto.nombreBeneficiario}</span>
                <span className="contacto-cuenta">
                  {contacto.bancoNombre || 'Banco Pichincha'} - {getTipoCuentaLabel(contacto.tipoCuenta)} ****{contacto.numeroCuenta?.slice(-4)}
                </span>
                <div className="contacto-contacto">
                  {contacto.email && (
                    <span><Mail size={12} /> {contacto.email}</span>
                  )}
                </div>
              </div>
              <div className="contacto-actions">
                <button 
                  className="action-btn transfer" 
                  onClick={(e) => { e.stopPropagation(); onNavigate('transferencias', { contacto }); }}
                >
                  Transferir
                </button>
                <button 
                  className="action-btn delete" 
                  onClick={(e) => { e.stopPropagation(); setContactoAEliminar(contacto); }}
                >
                  <Trash2 size={16} />
                </button>
                <ChevronRight size={20} className="arrow" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para agregar contacto */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Agregar Contacto</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleGuardarContacto}>
              <div className="form-group">
                <label>Alias / Nombre *</label>
                <input
                  type="text"
                  name="conAlias"
                  value={formData.conAlias}
                  onChange={handleInputChange}
                  placeholder="Ej: Mi hermano Juan"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Nombre del beneficiario</label>
                <input
                  type="text"
                  name="conNombreBeneficiario"
                  value={formData.conNombreBeneficiario}
                  onChange={handleInputChange}
                  placeholder="Nombre completo"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de identificación *</label>
                  <select
                    name="conTipoIdentificacion"
                    value={formData.conTipoIdentificacion}
                    onChange={handleInputChange}
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
                    name="conIdentificacion"
                    value={formData.conIdentificacion}
                    onChange={handleInputChange}
                    placeholder="Número de identificación"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de cuenta *</label>
                  <select
                    name="conTipoCuenta"
                    value={formData.conTipoCuenta}
                    onChange={handleInputChange}
                  >
                    <option value="00">Ahorros</option>
                    <option value="01">Corriente</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Número de cuenta *</label>
                  <input
                    type="text"
                    name="conNumeroCuenta"
                    value={formData.conNumeroCuenta}
                    onChange={handleInputChange}
                    placeholder="Número de cuenta"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="conEmail"
                  value={formData.conEmail}
                  onChange={handleInputChange}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? <><Loader2 className="spinner" size={16} /> Guardando...</> : 'Guardar Contacto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {contactoAEliminar && (
        <div className="modal-overlay" onClick={() => setContactoAEliminar(null)}>
          <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Eliminar Contacto</h2>
              <button className="modal-close" onClick={() => setContactoAEliminar(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <AlertTriangle size={48} color="#f44336" />
              <p>¿Estás seguro de eliminar el contacto <strong>{contactoAEliminar.alias}</strong>?</p>
              <p className="text-muted">Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setContactoAEliminar(null)}>
                Cancelar
              </button>
              <button className="btn-danger" onClick={handleEliminarContacto} disabled={eliminando}>
                {eliminando ? <><Loader2 className="spinner" size={16} /> Eliminando...</> : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Contactos;
