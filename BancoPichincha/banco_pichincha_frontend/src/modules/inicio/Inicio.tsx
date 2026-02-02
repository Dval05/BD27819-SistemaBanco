/**
 * Módulo de Inicio
 * Página principal del dashboard
 */

import { useState, useEffect } from 'react';
import { ChevronRight, Loader2, Eye, EyeOff, Users, CreditCard, Plus, X, Lock, Unlock, Trash2, Ban, AlertTriangle } from 'lucide-react';
import type { Cliente } from '../../types';
import clienteService, { type Cuenta, type Tarjeta, type InversionProducto } from '../../services/clienteService';
import './Inicio.css';

interface InicioProps {
  cliente: Cliente;
  onNavigate: (moduleId: string, data?: any) => void;
  showSaldos: boolean;
  onToggleSaldos: () => void;
}

interface TarjetaEstado {
  id_tarjeta: string;
  numero: string;
  estado: string;
  estadoDescripcion: string;
  puedeDesbloquear: boolean;
  puedeBloquear: boolean;
  puedeCancelar: boolean;
}

function Inicio({ cliente, onNavigate, showSaldos, onToggleSaldos }: InicioProps) {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [inversiones, setInversiones] = useState<InversionProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [creandoCuenta, setCreandoCuenta] = useState(false);
  const [activeTab, setActiveTab] = useState<'todos' | 'cuentas' | 'tarjetas' | 'prestamos' | 'inversiones'>('todos');
  
  // Estados para modal de opciones de tarjeta
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState<Tarjeta | null>(null);
  const [tarjetaEstado, setTarjetaEstado] = useState<TarjetaEstado | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState<'cancelar' | 'bloquear-permanente' | null>(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const cargarProductos = async () => {
      if (!cliente.id) return;
      
      try {
        setLoading(true);
        const productos = await clienteService.obtenerProductos(cliente.id);
        setCuentas(productos.cuentas);
        setTarjetas(productos.tarjetas);
        setInversiones(productos.inversiones);
      } catch (error) {
        console.error('Error cargando productos:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarProductos();
  }, [cliente.id]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const productTabs = [
    { id: 'todos', label: 'Todos' },
    { id: 'cuentas', label: 'Cuentas' },
    { id: 'tarjetas', label: 'Tarjetas de crédito' },
    { id: 'prestamos', label: 'Préstamos' },
    { id: 'inversiones', label: 'Inversiones' },
  ];

  const getProductosToShow = () => {
    switch (activeTab) {
      case 'cuentas':
        return { cuentas, tarjetas: [], inversiones: [] };
      case 'tarjetas':
        return { cuentas: [], tarjetas, inversiones: [] };
      case 'inversiones':
        return { cuentas: [], tarjetas: [], inversiones };
      case 'prestamos':
        return { cuentas: [], tarjetas: [], inversiones: [] };
      default:
        return { cuentas, tarjetas, inversiones };
    }
  };

  const productos = getProductosToShow();
  const hasProductos = productos.cuentas.length > 0 || productos.tarjetas.length > 0 || productos.inversiones.length > 0;

  const crearCuentaAhorro = async () => {
    if (!cliente.id) return;
    
    try {
      setCreandoCuenta(true);
      const response = await clienteService.crearCuentaAhorro(cliente.id);
      
      if (response.ok) {
        alert('✅ Cuenta de ahorro creada exitosamente');
        // Recargar productos
        const productos = await clienteService.obtenerProductos(cliente.id);
        setCuentas(productos.cuentas);
      }
    } catch (error: any) {
      console.error('Error creando cuenta:', error);
      alert('❌ Error al crear cuenta de ahorro: ' + (error.response?.data?.msg || error.message));
    } finally {
      setCreandoCuenta(false);
    }
  };

  // Función para abrir modal de opciones de tarjeta
  const abrirOpcionesTarjeta = async (tarjeta: Tarjeta, e: React.MouseEvent) => {
    e.stopPropagation();
    setTarjetaSeleccionada(tarjeta);
    setMostrarModal(true);
    
    try {
      const response = await clienteService.obtenerEstadoTarjeta(tarjeta.id);
      if (response.success) {
        setTarjetaEstado(response.data);
      }
    } catch (error) {
      console.error('Error obteniendo estado de tarjeta:', error);
    }
  };

  // Función para cerrar modal
  const cerrarModal = () => {
    setMostrarModal(false);
    setTarjetaSeleccionada(null);
    setTarjetaEstado(null);
    setMostrarConfirmacion(null);
  };

  // Función para bloquear tarjeta
  const bloquearTarjeta = async (tipo: 'temporal' | 'permanente') => {
    if (!tarjetaSeleccionada) return;
    
    if (tipo === 'permanente' && mostrarConfirmacion !== 'bloquear-permanente') {
      setMostrarConfirmacion('bloquear-permanente');
      return;
    }
    
    try {
      setProcesando(true);
      const response = await clienteService.bloquearTarjeta(tarjetaSeleccionada.id, tipo);
      if (response.success) {
        alert(`✅ ${response.message}`);
        // Recargar productos
        const productos = await clienteService.obtenerProductos(cliente.id);
        setTarjetas(productos.tarjetas);
        cerrarModal();
      }
    } catch (error: any) {
      alert('❌ Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcesando(false);
    }
  };

  // Función para desbloquear tarjeta
  const desbloquearTarjeta = async () => {
    if (!tarjetaSeleccionada) return;
    
    try {
      setProcesando(true);
      const response = await clienteService.desbloquearTarjeta(tarjetaSeleccionada.id);
      if (response.success) {
        alert(`✅ ${response.message}`);
        // Recargar productos
        const productos = await clienteService.obtenerProductos(cliente.id);
        setTarjetas(productos.tarjetas);
        cerrarModal();
      }
    } catch (error: any) {
      alert('❌ Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcesando(false);
    }
  };

  // Función para cancelar tarjeta
  const cancelarTarjeta = async () => {
    if (!tarjetaSeleccionada) return;
    
    if (mostrarConfirmacion !== 'cancelar') {
      setMostrarConfirmacion('cancelar');
      return;
    }
    
    try {
      setProcesando(true);
      const response = await clienteService.cancelarTarjeta(tarjetaSeleccionada.id);
      if (response.success) {
        alert(`✅ ${response.message}`);
        // Recargar productos
        const productos = await clienteService.obtenerProductos(cliente.id);
        setTarjetas(productos.tarjetas);
        cerrarModal();
      }
    } catch (error: any) {
      alert('❌ Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcesando(false);
    }
  };

  // Obtener el color de estado de la tarjeta
  const getEstadoColor = (estado?: string) => {
    switch (estado) {
      case '00': return '#4caf50'; // Activa - Verde
      case '01': return '#ff9800'; // Bloqueada temporal - Naranja
      case '02': return '#f44336'; // Bloqueada permanente - Rojo
      case '03': return '#9e9e9e'; // Cancelada - Gris
      default: return '#4caf50';
    }
  };

  return (
    <div className="inicio-module">
      <section className="products-section">
        <div className="products-header">
          <h2>Mis productos</h2>
          <div className="products-actions">
            {activeTab === 'inversiones' ? (
              <button 
                className="crear-cuenta-btn"
                onClick={() => onNavigate('inversiones')}
              >
                <Plus size={16} />
                Nueva Inversión
              </button>
            ) : (
              <button 
                className="crear-cuenta-btn"
                onClick={crearCuentaAhorro}
                disabled={creandoCuenta}
              >
                {creandoCuenta ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Crear Cuenta de Ahorro
                  </>
                )}
              </button>
            )}
            <button 
              className="toggle-saldos"
              onClick={onToggleSaldos}
            >
              {showSaldos ? <EyeOff size={16} /> : <Eye size={16} />}
              {showSaldos ? 'Ocultar saldos' : 'Mostrar saldos'}
            </button>
            <a href="#" className="ver-todos" onClick={(e) => { e.preventDefault(); onNavigate('productos'); }}>
              Ver todos →
            </a>
          </div>
        </div>

        <div className="product-tabs">
          {productTabs.map((tab) => (
            <button
              key={tab.id}
              className={`product-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="products-content">
          {loading ? (
            <div className="loading-productos">
              <Loader2 className="spinner" size={32} />
              <p>Cargando productos...</p>
            </div>
          ) : !hasProductos && activeTab === 'inversiones' ? (
            <div className="inversion-promo-card">
              <div className="inversion-promo-icon">📊</div>
              <p className="inversion-promo-text">
                ¡Utiliza tus cuentas de ahorros para invertir desde $ 500.00!
              </p>
              <button className="inversion-promo-btn" onClick={() => onNavigate('inversiones')}>
                Invertir ahora →
              </button>
            </div>
          ) : !hasProductos ? (
            <div className="no-productos">
              <p>No tienes productos en esta categoría.</p>
            </div>
          ) : (
            <div className="products-carousel">
              <button className="carousel-arrow left" disabled>
                <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
              </button>
              
              <div className="product-cards">
                {productos.cuentas.map((cuenta) => (
                  <div 
                    key={cuenta.id} 
                    className="product-card savings clickable"
                    onClick={() => onNavigate('cuenta-detalle', cuenta)}
                  >
                    <div className="card-header">
                      <span className="card-owner">{cuenta.nombre}</span>
                      <span className="card-number">Nro. {cuenta.numero}</span>
                    </div>
                    <div className="card-balance">
                      <span className="balance-label">Saldo disponible</span>
                      <span className="balance-amount">
                        {showSaldos ? formatMoney(cuenta.saldo) : '$ ***'}
                      </span>
                    </div>
                    <div className="card-action">
                      <span>Ver movimientos →</span>
                    </div>
                  </div>
                ))}

                {productos.inversiones.map((inv) => (
                  <div 
                    key={inv.id} 
                    className="product-card savings clickable"
                    onClick={() => onNavigate('inversiones', inv)}
                  >
                    <div className="card-header">
                      <span className="card-owner">{inv.nombre}</span>
                      <span className="card-number">Plazo: {inv.plazo} días</span>
                    </div>
                    <div className="card-balance">
                      <span className="balance-label">Monto invertido</span>
                      <span className="balance-amount">
                        {showSaldos ? formatMoney(inv.monto) : '$ ***'}
                      </span>
                    </div>
                  </div>
                ))}

                {productos.tarjetas.map((tarjeta) => (
                  <div 
                    key={tarjeta.id} 
                    className={`product-card credit-card clickable ${tarjeta.estadoCodigo !== '00' ? 'tarjeta-bloqueada' : ''}`}
                    onClick={(e) => abrirOpcionesTarjeta(tarjeta, e)}
                  >
                    {tarjeta.estadoCodigo && tarjeta.estadoCodigo !== '00' && (
                      <div className="tarjeta-estado-badge" style={{ backgroundColor: getEstadoColor(tarjeta.estadoCodigo) }}>
                        <Lock size={12} />
                        <span>{tarjeta.estado}</span>
                      </div>
                    )}
                    <div className="tarjeta-chip"></div>
                    <div className="tarjeta-numero">
                      {showSaldos ? tarjeta.numero.replace(/(\d{4})/g, '$1 ').trim() : '**** **** **** ' + tarjeta.numero.slice(-4)}
                    </div>
                    <div className="tarjeta-info-row">
                      <div className="tarjeta-vence">
                        <span className="tarjeta-label">VENCE</span>
                        <span className="tarjeta-value">{new Date(tarjeta.fechaExpiracion).toLocaleDateString('es-EC', { month: '2-digit', year: '2-digit' })}</span>
                      </div>
                      <div className="tarjeta-cvv">
                        <span className="tarjeta-label">CVV</span>
                        <span className="tarjeta-value">{showSaldos ? tarjeta.cvv || '***' : '***'}</span>
                      </div>
                    </div>
                    <div className="tarjeta-footer">
                      <span className="tarjeta-titular">{cliente.primerNombre?.toUpperCase() || ''} {cliente.segundoNombre?.toUpperCase() || ''} {cliente.primerApellido?.toUpperCase() || ''} {cliente.segundoApellido?.toUpperCase() || ''}</span>
                      <span className="visa-logo">VISA</span>
                    </div>
                    <div className="tarjeta-click-hint">
                      <span>Click para opciones</span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="carousel-arrow right">
                <ChevronRight size={20} />
              </button>

              <div className="carousel-dots">
                <span className="dot active"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bottom-sections">
        <div className="quick-access">
          <h3>Accesos directos <span className="dot active">●</span></h3>
          <div className="quick-cards">
            <div className="quick-card" onClick={() => onNavigate('contactos')}>
              <Users size={24} />
              <span>Contactos</span>
            </div>
            <div className="quick-card" onClick={() => onNavigate('productos')}>
              <CreditCard size={24} />
              <span>Productos</span>
            </div>
          </div>
        </div>

        <div className="offers">
          <h3>Ofertas para ti</h3>
          <div className="offer-card" onClick={() => onNavigate('inversiones')}>
            <p>Descubre las mejores opciones de inversión</p>
          </div>
        </div>
      </section>

      {/* Modal de opciones de tarjeta */}
      {mostrarModal && tarjetaSeleccionada && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-tarjeta" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Opciones de Tarjeta</h3>
              <button className="modal-close" onClick={cerrarModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-tarjeta-info">
              <div className="modal-tarjeta-preview">
                <CreditCard size={32} />
                <div>
                  <span className="modal-tarjeta-numero">**** {tarjetaSeleccionada.numero.slice(-4)}</span>
                  <span className="modal-tarjeta-estado" style={{ color: getEstadoColor(tarjetaEstado?.estado) }}>
                    {tarjetaEstado?.estadoDescripcion || 'Cargando...'}
                  </span>
                </div>
              </div>
            </div>

            {mostrarConfirmacion ? (
              <div className="modal-confirmacion">
                <AlertTriangle size={48} color="#f44336" />
                <h4>¿Estás seguro?</h4>
                <p>
                  {mostrarConfirmacion === 'cancelar' 
                    ? 'Esta acción cancelará permanentemente tu tarjeta. No podrás usarla nuevamente.'
                    : 'Esta acción bloqueará permanentemente tu tarjeta. No podrás desbloquearla.'
                  }
                </p>
                <div className="modal-confirmacion-btns">
                  <button className="btn-cancelar-accion" onClick={() => setMostrarConfirmacion(null)}>
                    Volver
                  </button>
                  <button 
                    className="btn-confirmar-peligro" 
                    onClick={mostrarConfirmacion === 'cancelar' ? cancelarTarjeta : () => bloquearTarjeta('permanente')}
                    disabled={procesando}
                  >
                    {procesando ? <Loader2 size={16} className="spinner" /> : 'Confirmar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="modal-opciones">
                {tarjetaEstado?.puedeBloquear && (
                  <>
                    <button 
                      className="opcion-tarjeta opcion-bloquear-temp"
                      onClick={() => bloquearTarjeta('temporal')}
                      disabled={procesando}
                    >
                      <Lock size={20} />
                      <div>
                        <span className="opcion-titulo">Bloquear temporalmente</span>
                        <span className="opcion-desc">Podrás desbloquearla cuando quieras</span>
                      </div>
                    </button>
                    
                    <button 
                      className="opcion-tarjeta opcion-bloquear-perm"
                      onClick={() => bloquearTarjeta('permanente')}
                      disabled={procesando}
                    >
                      <Ban size={20} />
                      <div>
                        <span className="opcion-titulo">Bloquear permanentemente</span>
                        <span className="opcion-desc">No podrás desbloquearla</span>
                      </div>
                    </button>
                  </>
                )}

                {tarjetaEstado?.puedeDesbloquear && (
                  <button 
                    className="opcion-tarjeta opcion-desbloquear"
                    onClick={desbloquearTarjeta}
                    disabled={procesando}
                  >
                    <Unlock size={20} />
                    <div>
                      <span className="opcion-titulo">Desbloquear tarjeta</span>
                      <span className="opcion-desc">Activa tu tarjeta nuevamente</span>
                    </div>
                  </button>
                )}

                {tarjetaEstado?.puedeCancelar && (
                  <button 
                    className="opcion-tarjeta opcion-cancelar"
                    onClick={cancelarTarjeta}
                    disabled={procesando}
                  >
                    <Trash2 size={20} />
                    <div>
                      <span className="opcion-titulo">Cancelar tarjeta</span>
                      <span className="opcion-desc">Eliminar definitivamente (irreversible)</span>
                    </div>
                  </button>
                )}

                {!tarjetaEstado && (
                  <div className="modal-loading">
                    <Loader2 size={24} className="spinner" />
                    <span>Cargando opciones...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Inicio;
