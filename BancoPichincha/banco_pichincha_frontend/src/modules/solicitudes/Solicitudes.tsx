/**
 * Módulo de Solicitudes
 * Solicitar tarjetas, préstamos y otros productos
 */

import { useState } from 'react';
import { CreditCard, DollarSign, Building2, ChevronRight, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { Cliente } from '../../types';
import './Solicitudes.css';

interface SolicitudesProps {
  cliente: Cliente;
  onNavigate: (moduleId: string, data?: any) => void;
}

interface Solicitud {
  id: string;
  tipo: 'tarjeta_debito' | 'tarjeta_credito' | 'prestamo';
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fechaSolicitud: string;
  descripcion: string;
}

function Solicitudes({ cliente: _cliente }: SolicitudesProps) {
  const [tipoSolicitud, setTipoSolicitud] = useState<'nueva' | 'historial'>('nueva');
  const [solicitudes] = useState<Solicitud[]>([
    // Las solicitudes se cargarán desde la API
  ]);

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
                <button className="solicitar-btn">
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
    </div>
  );
}

export default Solicitudes;
