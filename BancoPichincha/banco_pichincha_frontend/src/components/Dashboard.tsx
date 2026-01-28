import { useState, useEffect, type FormEvent, type MouseEvent } from 'react';
import {
  Home,
  User,
  PiggyBank,
  Send,
  Settings,
  Lock,
  RefreshCw,
  Copy,
  Check,
  BarChart3,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Inbox,
  X,
} from 'lucide-react';
import clienteService from '../services/clienteService';
import type { Cliente, Transaccion } from '../types';
import './Dashboard.css';

interface DashboardProps {
  cliente: Cliente;
  onLogout: () => void;
  onClienteUpdate: (cliente: Cliente) => void;
}

function Dashboard({ cliente, onLogout, onClienteUpdate }: DashboardProps) {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [modalDeposito, setModalDeposito] = useState(false);
  const [modalTransferencia, setModalTransferencia] = useState(false);
  const [montoDeposito, setMontoDeposito] = useState('');
  const [montoTransferencia, setMontoTransferencia] = useState('');
  const [codigoDestino, setCodigoDestino] = useState('');
  const [destinatario, setDestinatario] = useState<Cliente | null>(null);
  const [errorDestino, setErrorDestino] = useState('');
  const [loading, setLoading] = useState(false);
  const [codigoCopied, setCodigoCopied] = useState(false);
  const [errorMonto, setErrorMonto] = useState('');

  useEffect(() => {
    cargarTransacciones();
  }, [cliente._id]);

  const cargarTransacciones = async () => {
    try {
      const data = await clienteService.obtenerTransacciones(cliente._id);
      setTransacciones(data);
    } catch (error) {
      console.error('Error cargando transacciones:', error);
    }
  };

  const actualizarSaldo = async () => {
    try {
      const clienteActualizado = await clienteService.obtenerClientePorId(
        cliente._id,
      );
      onClienteUpdate(clienteActualizado);
      cargarTransacciones();
    } catch (error) {
      console.error('Error actualizando saldo:', error);
    }
  };

  const copiarCodigo = async () => {
    try {
      await navigator.clipboard.writeText(cliente.codigoDeuna);
      setCodigoCopied(true);
      setTimeout(() => setCodigoCopied(false), 2000);
    } catch (error) {
      console.error('Error copiando código:', error);
    }
  };

  const regenerarCodigo = async () => {
    try {
      const clienteActualizado = await clienteService.regenerarCodigo(
        cliente._id,
      );
      onClienteUpdate(clienteActualizado);
    } catch (error) {
      console.error('Error regenerando código:', error);
    }
  };

  const buscarDestinatario = async () => {
    if (codigoDestino.length !== 8) {
      setErrorDestino('El código debe tener 8 caracteres');
      return;
    }
    try {
      setLoading(true);
      const resultado = await clienteService.buscarPorCodigo(codigoDestino);
      if (resultado._id === cliente._id) {
        setErrorDestino('No puedes transferirte a ti mismo');
        setDestinatario(null);
      } else {
        setDestinatario(resultado);
        setErrorDestino('');
      }
    } catch {
      setErrorDestino('No se encontró ningún usuario con ese código');
      setDestinatario(null);
    } finally {
      setLoading(false);
    }
  };

  const realizarDeposito = async (e: FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(montoDeposito);
    if (isNaN(monto) || monto <= 0) return;

    try {
      setLoading(true);
      const clienteActualizado = await clienteService.depositar(
        cliente._id,
        monto,
      );
      onClienteUpdate(clienteActualizado);
      cargarTransacciones();
      setModalDeposito(false);
      setMontoDeposito('');
    } catch (error) {
      console.error('Error en depósito:', error);
    } finally {
      setLoading(false);
    }
  };

  const realizarTransferencia = async (e: FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(montoTransferencia);
    if (isNaN(monto) || monto <= 0 || !destinatario) return;

    try {
      setLoading(true);
      const clienteActualizado = await clienteService.transferir(
        cliente._id,
        codigoDestino,
        monto,
      );
      onClienteUpdate(clienteActualizado);
      cargarTransacciones();
      setModalTransferencia(false);
      setMontoTransferencia('');
      setCodigoDestino('');
      setDestinatario(null);
    } catch (error: unknown) {
      console.error('Error en transferencia:', error);
      const axiosError = error as {
        response?: { data?: { mensaje?: string } };
      };
      setErrorDestino(
        axiosError.response?.data?.mensaje || 'Error al transferir',
      );
    } finally {
      setLoading(false);
    }
  };

  const formatearMonto = (monto: number): string => {
    return monto.toLocaleString('es-EC', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatearFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-EC', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getIniciales = (nombre: string): string => {
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const renderTransaccion = (tx: Transaccion) => {
    let IconComponent: typeof PiggyBank;
    let tipo: string;
    let monto: number;
    let esPositivo: boolean;

    switch (tx.tipo) {
      case 'DEPOSITO':
        IconComponent = PiggyBank;
        tipo = 'deposito';
        monto = tx.monto;
        esPositivo = true;
        break;
      case 'TRANSFERENCIA_ENVIADA':
        IconComponent = ArrowUpRight;
        tipo = 'enviado';
        monto = tx.monto;
        esPositivo = false;
        break;
      case 'TRANSFERENCIA_RECIBIDA':
        IconComponent = ArrowDownLeft;
        tipo = 'recibido';
        monto = tx.monto;
        esPositivo = true;
        break;
      default:
        IconComponent = FileText;
        tipo = '';
        monto = tx.monto;
        esPositivo = true;
    }

    return (
      <div className="transaccion-item" key={tx._id}>
        <div className={`tx-avatar ${tipo}`}>
          <IconComponent size={20} />
        </div>
        <div className="tx-info">
          <div className="tx-nombre">{tx.descripcion}</div>
          <div className="tx-fecha">{formatearFecha(tx.fecha)}</div>
        </div>
        <div className="tx-montos">
          <div className={`tx-monto ${esPositivo ? 'positivo' : 'negativo'}`}>
            {esPositivo ? '+' : '-'}${formatearMonto(monto)}
          </div>
          <div className="tx-saldo">
            Saldo: ${formatearMonto(tx.saldoResultante)}
          </div>
        </div>
      </div>
    );
  };

  const handleModalOverlayClick = (
    setter: (value: boolean) => void,
    resetFn?: () => void,
  ) => {
    return () => {
      setter(false);
      if (resetFn) resetFn();
    };
  };

  const handleModalContentClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="dashboard-layout">
      {/* ============ SIDEBAR DESKTOP ============ */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/Banco-Pichincha.png" alt="Banco Pichincha" />
          </div>
          <div className="sidebar-title">
            Banco <br /> Pichincha
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Menú principal</div>
            <button className="sidebar-btn active">
              <span className="icon">
                <Home size={20} />
              </span>
              <span>Inicio</span>
            </button>
            <button className="sidebar-btn">
              <span className="icon">
                <User size={20} />
              </span>
              <span>Mi perfil</span>
            </button>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Operaciones</div>
            <button
              className="sidebar-btn"
              onClick={() => setModalDeposito(true)}
            >
              <span className="icon">
                <PiggyBank size={20} />
              </span>
              <span>Depositar</span>
            </button>
            <button
              className="sidebar-btn"
              onClick={() => setModalTransferencia(true)}
            >
              <span className="icon">
                <Send size={20} />
              </span>
              <span>Transferir</span>
            </button>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Configuración</div>
            <button className="sidebar-btn">
              <span className="icon">
                <Settings size={20} />
              </span>
              <span>Ajustes</span>
            </button>
            <button className="sidebar-btn">
              <span className="icon">
                <Lock size={20} />
              </span>
              <span>Seguridad</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info-sidebar">
            <div className="avatar">{getIniciales(cliente.nombre)}</div>
            <div className="details">
              <div className="name">{cliente.nombre}</div>
              <div className="email">@{cliente.usuario}</div>
            </div>
          </div>
          <button className="btn-logout-sidebar" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ============ DESKTOP VIEW ============ */}
      <main className="desktop-view">
        <header className="desktop-header">
          <div className="page-info">
            <h1 className="page-title">
              ¡Hola, {cliente.nombre.split(' ')[0]}!
            </h1>
            <p className="page-subtitle">Bienvenido a tu Banca Web</p>
          </div>
          <div className="header-actions">
            <button
              className="btn-actualizar-desktop"
              onClick={actualizarSaldo}
            >
              <span>
                <RefreshCw size={16} />
              </span>
              <span>Actualizar</span>
            </button>
          </div>
        </header>

        <div className="desktop-content">
          <div className="desktop-grid">
            <div className="panel-principal">
              {/* Tarjeta de saldo */}
              <div className="saldo-card-desktop">
                <div className="saldo-header">
                  <div>
                    <div className="label">Saldo disponible</div>
                    <div className="monto">
                      ${formatearMonto(cliente.saldo)}
                    </div>
                  </div>
                </div>
                <div className="codigo-deuna">
                  <div className="codigo-row">
                    <div className="codigo-info-desktop">
                      <span className="codigo-label">
                        Tu código para recibir transferencias
                      </span>
                      <span className="codigo-valor-desktop">
                        {cliente.codigoDeuna}
                      </span>
                    </div>
                    <div className="codigo-actions">
                      <button
                        className="btn-codigo-desktop copiar"
                        onClick={copiarCodigo}
                      >
                        <span>
                          {codigoCopied ? (
                            <Check size={16} />
                          ) : (
                            <Copy size={16} />
                          )}
                        </span>
                        <span>{codigoCopied ? 'Copiado' : 'Copiar'}</span>
                      </button>
                      <button
                        className="btn-codigo-desktop nuevo"
                        onClick={regenerarCodigo}
                      >
                        <span>
                          <RefreshCw size={16} />
                        </span>
                        <span>Nuevo código</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="acciones-desktop">
                <div
                  className="accion-card"
                  onClick={() => setModalDeposito(true)}
                >
                  <div className="icon">
                    <PiggyBank size={32} />
                  </div>
                  <div className="title">Depositar</div>
                  <div className="desc">Añade saldo a tu cuenta</div>
                </div>
                <div
                  className="accion-card"
                  onClick={() => setModalTransferencia(true)}
                >
                  <div className="icon">
                    <Send size={32} />
                  </div>
                  <div className="title">Transferir</div>
                  <div className="desc">Envía dinero al instante</div>
                </div>
                <div className="accion-card">
                  <div className="icon">
                    <BarChart3 size={32} />
                  </div>
                  <div className="title">Historial</div>
                  <div className="desc">Ver todos los movimientos</div>
                </div>
              </div>

              {/* Info usuario */}
              <div className="info-usuario-desktop">
                <h3>Información de tu cuenta</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="label">Nombre completo</div>
                    <div className="value">{cliente.nombre}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">Usuario</div>
                    <div className="value">@{cliente.usuario}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">Cédula</div>
                    <div className="value">{cliente.cedula}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">Código de transferencia</div>
                    <div className="value">{cliente.codigoDeuna}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel lateral - Movimientos */}
            <div className="panel-lateral">
              <div className="section-header">
                <h3 className="section-title">Últimos movimientos</h3>
                <button className="btn-refresh" onClick={cargarTransacciones}>
                  <RefreshCw size={18} />
                </button>
              </div>
              <div className="transacciones-lista">
                {transacciones.length === 0 ? (
                  <div className="sin-transacciones">
                    <span className="icon">
                      <Inbox size={40} />
                    </span>
                    <p>Sin movimientos aún</p>
                  </div>
                ) : (
                  transacciones.slice(0, 8).map((tx) => renderTransaccion(tx))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ============ MOBILE VIEW ============ */}
      <div className="mobile-view">
        <header className="mobile-header">
          <div className="header-left">
            <div className="logo">
              <img src="/Banco-Pichincha.png" alt="Banco Pichincha" />
            </div>
            <h1>Banco Pichincha</h1>
          </div>
          <div className="header-right">
            <div className="user-avatar">{getIniciales(cliente.nombre)}</div>
            <button className="btn-logout" onClick={onLogout}>
              Salir
            </button>
          </div>
        </header>

        <div className="saludo-section">
          <div className="saludo-text">¡Hola!</div>
          <div className="saludo-nombre">{cliente.nombre.split(' ')[0]}</div>
        </div>

        <div className="saldo-card">
          <div className="saldo-label">Saldo disponible</div>
          <div className="saldo-row">
            <div className="saldo-monto">
              <span className="currency">$</span>
              {formatearMonto(cliente.saldo)}
            </div>
            <button className="btn-actualizar" onClick={actualizarSaldo}>
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="acciones-rapidas">
          <button className="accion-btn" onClick={() => setModalDeposito(true)}>
            <div className="accion-icon">
              <PiggyBank size={20} />
            </div>
            <span className="accion-label">Depositar</span>
          </button>
          <button
            className="accion-btn"
            onClick={() => setModalTransferencia(true)}
          >
            <div className="accion-icon">
              <Send size={20} />
            </div>
            <span className="accion-label">Transferir</span>
          </button>
          <button className="accion-btn">
            <div className="accion-icon">
              <BarChart3 size={20} />
            </div>
            <span className="accion-label">Historial</span>
          </button>
          <button className="accion-btn">
            <div className="accion-icon">
              <User size={20} />
            </div>
            <span className="accion-label">Perfil</span>
          </button>
        </div>

        <div className="codigo-section">
          <div className="section-header">
            <h3 className="section-title">Tu código de transferencia</h3>
          </div>
          <div className="codigo-display">
            <div className="codigo-valor">{cliente.codigoDeuna}</div>
            <div className="codigo-botones">
              <button className="btn-codigo btn-copiar" onClick={copiarCodigo}>
                <span>
                  {codigoCopied ? <Check size={14} /> : <Copy size={14} />}
                </span>
                <span>{codigoCopied ? 'Copiado' : 'Copiar'}</span>
              </button>
              <button
                className="btn-codigo btn-regenerar"
                onClick={regenerarCodigo}
              >
                <span>
                  <RefreshCw size={14} />
                </span>
                <span>Nuevo</span>
              </button>
            </div>
            <div className="codigo-info">
              Comparte este código para recibir dinero
            </div>
          </div>
        </div>

        <div className="movimientos-section">
          <div className="section-header">
            <h3 className="section-title">Últimos movimientos</h3>
          </div>
          <div className="transacciones-lista">
            {transacciones.length === 0 ? (
              <div className="sin-transacciones">
                <span className="icon">
                  <Inbox size={40} />
                </span>
                <p>Sin movimientos aún</p>
              </div>
            ) : (
              transacciones.slice(0, 5).map((tx) => renderTransaccion(tx))
            )}
          </div>
        </div>

        <nav className="bottom-nav">
          <button className="nav-item active">
            <span className="nav-icon">
              <Home size={18} />
            </span>
            <span className="nav-label">Inicio</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">
              <BarChart3 size={18} />
            </span>
            <span className="nav-label">Historial</span>
          </button>
          <button
            className="nav-item center-btn"
            onClick={() => setModalTransferencia(true)}
          >
            <span className="nav-icon">
              <Send size={18} />
            </span>
            <span className="nav-label">Enviar</span>
          </button>
          <button className="nav-item" onClick={() => setModalDeposito(true)}>
            <span className="nav-icon">
              <PiggyBank size={18} />
            </span>
            <span className="nav-label">Depositar</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">
              <User size={18} />
            </span>
            <span className="nav-label">Perfil</span>
          </button>
        </nav>
      </div>

      {/* ============ MODAL DEPOSITO ============ */}
      {modalDeposito && (
        <div
          className="modal-overlay"
          onClick={handleModalOverlayClick(setModalDeposito)}
        >
          <div className="modal-content" onClick={handleModalContentClick}>
            <div className="modal-header">
              <h3>
                <PiggyBank
                  size={20}
                  style={{ display: 'inline', marginRight: 8 }}
                />{' '}
                Depositar
              </h3>
              <button
                className="btn-cerrar"
                onClick={() => setModalDeposito(false)}
              >
                <X size={14} />
              </button>
            </div>
            <form className="operacion-form" onSubmit={realizarDeposito}>
              <div className="form-group">
                <label>Monto a depositar</label>
                <input
                  type="number"
                  className="input-monto"
                  placeholder="0.00"
                  value={montoDeposito}
                  onChange={(e) => setMontoDeposito(e.target.value)}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-operacion btn-depositar"
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Depositar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============ MODAL TRANSFERENCIA ============ */}
      {modalTransferencia && (
        <div
          className="modal-overlay"
          onClick={handleModalOverlayClick(setModalTransferencia, () => {
            setDestinatario(null);
            setCodigoDestino('');
            setErrorDestino('');
          })}
        >
          <div className="modal-content" onClick={handleModalContentClick}>
            <div className="modal-header">
              <h3>
                <Send size={20} style={{ display: 'inline', marginRight: 8 }} />{' '}
                Transferir
              </h3>
              <button
                className="btn-cerrar"
                onClick={() => {
                  setModalTransferencia(false);
                  setDestinatario(null);
                  setCodigoDestino('');
                  setErrorDestino('');
                }}
              >
                <X size={14} />
              </button>
            </div>
            <form className="operacion-form" onSubmit={realizarTransferencia}>
              <div className="form-group">
                <label>Código del destinatario</label>
                <div className="input-with-button">
                  <input
                    type="text"
                    placeholder="Ej: A1B2C3D4"
                    value={codigoDestino}
                    onChange={(e) => {
                      setCodigoDestino(e.target.value.toUpperCase());
                      setDestinatario(null);
                      setErrorDestino('');
                    }}
                    maxLength={8}
                  />
                  <button
                    type="button"
                    className="btn-buscar"
                    onClick={buscarDestinatario}
                    disabled={codigoDestino.length !== 8 || loading}
                  >
                    Buscar
                  </button>
                </div>
                {destinatario && (
                  <div className="destinatario-info">
                    <div className="avatar">
                      {getIniciales(destinatario.nombre)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {destinatario.nombre}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        @{destinatario.usuario}
                      </div>
                    </div>
                  </div>
                )}
                {errorDestino && (
                  <div className="destinatario-error">{errorDestino}</div>
                )}
              </div>

              {destinatario && (
                <div className="form-group">
                  <label>
                    Monto a transferir
                    <span className="saldo-disponible">
                      Disponible: ${formatearMonto(cliente.saldo)}
                    </span>
                  </label>
                  <input
                    type="number"
                    className={`input-monto ${errorMonto ? 'input-error' : ''}`}
                    placeholder="0.00"
                    value={montoTransferencia}
                    onChange={(e) => {
                      const valor = e.target.value;
                      setMontoTransferencia(valor);
                      const monto = parseFloat(valor);
                      if (!isNaN(monto) && monto > cliente.saldo) {
                        setErrorMonto('Saldo insuficiente');
                      } else if (!isNaN(monto) && monto <= 0) {
                        setErrorMonto('El monto debe ser mayor a 0');
                      } else {
                        setErrorMonto('');
                      }
                    }}
                    min="0.01"
                    step="0.01"
                    required
                  />
                  {errorMonto && (
                    <div className="error-monto">{errorMonto}</div>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="btn-operacion btn-transferir"
                disabled={
                  !destinatario ||
                  loading ||
                  !montoTransferencia ||
                  !!errorMonto
                }
              >
                {loading ? 'Procesando...' : 'Transferir'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
