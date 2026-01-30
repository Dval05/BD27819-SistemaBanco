/**
 * Módulo de Solicitudes
 * Solicitar tarjetas, préstamos y otros productos
 */

import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Building2, ChevronRight, CheckCircle, Clock, XCircle, X, AlertCircle } from 'lucide-react';
import type { Cliente } from '../../types';
import './Solicitudes.css';

interface SolicitudesProps {
  cliente: Cliente;
  onNavigate: (moduleId: string, data?: any) => void;
}

interface Solicitud {
  id: string;
  tipo: 'tarjeta_debito' | 'tarjeta_credito' | 'prestamo' | 'inversion';
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fechaSolicitud: string;
  descripcion: string;
}

interface CuentaData {
  id_cuenta: string;
  id_persona: string;
}

function Solicitudes({ cliente, onNavigate }: SolicitudesProps) {
  const [tipoSolicitud, setTipoSolicitud] = useState<'nueva' | 'historial'>('nueva');
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [modalAbierto, setModalAbierto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [tarjetaGenerada, setTarjetaGenerada] = useState<any>(null);
  const [cuentaData, setCuentaData] = useState<CuentaData | null>(null);

  // Obtener cuenta del cliente
  useEffect(() => {
    const obtenerCuenta = async () => {
      if (cliente.id_cuenta && cliente.id_persona) {
        setCuentaData({ id_cuenta: cliente.id_cuenta, id_persona: cliente.id_persona });
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/api/cuentas/persona/${cliente.id}`);
        const data = await response.json();
        
        if ((data.ok || data.success) && data.data?.length > 0) {
          setCuentaData({ 
            id_cuenta: data.data[0].id_cuenta, 
            id_persona: cliente.id 
          });
        } else {
          // Crear cuenta automáticamente
          const crearRes = await fetch('http://localhost:3000/api/cuentas/crear-ahorro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_persona: cliente.id }),
          });
          const crearData = await crearRes.json();
          if (crearData.data) {
            setCuentaData({ id_cuenta: crearData.data.id_cuenta, id_persona: cliente.id });
          }
        }
      } catch (err) {
        console.error('Error obteniendo cuenta:', err);
      }
    };
    obtenerCuenta();
  }, [cliente]);

  const productosSolicitar = [
    {
      id: 'tarjeta_debito',
      nombre: 'Tarjeta de Débito',
      descripcion: 'Accede a tu dinero en cualquier cajero',
      icon: <CreditCard size={32} />,
      color: '#FFD100'
    },
    {
      id: 'tarjeta_credito',
      nombre: 'Tarjeta de Crédito',
      descripcion: 'Cupo de crédito para tus compras',
      icon: <CreditCard size={32} />,
      color: '#00377b'
    },
    {
      id: 'prestamo',
      nombre: 'Préstamo Personal',
      descripcion: 'Financiamiento para tus proyectos',
      icon: <DollarSign size={32} />,
      color: '#16a34a'
    },
    {
      id: 'inversion',
      nombre: 'Certificado de Inversión',
      descripcion: 'Haz crecer tu dinero con intereses',
      icon: <Building2 size={32} />,
      color: '#8b5cf6'
    },
  ];

  const solicitarProducto = async (productoId: string) => {
    setModalAbierto(productoId);
    setMensaje(null);
    setTarjetaGenerada(null);
  };

  const procesarSolicitud = async () => {
    if (!cuentaData?.id_cuenta) {
      setMensaje({ tipo: 'error', texto: 'No se encontró una cuenta asociada.' });
      return;
    }

    setLoading(true);
    setMensaje(null);

    try {
      if (modalAbierto === 'tarjeta_debito') {
        const response = await fetch('http://localhost:3000/api/cajero/tarjeta/generar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_cuenta: cuentaData.id_cuenta,
            id_persona: cuentaData.id_persona,
          }),
        });
        const data = await response.json();

        if (data.success) {
          setTarjetaGenerada(data.data);
          setMensaje({ tipo: 'success', texto: '¡Tarjeta de débito generada exitosamente!' });
          agregarSolicitud('tarjeta_debito', 'Tarjeta de Débito', 'aprobada');
        } else {
          setMensaje({ tipo: 'error', texto: data.message || 'Error al generar tarjeta' });
        }
      } else if (modalAbierto === 'tarjeta_credito') {
        // Simular solicitud de tarjeta de crédito (pendiente aprobación)
        agregarSolicitud('tarjeta_credito', 'Tarjeta de Crédito', 'pendiente');
        setMensaje({ tipo: 'success', texto: 'Solicitud de tarjeta de crédito enviada. Será revisada en 24-48 horas.' });
      } else if (modalAbierto === 'prestamo') {
        agregarSolicitud('prestamo', 'Préstamo Personal', 'pendiente');
        setMensaje({ tipo: 'success', texto: 'Solicitud de préstamo enviada. Un asesor se comunicará contigo.' });
      } else if (modalAbierto === 'inversion') {
        onNavigate('inversiones');
        setModalAbierto(null);
        return;
      }
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const agregarSolicitud = (tipo: string, descripcion: string, estado: string) => {
    const nuevaSolicitud: Solicitud = {
      id: Date.now().toString(),
      tipo: tipo as any,
      estado: estado as any,
      fechaSolicitud: new Date().toISOString(),
      descripcion
    };
    setSolicitudes(prev => [nuevaSolicitud, ...prev]);
  };

  const cerrarModal = () => {
    setModalAbierto(null);
    setMensaje(null);
    setTarjetaGenerada(null);
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'aprobada':
        return <CheckCircle size={20} className="estado-icon aprobada" />;
      case 'rechazada':
        return <XCircle size={20} className="estado-icon rechazada" />;
      default:
        return <Clock size={20} className="estado-icon pendiente" />;
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'aprobada':
        return 'Aprobada';
      case 'rechazada':
        return 'Rechazada';
      default:
        return 'En revisión';
    }
  };

  return (
    <div className="solicitudes-module">
      <header className="solicitudes-header">
        <h1>Solicitudes</h1>
      </header>

      <div className="tipo-tabs">
        <button 
          className={tipoSolicitud === 'nueva' ? 'active' : ''}
          onClick={() => setTipoSolicitud('nueva')}
        >
          Nueva solicitud
        </button>
        <button 
          className={tipoSolicitud === 'historial' ? 'active' : ''}
          onClick={() => setTipoSolicitud('historial')}
        >
          Mis solicitudes
        </button>
      </div>

      {tipoSolicitud === 'nueva' ? (
        <div className="productos-solicitar">
          <h2>¿Qué producto deseas solicitar?</h2>
          <div className="productos-grid">
            {productosSolicitar.map((producto) => (
              <div key={producto.id} className="producto-solicitar-card">
                <div 
                  className="producto-icon" 
                  style={{ backgroundColor: producto.color }}
                >
                  {producto.icon}
                </div>
                <div className="producto-info">
                  <h3>{producto.nombre}</h3>
                  <p>{producto.descripcion}</p>
                </div>
                <button 
                  className="solicitar-btn"
                  onClick={() => solicitarProducto(producto.id)}
                >
                  Solicitar
                  <ChevronRight size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="historial-solicitudes">
          {solicitudes.length === 0 ? (
            <div className="empty-historial">
              <Clock size={48} />
              <h3>No tienes solicitudes</h3>
              <p>Cuando realices una solicitud, aparecerá aquí para dar seguimiento</p>
              <button onClick={() => setTipoSolicitud('nueva')}>
                Realizar solicitud
              </button>
            </div>
          ) : (
            <div className="solicitudes-list">
              {solicitudes.map((solicitud) => (
                <div key={solicitud.id} className="solicitud-card">
                  <div className="solicitud-info">
                    <span className="solicitud-tipo">{solicitud.descripcion}</span>
                    <span className="solicitud-fecha">
                      {new Date(solicitud.fechaSolicitud).toLocaleDateString('es-EC')}
                    </span>
                  </div>
                  <div className={`solicitud-estado ${solicitud.estado}`}>
                    {getEstadoIcon(solicitud.estado)}
                    <span>{getEstadoLabel(solicitud.estado)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de solicitud */}
      {modalAbierto && (
        <div className="modal-overlay-solicitud" onClick={cerrarModal}>
          <div className="modal-content-solicitud" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={cerrarModal}>
              <X size={20} />
            </button>

            {!tarjetaGenerada ? (
              <>
                <div className="modal-header-solicitud">
                  {modalAbierto === 'tarjeta_debito' && <CreditCard size={40} color="#FFD100" />}
                  {modalAbierto === 'tarjeta_credito' && <CreditCard size={40} color="#00377b" />}
                  {modalAbierto === 'prestamo' && <DollarSign size={40} color="#16a34a" />}
                  {modalAbierto === 'inversion' && <Building2 size={40} color="#8b5cf6" />}
                  <h2>
                    {modalAbierto === 'tarjeta_debito' && 'Solicitar Tarjeta de Débito'}
                    {modalAbierto === 'tarjeta_credito' && 'Solicitar Tarjeta de Crédito'}
                    {modalAbierto === 'prestamo' && 'Solicitar Préstamo Personal'}
                    {modalAbierto === 'inversion' && 'Certificado de Inversión'}
                  </h2>
                </div>

                <div className="modal-body-solicitud">
                  {modalAbierto === 'tarjeta_debito' && (
                    <>
                      <div className="info-box-solicitud">
                        <AlertCircle size={20} />
                        <p>Se generará una tarjeta débito con una clave de 4 dígitos aleatorios</p>
                      </div>
                      <div className="beneficios-list">
                        <p><strong>Beneficios:</strong></p>
                        <ul>
                          <li>✓ Retiros en cajero automático</li>
                          <li>✓ Compras en establecimientos</li>
                          <li>✓ Consulta de saldo</li>
                          <li>✓ Transferencias sin contacto</li>
                        </ul>
                      </div>
                    </>
                  )}

                  {modalAbierto === 'tarjeta_credito' && (
                    <>
                      <div className="info-box-solicitud">
                        <AlertCircle size={20} />
                        <p>Tu solicitud será evaluada por nuestro equipo de crédito</p>
                      </div>
                      <div className="beneficios-list">
                        <p><strong>Beneficios:</strong></p>
                        <ul>
                          <li>✓ Cupo de crédito rotativo</li>
                          <li>✓ Diferido sin intereses</li>
                          <li>✓ Acumula puntos por compras</li>
                          <li>✓ Seguro de compras protegidas</li>
                        </ul>
                      </div>
                    </>
                  )}

                  {modalAbierto === 'prestamo' && (
                    <>
                      <div className="info-box-solicitud">
                        <AlertCircle size={20} />
                        <p>Un asesor te contactará para evaluar tu solicitud</p>
                      </div>
                      <div className="beneficios-list">
                        <p><strong>Beneficios:</strong></p>
                        <ul>
                          <li>✓ Tasas competitivas desde 9.5%</li>
                          <li>✓ Plazos de 12 a 60 meses</li>
                          <li>✓ Sin garante hasta $10,000</li>
                          <li>✓ Desembolso en 24 horas</li>
                        </ul>
                      </div>
                    </>
                  )}

                  {modalAbierto === 'inversion' && (
                    <>
                      <div className="info-box-solicitud">
                        <AlertCircle size={20} />
                        <p>Serás redirigido al módulo de inversiones</p>
                      </div>
                      <div className="beneficios-list">
                        <p><strong>Beneficios:</strong></p>
                        <ul>
                          <li>✓ Rendimientos garantizados</li>
                          <li>✓ Plazos flexibles</li>
                          <li>✓ Capital protegido</li>
                          <li>✓ Intereses pagados mensualmente</li>
                        </ul>
                      </div>
                    </>
                  )}

                  {mensaje && (
                    <div className={`mensaje-solicitud ${mensaje.tipo}`}>
                      {mensaje.texto}
                    </div>
                  )}
                </div>

                <div className="modal-footer-solicitud">
                  <button className="btn-cancelar" onClick={cerrarModal}>
                    Cancelar
                  </button>
                  <button 
                    className="btn-confirmar"
                    onClick={procesarSolicitud}
                    disabled={loading}
                  >
                    {loading ? 'Procesando...' : (modalAbierto === 'inversion' ? 'Ir a Inversiones' : 'Confirmar Solicitud')}
                  </button>
                </div>
              </>
            ) : (
              /* Tarjeta generada exitosamente */
              <div className="tarjeta-generada">
                <div className="success-icon-grande">✓</div>
                <h2>¡Tarjeta Generada!</h2>
                
                <div className="tarjeta-visual">
                  <div className="tarjeta-card">
                    <div className="tarjeta-chip"></div>
                    <p className="tarjeta-numero">{tarjetaGenerada.numeroTarjeta}</p>
                    <div className="tarjeta-datos">
                      <div>
                        <span>VENCE</span>
                        <p>{tarjetaGenerada.fechaExpiracion}</p>
                      </div>
                      <div>
                        <span>CVV</span>
                        <p>{tarjetaGenerada.cvv}</p>
                      </div>
                    </div>
                    <p className="tarjeta-nombre">{cliente.nombre || cliente.usuario}</p>
                  </div>
                </div>

                <div className="pin-info">
                  <p>Tu PIN temporal es:</p>
                  <div className="pin-display">{tarjetaGenerada.pinTemporal}</div>
                  <p className="pin-warning">⚠️ Guarda este PIN. Deberás cambiarlo en tu primer uso en cajero.</p>
                </div>

                <button className="btn-cerrar-exito" onClick={cerrarModal}>
                  Entendido
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Solicitudes;
