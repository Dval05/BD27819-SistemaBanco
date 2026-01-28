/**
 * Módulo de Pagos
 * Pago de servicios y tarjetas
 */

import { useState } from 'react';
import { 
  Zap, 
  Droplets, 
  Phone, 
  Wifi, 
  CreditCard, 
  Building, 
  ChevronRight,
  Search 
} from 'lucide-react';
import type { Cliente } from '../../types';
import './Pagos.css';

interface PagosProps {
  cliente: Cliente;
  onNavigate: (moduleId: string, data?: any) => void;
}

interface ServicioCategoria {
  id: string;
  nombre: string;
  icon: React.ReactNode;
  servicios: string[];
}

function Pagos({ onNavigate }: PagosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);

  const categorias: ServicioCategoria[] = [
    { 
      id: 'electricidad', 
      nombre: 'Electricidad', 
      icon: <Zap size={24} />,
      servicios: ['CNEL', 'Empresa Eléctrica Quito', 'Eléctrica de Guayaquil']
    },
    { 
      id: 'agua', 
      nombre: 'Agua', 
      icon: <Droplets size={24} />,
      servicios: ['EPMAPS', 'Interagua', 'EMAPA']
    },
    { 
      id: 'telefono', 
      nombre: 'Telefonía', 
      icon: <Phone size={24} />,
      servicios: ['CNT', 'Claro', 'Movistar', 'Tuenti']
    },
    { 
      id: 'internet', 
      nombre: 'Internet/TV', 
      icon: <Wifi size={24} />,
      servicios: ['Netlife', 'CNT', 'TV Cable', 'DirecTV']
    },
    { 
      id: 'tarjetas', 
      nombre: 'Tarjetas de Crédito', 
      icon: <CreditCard size={24} />,
      servicios: ['Diners Club', 'Visa', 'Mastercard', 'American Express']
    },
    { 
      id: 'otros', 
      nombre: 'Otros servicios', 
      icon: <Building size={24} />,
      servicios: ['SRI', 'IESS', 'Municipio', 'Seguros']
    },
  ];

  const categoriasFiltradas = categorias.filter(cat => 
    cat.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.servicios.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="pagos-module">
      <header className="pagos-header">
        <h1>Pagos de Servicios</h1>
      </header>

      <div className="pagos-search">
        <Search size={20} />
        <input 
          type="text"
          placeholder="Buscar servicio o empresa"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="categorias-grid">
        {categoriasFiltradas.map((categoria) => (
          <div key={categoria.id} className="categoria-card">
            <button 
              className={`categoria-header ${categoriaActiva === categoria.id ? 'active' : ''}`}
              onClick={() => setCategoriaActiva(
                categoriaActiva === categoria.id ? null : categoria.id
              )}
            >
              <div className="categoria-icon">{categoria.icon}</div>
              <span className="categoria-nombre">{categoria.nombre}</span>
              <ChevronRight 
                size={20} 
                className={`arrow ${categoriaActiva === categoria.id ? 'rotated' : ''}`} 
              />
            </button>
            
            {categoriaActiva === categoria.id && (
              <div className="servicios-list">
                {categoria.servicios.map((servicio) => (
                  <button 
                    key={servicio} 
                    className="servicio-item"
                    onClick={() => onNavigate('pago-servicio', { servicio, categoria: categoria.nombre })}
                  >
                    {servicio}
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pagos-recientes">
        <h2>Pagos frecuentes</h2>
        <div className="empty-recientes">
          <p>No tienes pagos frecuentes aún</p>
          <p className="hint">Tus servicios pagados aparecerán aquí para acceso rápido</p>
        </div>
      </div>
    </div>
  );
}

export default Pagos;
