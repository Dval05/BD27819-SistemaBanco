/**
 * Módulo de Retiro sin Tarjeta
 * Permite generar un código de 4 dígitos válido por 4 horas
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Smartphone, Search, Share2, Star, ChevronDown, Info } from 'lucide-react';
import type { Cliente } from '../../types';
import './RetiroSinTarjeta.css';

interface RetiroSinTarjetaProps {
  cliente: Cliente;
  onNavigate: (moduleId: string, data?: any) => void;
}

interface CuentaInfo {
  id_cuenta: string;
  cue_numero: string;
  cue_saldo_disponible: number;
  alias?: string;
}

type Paso = 'celular' | 'monto' | 'confirmacion';

function RetiroSinTarjeta({ cliente, onNavigate }: RetiroSinTarjetaProps) {
  const [paso, setPaso] = useState<Paso>('celular');
  const [numeroCelular, setNumeroCelular] = useState('');
  const [monto, setMonto] = useState<number>(0);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<CuentaInfo | null>(null);
  const [cuentas, setCuentas] = useState<CuentaInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codigoGenerado, setCodigoGenerado] = useState<any>(null);
  const [mostrarSelectorCuenta, setMostrarSelectorCuenta] = useState(false);

  useEffect(() => {
    cargarCuentas();
  }, [cliente]);

  const cargarCuentas = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/cuentas/persona/${cliente.id}`);
      const data = await response.json();
      if (data.ok && data.data?.length > 0) {
        const cuentasFormateadas = data.data.map((c: any) => ({
          id_cuenta: c.id_cuenta,
          cue_numero: c.cue_numero,
          cue_saldo_disponible: c.cue_saldo_disponible || 0,
          alias: c.nombre || c.tipo_cuenta || 'CUENTA AHORROS'
        }));
        setCuentas(cuentasFormateadas);
        setCuentaSeleccionada(cuentasFormateadas[0]);
      }
    } catch (err) {
      // Error silencioso
    }
  };

  const formatearCelular = (valor: string) => {
    let numeros = valor.replace(/\D/g, '');
    
    // Si empieza con 9 y tiene 9 dígitos, agregar el 0
    if (numeros.startsWith('9') && numeros.length === 9) {
      numeros = '0' + numeros;
    }
    
    numeros = numeros.slice(0, 10);
    
    if (numeros.length <= 3) return numeros;
    if (numeros.length <= 6) return `${numeros.slice(0, 3)} ${numeros.slice(3)}`;
    return `${numeros.slice(0, 3)} ${numeros.slice(3, 6)} ${numeros.slice(6)}`;
  };

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumeroCelular(formatearCelular(e.target.value));
  };

  const usarMiNumero = () => {
    if (cliente.telefono) {
      let telefono = cliente.telefono.toString();
      // Asegurar que tenga el 0 inicial
      if (telefono.startsWith('9') && telefono.length === 9) {
        telefono = '0' + telefono;
      }
      setNumeroCelular(formatearCelular(telefono));
    }
  };

  const montosRapidos = [10, 20, 30, 50, 90, 100];

  const seleccionarMonto = (m: number) => {
    if (cuentaSeleccionada && m <= cuentaSeleccionada.cue_saldo_disponible) {
      setMonto(m);
    }
  };

  const continuarAPaso = (siguientePaso: Paso) => {
    if (siguientePaso === 'monto' && numeroCelular.replace(/\s/g, '').length < 10) {
      setError('Ingresa un número de celular válido');
      return;
    }
    setError('');
    setPaso(siguientePaso);
  };

  const generarCodigo = async () => {
    if (!cuentaSeleccionada || monto <= 0) return;
    
    if (monto > cuentaSeleccionada.cue_saldo_disponible) {
      setError('Saldo insuficiente');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/cajero/retiro-sin-tarjeta/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cuenta: cuentaSeleccionada.id_cuenta,
          numero_celular: numeroCelular.replace(/\s/g, ''),
          monto: monto,
          nombre_beneficiario: cliente.nombre || cliente.usuario
        })
      });

      const data = await response.json();

      if (data.success) {
        setCodigoGenerado(data.data);
        setPaso('confirmacion');
      } else {
        setError(data.message || 'Error al generar código');
      }
    } catch (err: any) {
      setError('Error de conexión: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const compartirClave = () => {
    if (codigoGenerado && navigator.share) {
      navigator.share({
        title: 'Clave de Retiro - Banco Pichincha',
        text: `Tu clave de retiro es: ${codigoGenerado.claveRetiro}\nMonto: $${monto}\nVálido por 4 horas`
      });
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="retiro-sin-tarjeta-module">
      {/* Header */}
      <header className="retiro-header">
        <button className="back-btn" onClick={() => paso === 'celular' ? onNavigate('inicio') : setPaso(paso === 'monto' ? 'celular' : 'monto')}>
          <ArrowLeft size={24} />
        </button>
        <h1>
          {paso === 'celular' && 'Retiro sin tarjeta'}
          {paso === 'monto' && 'Monto a retirar'}
          {paso === 'confirmacion' && ''}
        </h1>
        <div className="header-actions">
          {paso !== 'confirmacion' && <button className="icon-btn"><Info size={20} /></button>}
        </div>
      </header>

      {/* Paso 1: Número de celular */}
      {paso === 'celular' && (
        <div className="paso-celular">
          <div className="instrucciones">
            <h2>Ingresa tu número de celular o el de otros</h2>
            <p>El celular debe ser de quien cobre el retiro</p>
          </div>

          <div className="input-celular">
            <input
              type="tel"
              value={numeroCelular}
              onChange={handleCelularChange}
              placeholder="099 000 0000"
              maxLength={12}
            />
          </div>

          <div className="opciones-celular">
            <button 
              className={`opcion-card ${numeroCelular === formatearCelular(cliente.telefono?.toString() || '') ? 'active' : ''}`}
              onClick={usarMiNumero}
            >
              <Smartphone size={24} />
              <span className="opcion-titulo">Usar mi número</span>
              <span className="opcion-subtitulo">{formatearCelular(cliente.telefono?.toString() || '099 000 0000')}</span>
            </button>

            <button className="opcion-card">
              <Search size={24} />
              <span className="opcion-titulo">Buscar contactos</span>
              <span className="opcion-subtitulo">Números guardados</span>
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            className="btn-continuar"
            onClick={() => continuarAPaso('monto')}
            disabled={numeroCelular.replace(/\s/g, '').length < 10}
          >
            Continuar
          </button>
        </div>
      )}

      {/* Paso 2: Monto */}
      {paso === 'monto' && (
        <div className="paso-monto">
          <div className="beneficiario-info">
            <div className="avatar">{numeroCelular.slice(-1)}</div>
            <p className="celular">{numeroCelular}</p>
            <p className="tipo">consumidor final</p>
          </div>

          <div className="monto-input-section">
            <span className="monto-grande">{formatMoney(monto)}</span>
            <p className="monto-hint">
              <Info size={14} />
              Ingresa números que terminen en 0, hasta $300.
            </p>
          </div>

          <div className="montos-rapidos">
            {montosRapidos.map((m) => (
              <button
                key={m}
                className={`monto-btn ${monto === m ? 'active' : ''} ${cuentaSeleccionada && m > cuentaSeleccionada.cue_saldo_disponible ? 'disabled' : ''}`}
                onClick={() => seleccionarMonto(m)}
                disabled={cuentaSeleccionada && m > cuentaSeleccionada.cue_saldo_disponible}
              >
                ${m}
              </button>
            ))}
          </div>

          {cuentaSeleccionada && (
            <div className="cuenta-selector-container">
              <div 
                className="cuenta-origen clickable"
                onClick={() => setMostrarSelectorCuenta(!mostrarSelectorCuenta)}
              >
                <div className="cuenta-info">
                  <span className="cuenta-alias">Desde</span>
                  <p className="cuenta-nombre">{cuentaSeleccionada.alias || 'CUENTA AHORROS'}</p>
                  <span className="cuenta-numero">Nro {cuentaSeleccionada.cue_numero}</span>
                </div>
                <div className="cuenta-saldo">
                  <span>{formatMoney(cuentaSeleccionada.cue_saldo_disponible)}</span>
                  <span className="saldo-label">Saldo disponible</span>
                </div>
                <ChevronDown size={20} className={mostrarSelectorCuenta ? 'rotated' : ''} />
              </div>
              
              {mostrarSelectorCuenta && cuentas.length > 1 && (
                <div className="cuentas-dropdown">
                  {cuentas.map((cuenta) => (
                    <div
                      key={cuenta.id_cuenta}
                      className={`cuenta-opcion ${cuenta.id_cuenta === cuentaSeleccionada.id_cuenta ? 'selected' : ''}`}
                      onClick={() => {
                        setCuentaSeleccionada(cuenta);
                        setMostrarSelectorCuenta(false);
                        // Resetear monto si excede el nuevo saldo
                        if (monto > cuenta.cue_saldo_disponible) {
                          setMonto(0);
                        }
                      }}
                    >
                      <div className="cuenta-opcion-info">
                        <span className="cuenta-opcion-nombre">{cuenta.alias || 'CUENTA AHORROS'}</span>
                        <span className="cuenta-opcion-numero">Nro {cuenta.cue_numero}</span>
                      </div>
                      <span className="cuenta-opcion-saldo">{formatMoney(cuenta.cue_saldo_disponible)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="info-costo">
            <Info size={16} />
            <span>Esta transacción no tiene costo.</span>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            className="btn-continuar"
            onClick={generarCodigo}
            disabled={monto === 0 || loading}
          >
            {loading ? 'Generando...' : 'Continuar'}
          </button>
        </div>
      )}

      {/* Paso 3: Confirmación con código */}
      {paso === 'confirmacion' && codigoGenerado && (
        <div className="paso-confirmacion">
          <div className="header-banco">
            <span className="banco-logo">🏦</span>
            <span>BANCO PICHINCHA</span>
          </div>

          <div className="instrucciones-retiro">
            <h2>Usa esta clave en nuestros cajeros</h2>
            <p>Al retirar, ingresa el celular del beneficiario.</p>
          </div>

          <div className="clave-container">
            <span className="clave-label">Clave de retiro</span>
            <div className="clave-codigo">{codigoGenerado.claveRetiro}</div>
            <span className="clave-validez">Válido por 4 horas</span>
          </div>

          <div className="info-box">
            <Info size={18} />
            <p>Usa esta clave solo en esta transacción.<br/>Guárdala o compártela.</p>
          </div>

          <div className="detalles-transaccion">
            <div className="detalle-row">
              <span className="detalle-label">Monto</span>
              <span className="detalle-valor">{formatMoney(monto)}</span>
            </div>

            <div className="detalle-section">
              <span className="detalle-titulo">Beneficiario</span>
              <div className="detalle-row">
                <span>Número Celular</span>
                <span>{codigoGenerado.numeroCelularOculto}</span>
              </div>
            </div>

            <div className="detalle-section">
              <span className="detalle-titulo">Cuenta de origen</span>
              <div className="detalle-row">
                <span>Nombre</span>
                <span>{cliente.nombre || cliente.usuario}</span>
              </div>
              <div className="detalle-row">
                <span>Número de cuenta</span>
                <span>{codigoGenerado.numeroCuenta}</span>
              </div>
            </div>

            <button className="ver-detalles-btn">Ver más detalles ▼</button>
          </div>

          <button className="btn-compartir" onClick={compartirClave}>
            <Share2 size={18} />
            Compartir clave
          </button>

          <div className="calificar-section">
            <Star size={18} />
            <span>Calificar experiencia</span>
            <ChevronDown size={18} />
          </div>

          <button 
            className="btn-otras-operaciones"
            onClick={() => onNavigate('inicio')}
          >
            Otras operaciones
          </button>
        </div>
      )}
    </div>
  );
}

export default RetiroSinTarjeta;
