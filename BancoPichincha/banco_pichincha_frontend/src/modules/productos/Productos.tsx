/**
 * Módulo de Productos
 * Lista completa de productos del cliente
 */

import { useState, useEffect } from 'react';
import { ChevronRight, Loader2, Eye, EyeOff, Wallet, CreditCard, TrendingUp } from 'lucide-react';
import type { Cliente } from '../../types';
import clienteService, { type Cuenta, type Tarjeta, type InversionProducto } from '../../services/clienteService';
import './Productos.css';

interface ProductosProps {
  cliente: Cliente;
  onNavigate: (moduleId: string, data?: any) => void;
  showSaldos: boolean;
  onToggleSaldos: () => void;
}

function Productos({ cliente, onNavigate, showSaldos, onToggleSaldos }: ProductosProps) {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [inversiones, setInversiones] = useState<InversionProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [limpiando, setLimpiando] = useState(false);

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
        // Error silencioso
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

  const limpiarTarjetasPrueba = async () => {
    if (!confirm('¿Eliminar tarjetas de prueba sin registros válidos?')) return;
    
    try {
      setLimpiando(true);
      const response = await fetch(`http://localhost:3000/api/cajero/tarjeta/limpiar-pruebas/${cliente.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ ${data.eliminadas} tarjetas eliminadas`);
        // Recargar productos
        const productos = await clienteService.obtenerProductos(cliente.id);
        setTarjetas(productos.tarjetas);
      } else {
        alert('❌ Error: ' + data.message);
      }
    } catch (error) {
      alert('❌ Error al limpiar tarjetas');
    } finally {
      setLimpiando(false);
    }
  };

  if (loading) {
    return (
      <div className="productos-module loading">
        <Loader2 className="spinner" size={32} />
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="productos-module">
      <header className="productos-header">
        <h1>Mis Productos</h1>
        <button className="toggle-saldos" onClick={onToggleSaldos}>
          {showSaldos ? <EyeOff size={16} /> : <Eye size={16} />}
          {showSaldos ? 'Ocultar saldos' : 'Mostrar saldos'}
        </button>
      </header>

      {/* Cuentas */}
      <section className="productos-section">
        <div className="section-header">
          <Wallet size={24} />
          <h2>Cuentas</h2>
          <span className="count">{cuentas.length}</span>
        </div>
        
        {cuentas.length === 0 ? (
          <div className="empty-section">
            <p>No tienes cuentas registradas</p>
          </div>
        ) : (
          <div className="productos-grid">
            {cuentas.map((cuenta) => (
              <div 
                key={cuenta.id} 
                className="producto-card cuenta"
                onClick={() => onNavigate('cuenta-detalle', cuenta)}
              >
                <div className="producto-info">
                  <span className="producto-nombre">{cuenta.nombre}</span>
                  <span className="producto-numero">Nro. {cuenta.numero}</span>
                </div>
                <div className="producto-saldo">
                  <span className="saldo-label">Saldo disponible</span>
                  <span className="saldo-valor">
                    {showSaldos ? formatMoney(cuenta.saldo) : '$ ***.**'}
                  </span>
                </div>
                <ChevronRight size={20} className="arrow" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tarjetas */}
      <section className="productos-section">
        <div className="section-header">
          <CreditCard size={24} />
          <h2>Tarjetas</h2>
          <span className="count">{tarjetas.length}</span>
          {tarjetas.length > 2 && (
            <button 
              className="limpiar-btn" 
              onClick={limpiarTarjetasPrueba}
              disabled={limpiando}
              style={{ marginLeft: 'auto', fontSize: '11px', padding: '4px 8px' }}
            >
              {limpiando ? 'Limpiando...' : '🧹 Limpiar pruebas'}
            </button>
          )}
        </div>
        
        {tarjetas.length === 0 ? (
          <div className="empty-section">
            <p>No tienes tarjetas registradas</p>
            <button 
              className="solicitar-btn"
              onClick={() => onNavigate('solicitudes')}
            >
              Solicitar tarjeta
            </button>
          </div>
        ) : (
          <div className="productos-grid">
            {tarjetas.map((tarjeta) => (
              <div 
                key={tarjeta.id} 
                className="producto-card tarjeta"
                onClick={() => onNavigate('tarjeta-detalle', tarjeta)}
              >
                <div className="producto-info">
                  <span className="producto-nombre">{tarjeta.nombre}</span>
                  <span className="producto-numero">**** {tarjeta.numero.slice(-4)}</span>
                  <span className="producto-tipo">{tarjeta.subtipo === 'debito' ? 'Débito' : 'Crédito'}</span>
                </div>
                <div className="producto-saldo">
                  <span className="saldo-label">
                    {tarjeta.subtipo === 'debito' ? 'Saldo' : 'Cupo disponible'}
                  </span>
                  <span className="saldo-valor">
                    {showSaldos ? formatMoney(tarjeta.subtipo === 'debito' ? tarjeta.saldoActual : tarjeta.cupoDisponible) : '$ ***.**'}
                  </span>
                </div>
                <ChevronRight size={20} className="arrow" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Inversiones */}
      <section className="productos-section">
        <div className="section-header">
          <TrendingUp size={24} />
          <h2>Inversiones</h2>
          <span className="count">{inversiones.length}</span>
        </div>
        
        {inversiones.length === 0 ? (
          <div className="empty-section">
            <p>No tienes inversiones activas</p>
            <button 
              className="solicitar-btn"
              onClick={() => onNavigate('inversiones')}
            >
              Ver opciones de inversión
            </button>
          </div>
        ) : (
          <div className="productos-grid">
            {inversiones.map((inv) => (
              <div 
                key={inv.id} 
                className="producto-card inversion"
                onClick={() => onNavigate('inversiones', inv)}
              >
                <div className="producto-info">
                  <span className="producto-nombre">{inv.nombre}</span>
                  <span className="producto-numero">Plazo: {inv.plazo} días</span>
                </div>
                <div className="producto-saldo">
                  <span className="saldo-label">Monto invertido</span>
                  <span className="saldo-valor">
                    {showSaldos ? formatMoney(inv.monto) : '$ ***.**'}
                  </span>
                </div>
                <ChevronRight size={20} className="arrow" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Productos;
