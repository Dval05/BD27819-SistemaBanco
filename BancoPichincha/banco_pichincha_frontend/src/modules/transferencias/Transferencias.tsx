/**
 * Módulo de Transferencias
 * Realizar transferencias bancarias
 */

import { useState, useEffect } from 'react';
import { ArrowRight, Search, User, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';
import type { Cliente } from '../../types';
import clienteService, { type Cuenta } from '../../services/clienteService';
import './Transferencias.css';

interface TransferenciasProps {
  cliente: Cliente;
  onNavigate: (moduleId: string, data?: any) => void;
  initialData?: any;
}

type TipoTransferencia = 'propia' | 'terceros' | 'interbancaria';

function Transferencias({ cliente, initialData }: TransferenciasProps) {
  const [tipoTransferencia, setTipoTransferencia] = useState<TipoTransferencia>('terceros');
  const [cuentasOrigen, setCuentasOrigen] = useState<Cuenta[]>([]);
  const [cuentaOrigen, setCuentaOrigen] = useState<string>('');
  const [cuentaDestino, setCuentaDestino] = useState('');
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarCuentas = async () => {
      if (!cliente.id) return;
      try {
        const productos = await clienteService.obtenerProductos(cliente.id);
        setCuentasOrigen(productos.cuentas);
        if (productos.cuentas.length > 0) {
          setCuentaOrigen(productos.cuentas[0].id);
        }
      } catch (err) {
        console.error('Error cargando cuentas:', err);
      }
    };
    cargarCuentas();
  }, [cliente.id]);

  // Pre-cargar datos si vienen de contactos
  useEffect(() => {
    if (initialData?.contacto) {
      setCuentaDestino(initialData.contacto.numeroCuenta);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Aquí iría la llamada a la API para realizar la transferencia
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular
      setSuccess(true);
    } catch (err) {
      setError('Error al realizar la transferencia. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (success) {
    return (
      <div className="transferencias-module">
        <div className="transferencia-success">
          <CheckCircle size={64} className="success-icon" />
          <h2>¡Transferencia exitosa!</h2>
          <p>Tu transferencia de {formatMoney(parseFloat(monto))} ha sido procesada correctamente.</p>
          <button onClick={() => { setSuccess(false); setMonto(''); setCuentaDestino(''); setConcepto(''); }}>
            Realizar otra transferencia
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="transferencias-module">
      <header className="transferencias-header">
        <h1>Transferencias</h1>
      </header>

      <div className="tipo-transferencia">
        <button 
          className={tipoTransferencia === 'propia' ? 'active' : ''}
          onClick={() => setTipoTransferencia('propia')}
        >
          Entre mis cuentas
        </button>
        <button 
          className={tipoTransferencia === 'terceros' ? 'active' : ''}
          onClick={() => setTipoTransferencia('terceros')}
        >
          A terceros
        </button>
        <button 
          className={tipoTransferencia === 'interbancaria' ? 'active' : ''}
          onClick={() => setTipoTransferencia('interbancaria')}
        >
          Interbancaria
        </button>
      </div>

      <form className="transferencia-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Cuenta de origen</h3>
          <div className="select-wrapper">
            <select 
              value={cuentaOrigen}
              onChange={(e) => setCuentaOrigen(e.target.value)}
              required
            >
              {cuentasOrigen.map(cuenta => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.nombre} - {cuenta.numero} ({formatMoney(cuenta.saldo)})
                </option>
              ))}
            </select>
            <ChevronDown size={20} />
          </div>
        </div>

        <div className="transfer-arrow">
          <ArrowRight size={24} />
        </div>

        <div className="form-section">
          <h3>Cuenta de destino</h3>
          {tipoTransferencia !== 'propia' && (
            <div className="search-contacto">
              <Search size={20} />
              <input 
                type="text"
                placeholder="Buscar contacto o ingresar cuenta"
                value={cuentaDestino}
                onChange={(e) => setCuentaDestino(e.target.value)}
                required
              />
              <button type="button" className="select-contacto">
                <User size={20} />
              </button>
            </div>
          )}
          {tipoTransferencia === 'propia' && (
            <div className="select-wrapper">
              <select 
                value={cuentaDestino}
                onChange={(e) => setCuentaDestino(e.target.value)}
                required
              >
                <option value="">Seleccionar cuenta</option>
                {cuentasOrigen.filter(c => c.id !== cuentaOrigen).map(cuenta => (
                  <option key={cuenta.id} value={cuenta.id}>
                    {cuenta.nombre} - {cuenta.numero}
                  </option>
                ))}
              </select>
              <ChevronDown size={20} />
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>Monto a transferir</h3>
          <div className="monto-input">
            <span className="currency">$</span>
            <input 
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Concepto (opcional)</h3>
          <input 
            type="text"
            placeholder="Ej: Pago de servicios"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            className="concepto-input"
          />
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading || !cuentaOrigen || !cuentaDestino || !monto}
        >
          {loading ? 'Procesando...' : 'Transferir'}
        </button>
      </form>
    </div>
  );
}

export default Transferencias;
