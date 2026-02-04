import { useState } from 'react';
import { ArrowLeft, CreditCard, Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import type { Tarjeta } from '../../services/clienteService';
import './TarjetaDetalle.css';

interface TarjetaDetalleProps {
  tarjeta: Tarjeta;
  onBack: () => void;
}

function TarjetaDetalle({ tarjeta, onBack }: TarjetaDetalleProps) {
  const [mostrarCambiarPin, setMostrarCambiarPin] = useState(false);
  const [pinActual, setPinActual] = useState('');
  const [nuevoPin, setNuevoPin] = useState('');
  const [confirmarPin, setConfirmarPin] = useState('');
  const [mostrarPins, setMostrarPins] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [cambiando, setCambiando] = useState(false);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const validarPin = (pin: string): string | null => {
    if (pin.length !== 4) return 'El PIN debe tener 4 dígitos';
    if (!/^\d+$/.test(pin)) return 'El PIN solo debe contener números';
    if (pin === '1234') return 'Por seguridad no puede usar 1234';
    if (/^(\d)\1{3}$/.test(pin)) return 'No use números repetidos (0000, 1111, etc.)';
    return null;
  };

  const handleCambiarPin = async () => {
    // Validaciones
    if (!pinActual) {
      setMensaje({ tipo: 'error', texto: 'Ingrese el PIN actual' });
      return;
    }

    const errorNuevo = validarPin(nuevoPin);
    if (errorNuevo) {
      setMensaje({ tipo: 'error', texto: errorNuevo });
      return;
    }

    if (nuevoPin !== confirmarPin) {
      setMensaje({ tipo: 'error', texto: 'Los PINs no coinciden' });
      return;
    }

    try {
      setCambiando(true);
      setMensaje(null);

      const response = await fetch(`http://localhost:3000/api/cajero/tarjeta/cambiar-pin/${tarjeta.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pinActual,
          nuevoPin
        })
      });

      const data = await response.json();

      if (data.success) {
        setMensaje({ tipo: 'success', texto: '¡PIN actualizado exitosamente!' });
        setPinActual('');
        setNuevoPin('');
        setConfirmarPin('');
        setTimeout(() => {
          setMostrarCambiarPin(false);
          setMensaje(null);
        }, 2000);
      } else {
        setMensaje({ tipo: 'error', texto: data.message || 'Error al cambiar el PIN' });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión. Intente nuevamente.' });
    } finally {
      setCambiando(false);
    }
  };

  const esTarjetaDebito = tarjeta.subtipo === 'debito';

  return (
    <div className="tarjeta-detalle">
      <header className="detalle-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          Volver
        </button>
        <h1>Detalle de Tarjeta</h1>
      </header>

      {/* Card visual */}
      <div className={`tarjeta-visual ${tarjeta.subtipo}`}>
        <div className="tarjeta-visual-header">
          <span className="marca">{tarjeta.marca}</span>
          <CreditCard size={32} />
        </div>
        <div className="tarjeta-visual-numero">
          {tarjeta.numeroCompleto.match(/.{1,4}/g)?.join(' ') || tarjeta.numeroCompleto}
        </div>
        <div className="tarjeta-visual-footer">
          <div className="nombre-titular">
            {tarjeta.nombre}
          </div>
          <div className="fecha-exp">
            {tarjeta.fechaExpiracion}
          </div>
        </div>
        <div className="tarjeta-chip"></div>
        <span className="tarjeta-tipo-badge">
          {esTarjetaDebito ? 'DÉBITO' : 'CRÉDITO'}
        </span>
      </div>

      {/* Información */}
      <div className="detalle-info">
        <div className="info-row">
          <span className="info-label">Estado</span>
          <span className={`estado-badge ${tarjeta.estado.toLowerCase()}`}>
            {tarjeta.estado}
          </span>
        </div>

        {esTarjetaDebito ? (
          <>
            <div className="info-row">
              <span className="info-label">Vinculado a</span>
              <span className="info-value destacado">
                {tarjeta.tipoCuenta === 'corriente' ? 'CUENTA CORRIENTE' : 'CUENTA AHORROS'}
              </span>
            </div>
            {tarjeta.numeroCuenta && (
              <div className="info-row">
                <span className="info-label">Número de cuenta</span>
                <span className="info-value">******{tarjeta.numeroCuenta.slice(-4)}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Saldo disponible</span>
              <span className="info-value saldo">{formatMoney(tarjeta.saldoActual)}</span>
            </div>
          </>
        ) : (
          <>
            <div className="info-row">
              <span className="info-label">Cupo disponible</span>
              <span className="info-value">{formatMoney(tarjeta.cupoDisponible)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Saldo actual</span>
              <span className="info-value deuda">{formatMoney(tarjeta.saldoActual)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Pago mínimo</span>
              <span className="info-value">{formatMoney(tarjeta.pagoMinimo)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Tasa de interés</span>
              <span className="info-value">{tarjeta.tasaInteres}%</span>
            </div>
          </>
        )}
      </div>

      {/* Cambiar PIN - Solo para tarjetas de débito */}
      {esTarjetaDebito && (
        <div className="acciones-tarjeta">
          {!mostrarCambiarPin ? (
            <button className="btn-cambiar-pin" onClick={() => setMostrarCambiarPin(true)}>
              <Lock size={18} />
              Cambiar PIN
            </button>
          ) : (
            <div className="formulario-pin">
              <div className="formulario-pin-header">
                <h3>Cambiar PIN de la tarjeta</h3>
                <button className="close-btn" onClick={() => {
                  setMostrarCambiarPin(false);
                  setPinActual('');
                  setNuevoPin('');
                  setConfirmarPin('');
                  setMensaje(null);
                }}>
                  <X size={20} />
                </button>
              </div>

              {mensaje && (
                <div className={`mensaje ${mensaje.tipo}`}>
                  {mensaje.tipo === 'success' ? <Check size={16} /> : <X size={16} />}
                  {mensaje.texto}
                </div>
              )}

              <div className="form-group">
                <label>PIN actual</label>
                <div className="input-with-icon">
                  <input
                    type={mostrarPins ? 'text' : 'password'}
                    maxLength={4}
                    value={pinActual}
                    onChange={(e) => setPinActual(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    disabled={cambiando}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Nuevo PIN (4 dígitos)</label>
                <div className="input-with-icon">
                  <input
                    type={mostrarPins ? 'text' : 'password'}
                    maxLength={4}
                    value={nuevoPin}
                    onChange={(e) => setNuevoPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    disabled={cambiando}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Confirmar nuevo PIN</label>
                <div className="input-with-icon">
                  <input
                    type={mostrarPins ? 'text' : 'password'}
                    maxLength={4}
                    value={confirmarPin}
                    onChange={(e) => setConfirmarPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    disabled={cambiando}
                  />
                </div>
              </div>

              <button 
                className="toggle-visibility" 
                type="button"
                onClick={() => setMostrarPins(!mostrarPins)}
              >
                {mostrarPins ? <EyeOff size={16} /> : <Eye size={16} />}
                {mostrarPins ? 'Ocultar PINs' : 'Mostrar PINs'}
              </button>

              <div className="form-actions">
                <button 
                  className="btn-cancelar"
                  onClick={() => {
                    setMostrarCambiarPin(false);
                    setPinActual('');
                    setNuevoPin('');
                    setConfirmarPin('');
                    setMensaje(null);
                  }}
                  disabled={cambiando}
                >
                  Cancelar
                </button>
                <button 
                  className="btn-confirmar"
                  onClick={handleCambiarPin}
                  disabled={cambiando || !pinActual || !nuevoPin || !confirmarPin}
                >
                  {cambiando ? 'Cambiando...' : 'Confirmar cambio'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TarjetaDetalle;
