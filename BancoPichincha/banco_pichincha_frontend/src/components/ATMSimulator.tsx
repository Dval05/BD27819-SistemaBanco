import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import './ATMSimulator.css';

interface Cliente {
  id_persona: string;
  id_cuenta: string;
  nombre: string;
  saldo: number;
  numero_cuenta: string;
}

interface ATMSimulatorProps {
  onBack: () => void;
  cliente?: Cliente;
}

type ATMScreen = 
  | 'inicio' 
  | 'seleccionar-tipo' 
  | 'tarjeta-digitos' 
  | 'tarjeta-pin'
  | 'tarjeta-cambio-pin'
  | 'tarjeta-seleccionar-cuenta'
  | 'tarjeta-seleccionar-monto'
  | 'retiro-sin-tarjeta-telefono'
  | 'retiro-sin-tarjeta-codigo'
  | 'confirmacion'
  | 'procesando'
  | 'exito'
  | 'error'
  | 'mantenimiento';

const ATMSimulator = ({ onBack, cliente }: ATMSimulatorProps) => {
  const [screen, setScreen] = useState<ATMScreen>('inicio');
  const [ultimos4Digitos, setUltimos4Digitos] = useState('');
  const [pinIngresado, setPinIngresado] = useState('');
  const [nuevoPin, setNuevoPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState('');
  const [numeroTelefono, setNumeroTelefono] = useState('');
  const [montoSeleccionado, setMontoSeleccionado] = useState<number | null>(null);
  const [codigoIngresado, setCodigoIngresado] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [primerUso, setPrimerUso] = useState(true);
  const [saldoActual, setSaldoActual] = useState(cliente?.saldo || 0);
  const [metodoRetiro, setMetodoRetiro] = useState<'tarjeta' | 'codigo'>('tarjeta');
  const [datosRetiroSinTarjeta, setDatosRetiroSinTarjeta] = useState<{
    id_retst: string;
    id_tra: string;
    id_cuenta: string;
    monto: number;
  } | null>(null);

  const irAPantalla = (nuevaPantalla: ATMScreen) => {
    setMensaje('');
    setScreen(nuevaPantalla);
  };

  const resetearEstado = () => {
    setScreen('inicio');
    setUltimos4Digitos('');
    setPinIngresado('');
    setNuevoPin('');
    setConfirmPin('');
    setTipoCuenta('');
    setNumeroTelefono('');
    setMontoSeleccionado(null);
    setCodigoIngresado('');
    setMensaje('');
    setMetodoRetiro('tarjeta');
    setDatosRetiroSinTarjeta(null);
  };

  // Manejar tecla del teclado numérico
  const handleKeypadPress = (key: string | number) => {
    switch (screen) {
      case 'tarjeta-digitos':
        if (typeof key === 'number' && ultimos4Digitos.length < 4) {
          setUltimos4Digitos(prev => prev + key.toString());
        }
        break;
      case 'tarjeta-pin':
        if (typeof key === 'number' && pinIngresado.length < 4) {
          setPinIngresado(prev => prev + key.toString());
        }
        break;
      case 'tarjeta-cambio-pin':
        if (typeof key === 'number') {
          if (nuevoPin.length < 4) {
            setNuevoPin(prev => prev + key.toString());
          } else if (confirmPin.length < 4) {
            setConfirmPin(prev => prev + key.toString());
          }
        }
        break;
      case 'tarjeta-seleccionar-monto':
        if (typeof key === 'number') {
          setMontoSeleccionado(prev => {
            const newVal = (prev || 0) * 10 + key;
            return newVal > 9999 ? prev : newVal;
          });
        }
        break;
      case 'retiro-sin-tarjeta-telefono':
        if (typeof key === 'number' && numeroTelefono.length < 10) {
          setNumeroTelefono(prev => prev + key.toString());
        }
        break;
      case 'retiro-sin-tarjeta-codigo':
        if (typeof key === 'number' && codigoIngresado.length < 4) {
          setCodigoIngresado(prev => prev + key.toString());
        }
        break;
    }
  };

  // Manejar botón de corregir del teclado
  const handleClear = () => {
    switch (screen) {
      case 'tarjeta-digitos':
        setUltimos4Digitos(prev => prev.slice(0, -1));
        break;
      case 'tarjeta-pin':
        setPinIngresado(prev => prev.slice(0, -1));
        break;
      case 'tarjeta-cambio-pin':
        if (confirmPin.length > 0) {
          setConfirmPin(prev => prev.slice(0, -1));
        } else {
          setNuevoPin(prev => prev.slice(0, -1));
        }
        break;
      case 'tarjeta-seleccionar-monto':
        setMontoSeleccionado(prev => {
          if (!prev) return null;
          const newVal = Math.floor(prev / 10);
          return newVal === 0 ? null : newVal;
        });
        break;
      case 'retiro-sin-tarjeta-telefono':
        setNumeroTelefono(prev => prev.slice(0, -1));
        break;
      case 'retiro-sin-tarjeta-codigo':
        setCodigoIngresado(prev => prev.slice(0, -1));
        break;
    }
  };

  // Manejar botón ENTER del teclado
  const handleEnter = () => {
    const rightOpts = getRightOptions();
    const continueOpt = rightOpts.find(opt => 
      opt.label === 'CONTINUAR' || opt.label === 'CONFIRMAR' || opt.label === 'FINALIZAR' || opt.label === 'VOLVER'
    );
    if (continueOpt && continueOpt.action) {
      continueOpt.action();
    }
  };

  // Procesar retiro en el backend
  const procesarRetiro = async () => {
    // Para retiro sin tarjeta, usar los datos del código validado
    const idCuenta = metodoRetiro === 'codigo' && datosRetiroSinTarjeta 
      ? datosRetiroSinTarjeta.id_cuenta 
      : cliente?.id_cuenta;

    if (!idCuenta || !montoSeleccionado) {
      setMensaje('Error: datos incompletos');
      irAPantalla('error');
      return;
    }

    // Solo validar saldo para retiro con tarjeta
    if (metodoRetiro === 'tarjeta' && montoSeleccionado > saldoActual) {
      setMensaje('Saldo insuficiente');
      irAPantalla('error');
      return;
    }

    irAPantalla('procesando');

    try {
      const response = await fetch('http://localhost:3000/api/cajero/retiro/procesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cuenta: idCuenta,
          monto: montoSeleccionado,
          tipo_cuenta: tipoCuenta || 'ahorro',
          metodo: metodoRetiro
        })
      });

      const data = await response.json();

      if (data.success) {
        setSaldoActual(data.data.saldoNuevo);
        irAPantalla('exito');
      } else {
        setMensaje(data.message || 'Error al procesar retiro');
        irAPantalla('error');
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error de conexión');
      irAPantalla('error');
    }
  };

  // Renderizar contenido de la pantalla
  const renderScreenContent = () => {
    switch (screen) {
      case 'inicio':
        return (
          <div className="atm-screen-content">
            <div className="atm-header-bar">
              <div className="atm-logo-small">■ BANCO PICHINCHA</div>
            </div>
            <div className="atm-main-message">
              <h2>Estamos trabajando para servirte mejor.</h2>
              <p className="atm-english">We are working to serve you better.</p>
              <div className="atm-alert">
                <p><strong>Alerta:</strong> En este momento NO ingreses tu tarjeta o tu clave.</p>
                <p className="atm-english"><strong>Warning:</strong> Do NOT enter your card or your key.</p>
              </div>
              <p className="atm-footer-msg">Por favor intenta más tarde. Gracias por tu comprensión.</p>
              <p className="atm-english">Please try again later. Thank you.</p>
            </div>
          </div>
        );

      case 'seleccionar-tipo':
        return (
          <div className="atm-screen-content">
            <div className="atm-header-bar">
              <div className="atm-logo-small">■ BANCO PICHINCHA</div>
            </div>
            <div className="atm-main-message">
              <h2>Seleccione tipo de operación</h2>
            </div>
          </div>
        );

      case 'tarjeta-digitos':
        return (
          <div className="atm-screen-content">
            <div className="atm-header-bar">
              <div className="atm-logo-small">■ BANCO PICHINCHA</div>
            </div>
            <div className="atm-main-message">
              <h2>Ingrese últimos 4 dígitos de su tarjeta</h2>
              <div className="atm-input-display">
                <input 
                  type="text" 
                  maxLength={4}
                  value={ultimos4Digitos}
                  onChange={(e) => setUltimos4Digitos(e.target.value.replace(/\D/g, ''))}
                  className="atm-input-field"
                  placeholder="• • • •"
                />
              </div>
              {mensaje && <p className="atm-error-msg">{mensaje}</p>}
            </div>
          </div>
        );

      case 'tarjeta-pin':
        return (
          <div className="atm-screen-content">
            <div className="atm-header-bar">
              <div className="atm-logo-small">■ BANCO PICHINCHA</div>
            </div>
            <div className="atm-main-message">
              <h2>Ingrese su clave de 4 dígitos</h2>
              <div className="atm-input-display">
                <input 
                  type="password" 
                  maxLength={4}
                  value={pinIngresado}
                  onChange={(e) => setPinIngresado(e.target.value.replace(/\D/g, ''))}
                  className="atm-input-field"
                  placeholder="• • • •"
                />
              </div>
              {mensaje && <p className="atm-error-msg">{mensaje}</p>}
            </div>
          </div>
        );

      case 'tarjeta-cambio-pin':
        return (
          <div className="atm-screen-content">
            <div className="atm-header-bar">
              <div className="atm-logo-small">■ BANCO PICHINCHA</div>
            </div>
            <div className="atm-main-message">
              <h2>Primer uso - Cambie su clave</h2>
              <p>Ingrese una nueva clave de 4 dígitos</p>
              <div className="atm-input-display">
                <input 
                  type="password" 
                  maxLength={4}
                  value={nuevoPin}
                  onChange={(e) => setNuevoPin(e.target.value.replace(/\D/g, ''))}
                  className="atm-input-field"
                  placeholder="Nueva clave"
                />
              </div>
              <div className="atm-input-display">
                <input 
                  type="password" 
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="atm-input-field"
                  placeholder="Confirmar clave"
                />
              </div>
              {mensaje && <p className="atm-error-msg">{mensaje}</p>}
            </div>
          </div>
        );

      case 'tarjeta-seleccionar-cuenta':
        return (
          <div className="atm-screen-content">
            <div className="atm-header-bar">
              <div className="atm-logo-small">■ BANCO PICHINCHA</div>
            </div>
            <div className="atm-main-message">
              <h2>Seleccione tipo de cuenta</h2>
            </div>
          </div>
        );

      case 'tarjeta-seleccionar-monto':
        return (
          <div className="atm-screen-content">
            <div className="atm-header-bar">
              <div className="atm-logo-small">■ BANCO PICHINCHA</div>
            </div>
            <div className="atm-main-message">
              <h2>Seleccione monto a retirar</h2>
              <p className="atm-cuenta-info">Cuenta: {tipoCuenta === 'ahorro' ? 'Ahorros' : 'Corriente'}</p>
              {montoSeleccionado && montoSeleccionado > 0 && (
                <div className="atm-monto-display">
                  <span>Monto seleccionado:</span>
                  <span className="monto-valor">${montoSeleccionado}</span>
                </div>
              )}
              <div className="atm-input-display">
                <input 
                  type="number" 
                  value={montoSeleccionado || ''}
                  onChange={(e) => setMontoSeleccionado(parseInt(e.target.value) || null)}
                  className="atm-input-field"
                  placeholder="Otro monto"
                />
              </div>
            </div>
          </div>
        );

      case 'retiro-sin-tarjeta-telefono':
        return (
          <div className="atm-screen-content">
            <div className="atm-header-bar">
              <div className="atm-logo-small">■ BANCO PICHINCHA</div>
            </div>
            <div className="atm-main-message">
              <h2>Retiro sin tarjeta</h2>
              <p>Ingrese número de celular del beneficiario</p>
              <div className="atm-input-display">
                <input 
                  type="tel" 
                  maxLength={10}
                  value={numeroTelefono}
                  onChange={(e) => setNumeroTelefono(e.target.value.replace(/\D/g, ''))}
                  className="atm-input-field"
                  placeholder="0999999999"
                />
              </div>
              {mensaje && <p className="atm-error-msg">{mensaje}</p>}
            </div>
          </div>
        );

      case 'retiro-sin-tarjeta-codigo':
        return (
          <div className="atm-screen-content">
            <div className="atm-header-bar">
              <div className="atm-logo-small">■ BANCO PICHINCHA</div>
            </div>
            <div className="atm-main-message">
              <h2>Ingrese clave de retiro</h2>
              <p>Código de 4 dígitos enviado al celular</p>
              <p className="atm-tel-display">****{numeroTelefono.slice(-4)}</p>
              <div className="atm-input-display">
                <input 
                  type="text" 
                  maxLength={4}
                  value={codigoIngresado}
                  onChange={(e) => setCodigoIngresado(e.target.value.replace(/\D/g, ''))}
                  className="atm-input-field"
                  placeholder="• • • •"
                />
              </div>
              {mensaje && <p className="atm-error-msg">{mensaje}</p>}
            </div>
          </div>
        );

      case 'confirmacion':
        return (
          <div className="atm-screen-content">
            <div className="atm-header-bar">
              <div className="atm-logo-small">■ BANCO PICHINCHA</div>
            </div>
            <div className="atm-main-message">
              <h2>Confirme su operación</h2>
              <div className="atm-resumen-box">
                <div className="resumen-item">
                  <span>Monto:</span>
                  <span className="resumen-valor">${montoSeleccionado}</span>
                </div>
                <div className="resumen-item">
                  <span>Saldo disponible:</span>
                  <span className="resumen-valor">${saldoActual.toFixed(2)}</span>
                </div>
                {tipoCuenta && (
                  <div className="resumen-item">
                    <span>Tipo de cuenta:</span>
                    <span className="resumen-valor">{tipoCuenta === 'ahorro' ? 'Ahorros' : 'Corriente'}</span>
                  </div>
                )}
                {numeroTelefono && (
                  <div className="resumen-item">
                    <span>Celular:</span>
                    <span className="resumen-valor">****{numeroTelefono.slice(-4)}</span>
                  </div>
                )}
              </div>
              {montoSeleccionado && montoSeleccionado > saldoActual && (
                <p className="atm-error-msg">⚠️ Saldo insuficiente</p>
              )}
            </div>
          </div>
        );

      case 'procesando':
        return (
          <div className="atm-screen-content">
            <div className="atm-header-bar">
              <div className="atm-logo-small">■ BANCO PICHINCHA</div>
            </div>
            <div className="atm-main-message">
              <div className="atm-loading-spinner"></div>
              <h2>Procesando...</h2>
              <p>Por favor espere</p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="atm-screen-content">
            <div className="atm-header-bar">
              <div className="atm-logo-small">■ BANCO PICHINCHA</div>
            </div>
            <div className="atm-main-message error">
              <div className="error-icon-atm">✗</div>
              <h2>Error en la operación</h2>
              <p>{mensaje || 'No se pudo completar la transacción'}</p>
            </div>
          </div>
        );

      case 'exito':
        return (
          <div className="atm-screen-content">
            <div className="atm-header-bar">
              <div className="atm-logo-small">■ BANCO PICHINCHA</div>
            </div>
            <div className="atm-main-message success">
              <div className="success-icon-atm">✓</div>
              <h2>Transacción Exitosa</h2>
              <p>Retire su dinero y comprobante</p>
              <div className="atm-resumen-box">
                <div className="resumen-item">
                  <span>Monto retirado:</span>
                  <span className="resumen-valor">${montoSeleccionado}</span>
                </div>
                <div className="resumen-item">
                  <span>Nuevo saldo:</span>
                  <span className="resumen-valor">${saldoActual.toFixed(2)}</span>
                </div>
              </div>
              <p className="atm-footer-msg">Gracias por usar nuestros servicios</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Opciones del lado izquierdo
  const getLeftOptions = () => {
    switch (screen) {
      case 'inicio':
        return [
          { label: 'RETIRO CON TARJETA', action: () => irAPantalla('tarjeta-digitos') },
          { label: 'RETIRO SIN TARJETA', action: () => irAPantalla('retiro-sin-tarjeta-telefono') },
          { label: '', action: () => {} },
          { label: '', action: () => {} },
        ];
      case 'seleccionar-tipo':
        return [
          { label: 'CON TARJETA', action: () => irAPantalla('tarjeta-digitos') },
          { label: 'SIN TARJETA', action: () => irAPantalla('retiro-sin-tarjeta-telefono') },
          { label: '', action: () => {} },
          { label: '', action: () => {} },
        ];
      case 'tarjeta-seleccionar-cuenta':
        return [
          { label: 'AHORROS', action: () => { setTipoCuenta('ahorro'); irAPantalla('tarjeta-seleccionar-monto'); } },
          { label: 'CORRIENTE', action: () => { setTipoCuenta('corriente'); irAPantalla('tarjeta-seleccionar-monto'); } },
          { label: '', action: () => {} },
          { label: '', action: () => {} },
        ];
      case 'tarjeta-seleccionar-monto':
        return [
          { label: '$20', action: () => setMontoSeleccionado(20) },
          { label: '$50', action: () => setMontoSeleccionado(50) },
          { label: '$100', action: () => setMontoSeleccionado(100) },
          { label: '$200', action: () => setMontoSeleccionado(200) },
        ];
      default:
        return [
          { label: '', action: () => {} },
          { label: '', action: () => {} },
          { label: '', action: () => {} },
          { label: '', action: () => {} },
        ];
    }
  };

  // Opciones del lado derecho
  const getRightOptions = () => {
    switch (screen) {
      case 'tarjeta-digitos':
        return [
          { label: '', action: () => {} },
          { label: '', action: () => {} },
          { label: 'CORREGIR', action: () => setUltimos4Digitos('') },
          { label: 'CONTINUAR', action: () => {
            if (ultimos4Digitos.length === 4) {
              if (primerUso) {
                irAPantalla('tarjeta-cambio-pin');
              } else {
                irAPantalla('tarjeta-pin');
              }
            } else {
              setMensaje('Ingrese 4 dígitos');
            }
          }},
        ];
      case 'tarjeta-pin':
        return [
          { label: '', action: () => {} },
          { label: '', action: () => {} },
          { label: 'CORREGIR', action: () => setPinIngresado('') },
          { label: 'CONTINUAR', action: () => {
            if (pinIngresado.length === 4) {
              irAPantalla('tarjeta-seleccionar-cuenta');
            } else {
              setMensaje('Ingrese 4 dígitos');
            }
          }},
        ];
      case 'tarjeta-cambio-pin':
        return [
          { label: '', action: () => {} },
          { label: '', action: () => {} },
          { label: 'CORREGIR', action: () => { setNuevoPin(''); setConfirmPin(''); } },
          { label: 'CONTINUAR', action: () => {
            if (nuevoPin.length !== 4) {
              setMensaje('La clave debe tener 4 dígitos');
            } else if (nuevoPin !== confirmPin) {
              setMensaje('Las claves no coinciden');
            } else {
              setPrimerUso(false);
              irAPantalla('tarjeta-seleccionar-cuenta');
            }
          }},
        ];
      case 'tarjeta-seleccionar-monto':
        return [
          { label: '$10', action: () => setMontoSeleccionado(10) },
          { label: '$30', action: () => setMontoSeleccionado(30) },
          { label: 'OTRO MONTO', action: () => {} },
          { label: 'CONTINUAR', action: () => {
            if (montoSeleccionado && montoSeleccionado > 0) {
              irAPantalla('confirmacion');
            } else {
              setMensaje('Seleccione un monto');
            }
          }},
        ];
      case 'retiro-sin-tarjeta-telefono':
        return [
          { label: '', action: () => {} },
          { label: '', action: () => {} },
          { label: 'CORREGIR', action: () => setNumeroTelefono('') },
          { label: 'CONTINUAR', action: () => {
            if (numeroTelefono.length === 10) {
              irAPantalla('retiro-sin-tarjeta-codigo');
            } else {
              setMensaje('Ingrese número válido');
            }
          }},
        ];
      case 'retiro-sin-tarjeta-codigo':
        return [
          { label: '', action: () => {} },
          { label: '', action: () => {} },
          { label: 'CORREGIR', action: () => setCodigoIngresado('') },
          { label: 'CONTINUAR', action: async () => {
            if (codigoIngresado.length === 4) {
              irAPantalla('procesando');
              try {
                // Validar el código con el backend y obtener el monto
                const response = await fetch('http://localhost:3000/api/cajero/retiro-sin-tarjeta/validar-cajero', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    numero_celular: numeroTelefono,
                    codigo: codigoIngresado
                  })
                });
                const data = await response.json();
                
                if (data.success) {
                  setDatosRetiroSinTarjeta(data.data);
                  setMontoSeleccionado(data.data.monto);
                  setMetodoRetiro('codigo');
                  setTipoCuenta('ahorro');
                  irAPantalla('confirmacion');
                } else {
                  setMensaje(data.message || 'Código inválido');
                  irAPantalla('retiro-sin-tarjeta-codigo');
                }
              } catch (error) {
                console.error('Error:', error);
                setMensaje('Error de conexión');
                irAPantalla('error');
              }
            } else {
              setMensaje('Ingrese código de 4 dígitos');
            }
          }},
        ];
      case 'confirmacion':
        return [
          { label: '', action: () => {} },
          { label: '', action: () => {} },
          { label: 'CANCELAR', action: () => resetearEstado() },
          { label: 'CONFIRMAR', action: () => {
            if (montoSeleccionado && montoSeleccionado <= saldoActual) {
              procesarRetiro();
            } else {
              setMensaje('Saldo insuficiente');
            }
          }},
        ];
      case 'error':
        return [
          { label: '', action: () => {} },
          { label: '', action: () => {} },
          { label: '', action: () => {} },
          { label: 'VOLVER', action: () => resetearEstado() },
        ];
      case 'exito':
        return [
          { label: '', action: () => {} },
          { label: '', action: () => {} },
          { label: '', action: () => {} },
          { label: 'FINALIZAR', action: () => {
            resetearEstado();
            onBack(); // Volver al dashboard para ver el saldo actualizado
          }},
        ];
      default:
        return [
          { label: '', action: () => {} },
          { label: '', action: () => {} },
          { label: '', action: () => {} },
          { label: '', action: () => {} },
        ];
    }
  };

  const leftOptions = getLeftOptions();
  const rightOptions = getRightOptions();

  return (
    <div className="atm-container">
      <div className="atm-machine">
        {/* Header del cajero */}
        <div className="atm-top-bar">
          <div className="atm-brand-logo">
            <div className="brand-square">■</div>
            <span>BANCO PICHINCHA</span>
          </div>
        </div>

        {/* Cuerpo principal del cajero */}
        <div className="atm-body">
          {/* Botones laterales izquierdos */}
          <div className="atm-side-buttons left">
            {leftOptions.map((opt, idx) => (
              <button 
                key={idx} 
                className={`atm-side-btn ${opt.label ? 'active' : ''}`}
                onClick={opt.action}
                disabled={!opt.label}
              >
                <span className="btn-indicator"></span>
              </button>
            ))}
          </div>

          {/* Pantalla del cajero */}
          <div className="atm-screen-wrapper">
            <div className="atm-screen">
              {/* Labels izquierdos */}
              <div className="screen-labels left">
                {leftOptions.map((opt, idx) => (
                  <div key={idx} className={`screen-label ${opt.label ? 'active' : ''}`}>
                    {opt.label}
                  </div>
                ))}
              </div>

              {/* Contenido central */}
              <div className="screen-content">
                {renderScreenContent()}
              </div>

              {/* Labels derechos */}
              <div className="screen-labels right">
                {rightOptions.map((opt, idx) => (
                  <div key={idx} className={`screen-label ${opt.label ? 'active' : ''}`}>
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Botones laterales derechos */}
          <div className="atm-side-buttons right">
            {rightOptions.map((opt, idx) => (
              <button 
                key={idx} 
                className={`atm-side-btn ${opt.label ? 'active' : ''}`}
                onClick={opt.action}
                disabled={!opt.label}
              >
                <span className="btn-indicator"></span>
              </button>
            ))}
          </div>
        </div>

        {/* Área inferior del cajero */}
        <div className="atm-bottom-area">
          <div className="atm-card-slot">
            <div className="card-slot-label">TARJETA</div>
            <div className="card-slot-opening"></div>
          </div>
          
          <div className="atm-cash-slot">
            <div className="cash-slot-label">EFECTIVO / DEPOSITO</div>
            <div className="cash-slot-opening">
              <div className="cash-arrows">↓↓</div>
            </div>
          </div>

          <div className="atm-receipt-slot">
            <div className="receipt-slot-label">COMPROBANTE</div>
            <div className="receipt-slot-opening"></div>
          </div>
        </div>

        {/* Teclado numérico */}
        <div className="atm-keypad-area">
          <div className="atm-keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((key) => (
              <button 
                key={key} 
                className="keypad-btn"
                onClick={() => handleKeypadPress(key)}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="atm-action-buttons">
            <button className="action-btn cancel" onClick={resetearEstado}>CANCELAR</button>
            <button className="action-btn clear" onClick={handleClear}>CORREGIR</button>
            <button className="action-btn enter" onClick={handleEnter}>ENTER</button>
          </div>
        </div>

        {/* Botón de salir */}
        <button className="atm-exit-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Salir del cajero
        </button>
      </div>
    </div>
  );
};

export default ATMSimulator;
