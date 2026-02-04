import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  FileText,
  Settings,
  ArrowRightLeft,
  CreditCard,
  Landmark,
  ChevronRight,
  Loader2
} from 'lucide-react';
import type { Cuenta } from '../services/clienteService';
import clienteService from '../services/clienteService';
import './CuentaDetalle.css';

interface Movimiento {
  id: string;
  fecha: string;
  tipo: string;
  tipoDescripcion: string;
  descripcion: string;
  monto: number;
  montoOriginal: number;
  estado: string;
  estadoCodigo: string;
  idCuenta: string;
}

interface CuentaDetalleProps {
  cuenta: Cuenta;
  onBack: () => void;
}

function CuentaDetalle({ cuenta, onBack }: CuentaDetalleProps) {
  const [showSaldos, setShowSaldos] = useState(false);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('ultimos30');

  useEffect(() => {
    const cargarMovimientos = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await clienteService.obtenerMovimientos(cuenta.id);
        setMovimientos(data);
      } catch (err) {
        setError('No se pudieron cargar los movimientos. Intente nuevamente.');
        setMovimientos([]);
      } finally {
        setLoading(false);
      }
    };

    if (cuenta.id) {
      cargarMovimientos();
    }
  }, [cuenta.id, filtroTipo, filtroFecha]);

  const formatMoney = (amount: number) => {
    const formatted = new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'never'
    }).format(Math.abs(amount));
    
    if (amount > 0) {
      return `+${formatted}`;
    } else if (amount < 0) {
      return `-${formatted}`;
    }
    return formatted;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-EC', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Agrupar movimientos por fecha
  const movimientosAgrupados = movimientos.reduce((grupos, mov) => {
    const fecha = mov.fecha;
    if (!grupos[fecha]) {
      grupos[fecha] = [];
    }
    grupos[fecha].push(mov);
    return grupos;
  }, {} as Record<string, Movimiento[]>);

  const numeroCorto = cuenta.numero?.slice(-6) || '';

  return (
    <div className="cuenta-detalle">
      {/* Contenido principal - Movimientos */}
      <div className="cuenta-detalle-main">
        <header className="cuenta-detalle-header">
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <h1>AHO{numeroCorto}</h1>
        </header>

        <section className="movimientos-section">
          <h2>Movimientos de cuenta</h2>

          <div className="movimientos-filtros">
            <span className="filtro-label">Filtrar por:</span>
            <button className="filtro-btn">
              Tipo de movimiento
              <ChevronDown size={16} />
            </button>
            <button className="filtro-btn">
              Fecha
              <ChevronDown size={16} />
            </button>
            <button className="filtro-btn descargar">
              <Download size={16} />
              Descargar
            </button>
          </div>

          {loading ? (
            <div className="loading-movimientos">
              <Loader2 className="spinner" size={32} />
              <p>Cargando movimientos...</p>
            </div>
          ) : error ? (
            <div className="error-movimientos">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Reintentar</button>
            </div>
          ) : movimientos.length === 0 ? (
            <div className="sin-movimientos">
              <p>No hay movimientos registrados para esta cuenta.</p>
            </div>
          ) : (
            <div className="movimientos-lista">
              {Object.entries(movimientosAgrupados).map(([fecha, movs]) => (
                <div key={fecha} className="movimientos-grupo">
                  <div className="movimientos-fecha">
                    {formatDate(fecha)}
                  </div>
                  {movs.map((mov) => (
                    <div key={mov.id} className="movimiento-item">
                      <div className="movimiento-info">
                        <span className="movimiento-descripcion">{mov.descripcion || mov.tipoDescripcion}</span>
                        <span className="movimiento-tipo">{mov.tipoDescripcion}</span>
                      </div>
                      <div className="movimiento-montos">
                        <span className={`movimiento-monto ${mov.monto >= 0 ? 'positivo' : 'negativo'}`}>
                          {formatMoney(mov.monto)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Panel lateral derecho - Independiente */}
      <aside className="cuenta-detalle-sidebar">
        <div className="cuenta-info-card">
          <div className="cuenta-tipo-numero">
            <span className="cuenta-tipo">Ahorros</span>
            <span className="cuenta-numero-completo">Nro. {cuenta.numeroCompleto || cuenta.numero}</span>
          </div>

          <div className="cuenta-saldos">
            <div className="saldo-row">
              <span className="saldo-label">Saldo disponible</span>
              <div className="saldo-value-container">
                <span className="saldo-value">
                  {showSaldos ? `$ ${cuenta.saldo?.toFixed(2) || '0.00'}` : '$ **.**'}
                </span>
                <button 
                  className="toggle-saldos-btn"
                  onClick={() => setShowSaldos(!showSaldos)}
                >
                  {showSaldos ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showSaldos ? 'Ocultar saldos' : 'Mostrar saldos'}
                </button>
              </div>
            </div>
            <div className="saldo-row">
              <span className="saldo-label">Saldo contable</span>
              <span className="saldo-value">
                {showSaldos ? `$ ${cuenta.saldo?.toFixed(2) || '0.00'}` : '$ **.**'}
              </span>
            </div>
          </div>

          <a href="#" className="ver-detalles-link">Ver detalles de cuenta</a>

          <div className="cuenta-acciones">
            <button className="accion-btn">
              <FileText size={24} />
              <span>Estados de cuenta</span>
            </button>
            <button className="accion-btn">
              <Settings size={24} />
              <span>Configuración</span>
            </button>
          </div>
        </div>

        <div className="transacciones-card">
          <h3>Realiza una transacción</h3>
          
          <div className="transacciones-lista">
            <button className="transaccion-item">
              <div className="transaccion-icon">
                <ArrowRightLeft size={20} />
              </div>
              <span>Transferencia</span>
              <ChevronRight size={20} className="transaccion-arrow" />
            </button>
            
            <button className="transaccion-item">
              <div className="transaccion-icon">
                <CreditCard size={20} />
              </div>
              <span>Pago de tarjeta de crédito</span>
              <ChevronRight size={20} className="transaccion-arrow" />
            </button>
            
            <button className="transaccion-item">
              <div className="transaccion-icon">
                <Landmark size={20} />
              </div>
              <span>Pago de servicios</span>
              <ChevronRight size={20} className="transaccion-arrow" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default CuentaDetalle;
