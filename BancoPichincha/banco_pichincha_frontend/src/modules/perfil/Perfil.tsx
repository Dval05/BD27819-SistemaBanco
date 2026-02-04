/**
 * Módulo de Perfil de Usuario
 * Muestra y permite editar la información personal del cliente
 */

import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  IdCard,
  Building2,
  MapPin,
  Edit3,
  Save,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Lock
} from 'lucide-react';
import type { Cliente } from '../../types';
import clienteService from '../../services/clienteService';
import './Perfil.css';

interface PerfilProps {
  cliente: Cliente;
  onNavigate: (moduleId: string, data?: any) => void;
}

interface PerfilCompleto extends Cliente {
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  fechaRegistro?: string;
}

function Perfil({ cliente }: PerfilProps) {
  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [formData, setFormData] = useState<Partial<PerfilCompleto>>({});

  useEffect(() => {
    cargarPerfil();
  }, [cliente.id_persona]);

  const cargarPerfil = async () => {
    if (!cliente.id_persona) return;

    try {
      setLoading(true);
      const perfilData = await clienteService.obtenerPerfil(cliente.id_persona);
      console.log('Perfil cargado:', perfilData);
      setPerfil(perfilData as PerfilCompleto);
      setFormData(perfilData);
    } catch (error) {
      console.error('Error cargando perfil:', error);
      setMensaje({ tipo: 'error', texto: 'Error al cargar el perfil' });
    } finally {
      setLoading(false);
    }
  };

  const getNombreCompleto = () => {
    if (!perfil) return '';
    
    if (perfil.tipoPersona === 'JURIDICA') {
      return perfil.razonSocial || perfil.nombreComercial || '';
    }
    
    const partes = [
      perfil.primerNombre,
      perfil.segundoNombre,
      perfil.primerApellido,
      perfil.segundoApellido
    ].filter(Boolean);
    
    return partes.join(' ') || perfil.nombre || '';
  };

  const getIniciales = () => {
    const nombre = getNombreCompleto();
    const partes = nombre.split(' ').filter(Boolean);
    
    if (partes.length >= 2) {
      return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    }
    
    return partes[0]?.substring(0, 2).toUpperCase() || 'US';
  };

  const formatFecha = (fecha?: string) => {
    if (!fecha) return 'No especificado';
    return new Date(fecha).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calcularEdad = (fechaNacimiento?: string) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const handleInputChange = (campo: string, valor: string) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMensaje({ tipo: 'success', texto: '✅ Perfil actualizado correctamente' });
      setEditando(false);
      await cargarPerfil();
      setTimeout(() => setMensaje(null), 3000);
    } catch (error) {
      console.error('Error guardando perfil:', error);
      setMensaje({ tipo: 'error', texto: 'Error al actualizar el perfil' });
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    setFormData(perfil || {});
    setEditando(false);
    setMensaje(null);
  };

  if (loading) {
    return (
      <div className="perfil-loading">
        <Loader2 className="spinner" size={48} />
        <p>Cargando perfil...</p>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="perfil-error">
        <AlertCircle size={48} />
        <p>No se pudo cargar la información del perfil</p>
        <button onClick={cargarPerfil} className="btn-retry">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <div className="perfil-titulo">
          <User size={28} />
          <h1>Mi Perfil</h1>
        </div>
        
        {!editando ? (
          <button onClick={() => setEditando(true)} className="btn-editar">
            <Edit3 size={18} />
            Editar perfil
          </button>
        ) : (
          <div className="acciones-edicion">
            <button onClick={handleCancelar} className="btn-cancelar" disabled={guardando}>
              <X size={18} />
              Cancelar
            </button>
            <button onClick={handleGuardar} className="btn-guardar" disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="spinner" size={18} />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {mensaje && (
        <div className={`mensaje-perfil ${mensaje.tipo}`}>
          {mensaje.tipo === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      <div className="perfil-content">
        {/* Avatar y Nombre */}
        <div className="perfil-avatar-section">
          <div className="perfil-avatar-grande">{getIniciales()}</div>
          <div className="perfil-nombre-section">
            <h2>{getNombreCompleto()}</h2>
            <p className="perfil-usuario">@{perfil.usuario}</p>
            <span className={`perfil-estado ${perfil.estado === 'ACTIVO' ? 'activo' : 'inactivo'}`}>
              {perfil.estado}
            </span>
          </div>
        </div>

        {/* Información Personal */}
        <div className="perfil-seccion">
          <h3 className="seccion-titulo">
            <IdCard size={20} />
            Información Personal
          </h3>
          
          <div className="info-grid">
            {perfil.tipoPersona === 'NATURAL' ? (
              <>
                <div className="info-item">
                  <label>Primer Nombre</label>
                  {editando ? (
                    <input
                      type="text"
                      value={formData.primerNombre || ''}
                      onChange={(e) => handleInputChange('primerNombre', e.target.value)}
                      className="input-editable"
                    />
                  ) : (
                    <p>{perfil.primerNombre || 'No especificado'}</p>
                  )}
                </div>

                <div className="info-item">
                  <label>Segundo Nombre</label>
                  {editando ? (
                    <input
                      type="text"
                      value={formData.segundoNombre || ''}
                      onChange={(e) => handleInputChange('segundoNombre', e.target.value)}
                      className="input-editable"
                    />
                  ) : (
                    <p>{perfil.segundoNombre || 'No especificado'}</p>
                  )}
                </div>

                <div className="info-item">
                  <label>Primer Apellido</label>
                  {editando ? (
                    <input
                      type="text"
                      value={formData.primerApellido || ''}
                      onChange={(e) => handleInputChange('primerApellido', e.target.value)}
                      className="input-editable"
                    />
                  ) : (
                    <p>{perfil.primerApellido || 'No especificado'}</p>
                  )}
                </div>

                <div className="info-item">
                  <label>Segundo Apellido</label>
                  {editando ? (
                    <input
                      type="text"
                      value={formData.segundoApellido || ''}
                      onChange={(e) => handleInputChange('segundoApellido', e.target.value)}
                      className="input-editable"
                    />
                  ) : (
                    <p>{perfil.segundoApellido || 'No especificado'}</p>
                  )}
                </div>

                <div className="info-item">
                  <label>
                    <Calendar size={16} />
                    Fecha de Nacimiento
                  </label>
                  {editando ? (
                    <input
                      type="date"
                      value={formData.fechaNacimiento || ''}
                      onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                      className="input-editable"
                    />
                  ) : (
                    <p>
                      {formatFecha(perfil.fechaNacimiento)}
                      {perfil.fechaNacimiento && (
                        <span className="info-secundaria"> ({calcularEdad(perfil.fechaNacimiento)} años)</span>
                      )}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="info-item">
                  <label>Razón Social</label>
                  {editando ? (
                    <input
                      type="text"
                      value={formData.razonSocial || ''}
                      onChange={(e) => handleInputChange('razonSocial', e.target.value)}
                      className="input-editable"
                    />
                  ) : (
                    <p>{perfil.razonSocial || 'No especificado'}</p>
                  )}
                </div>

                <div className="info-item">
                  <label>Nombre Comercial</label>
                  {editando ? (
                    <input
                      type="text"
                      value={formData.nombreComercial || ''}
                      onChange={(e) => handleInputChange('nombreComercial', e.target.value)}
                      className="input-editable"
                    />
                  ) : (
                    <p>{perfil.nombreComercial || 'No especificado'}</p>
                  )}
                </div>

                <div className="info-item">
                  <label>RUC</label>
                  <p>{perfil.ruc || 'No especificado'}</p>
                </div>
              </>
            )}

            <div className="info-item">
              <label>Tipo de Persona</label>
              <p className="tipo-persona">
                {perfil.tipoPersona === 'NATURAL' ? (
                  <><User size={16} /> Persona Natural</>
                ) : (
                  <><Building2 size={16} /> Persona Jurídica</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="perfil-seccion">
          <h3 className="seccion-titulo">
            <Phone size={20} />
            Información de Contacto
          </h3>
          
          <div className="info-grid">
            <div className="info-item">
              <label>
                <Mail size={16} />
                Correo Electrónico
              </label>
              {editando ? (
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input-editable"
                />
              ) : (
                <p>{perfil.email}</p>
              )}
            </div>

            <div className="info-item">
              <label>
                <Phone size={16} />
                Teléfono
              </label>
              {editando ? (
                <input
                  type="tel"
                  value={formData.telefono || ''}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  className="input-editable"
                />
              ) : (
                <p>{perfil.telefono || 'No especificado'}</p>
              )}
            </div>

            <div className="info-item info-item-full">
              <label>
                <MapPin size={16} />
                Dirección
              </label>
              {editando ? (
                <input
                  type="text"
                  value={formData.direccion || ''}
                  onChange={(e) => handleInputChange('direccion', e.target.value)}
                  className="input-editable"
                  placeholder="Ingresa tu dirección"
                />
              ) : (
                <p>{perfil.direccion || 'No especificado'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Información de Cuenta */}
        {perfil.numeroCuenta && (
          <div className="perfil-seccion">
            <h3 className="seccion-titulo">
              <Building2 size={20} />
              Información de Cuenta
            </h3>
            
            <div className="info-grid">
              <div className="info-item">
                <label>Número de Cuenta</label>
                <p className="codigo-mono">{perfil.numeroCuenta}</p>
              </div>

              {perfil.saldo !== undefined && (
                <div className="info-item">
                  <label>Saldo Disponible</label>
                  <p className="saldo-monto">${perfil.saldo.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Seguridad y Acceso */}
        <div className="perfil-seccion">
          <h3 className="seccion-titulo">
            <Lock size={20} />
            Seguridad y Acceso
          </h3>
          
          <div className="info-grid">
            <div className="info-item">
              <label>Nombre de Usuario</label>
              <p className="usuario-display">{perfil.usuario}</p>
            </div>

            <div className="info-item">
              <label>Contraseña</label>
              <button className="btn-cambiar-password">
                <Lock size={16} />
                Cambiar contraseña
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Perfil;
