/**
 * Módulo de Inicio
 * Página principal del dashboard
 */

import { useState, useEffect } from 'react';
import { ChevronRight, Loader2, Eye, EyeOff, Users, CreditCard, Plus } from 'lucide-react';
import type { Cliente } from '../../types';
import clienteService, { type Cuenta, type Tarjeta, type InversionProducto } from '../../services/clienteService';
import './Inicio.css';

interface InicioProps {
  cliente: Cliente;
  onNavigate: (moduleId: string, data?: any) => void;
  showSaldos: boolean;
  onToggleSaldos: () => void;
}

function Inicio({ cliente, onNavigate, showSaldos, onToggleSaldos }: InicioProps) {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [inversiones, setInversiones] = useState<InversionProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [creandoCuenta, setCreandoCuenta] = useState(false);
  const [activeTab, setActiveTab] = useState<'todos' | 'cuentas' | 'tarjetas' | 'prestamos' | 'inversiones'>('todos');

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

  return (
    <div className="inicio-module">
      <section className="products-section">
        <div className="products-header">
          <h2>Mis productos</h2>
          <div className="products-actions">
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
                    className="product-card credit-card clickable"
                    onClick={() => onNavigate('tarjeta-detalle', tarjeta)}
                  >
                    <div className="card-header">
                      <span className="card-owner">{tarjeta.nombre}</span>
                      <span className="card-number">Nro. {tarjeta.numero}</span>
                    </div>
                    <div className="card-balance">
                      <span className="balance-label">Vence: {new Date(tarjeta.fechaExpiracion).toLocaleDateString('es-EC')}</span>
                      <div className="balance-row">
                        <span className="balance-amount">
                          {showSaldos ? formatMoney(tarjeta.saldo) : '$ ***'}
                        </span>
                        <span className="visa-logo">VISA</span>
                      </div>
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
    </div>
  );
}

export default Inicio;
