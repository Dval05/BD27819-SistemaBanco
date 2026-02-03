/**
 * Módulo de Pagos
 * Pago de servicios y tarjetas - Navegación por pasos
 */

import { useState, useEffect } from 'react';
import { 
  Zap, 
  Droplets, 
  Phone, 
  Wifi, 
  CreditCard, 
  Building, 
  ChevronRight,
  Search,
  Smartphone,
  Tv,
  Home,
  DollarSign,
  ShoppingCart,
  FileText,
  Globe,
  ArrowLeft
} from 'lucide-react';
import type { Cliente } from '../../types';
import PagoServicioDetalle from './PagoServicioDetalle';
import './Pagos.css';

interface PagosProps {
  cliente: Cliente;
  onNavigate: (moduleId: string, data?: any) => void;
}

interface ServicioCategoria {
  id: string;
  nombre: string;
  icon?: string | null;
}

interface Subcategoria {
  id_subcat: string;
  subcat_nombre: string;
}

interface ServicioItem {
  id_srv: string;
  srv_nombre: string;
  srv_tiene_subtipos?: boolean | null;
}

// Mapeo de nombres de íconos
const iconMap: Record<string, any> = {
  'Zap': Zap,
  'Droplets': Droplets,
  'Phone': Phone,
  'Wifi': Wifi,
  'CreditCard': CreditCard,
  'Building': Building,
  'Smartphone': Smartphone,
  'Tv': Tv,
  'Home': Home,
  'DollarSign': DollarSign,
  'ShoppingCart': ShoppingCart,
  'FileText': FileText,
  'Globe': Globe
};

type VistaActual = 'categorias' | 'subcategorias' | 'servicios' | 'detalle';

function Pagos({ cliente, onNavigate }: PagosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [vistaActual, setVistaActual] = useState<VistaActual>('categorias');
  
  // Estados de datos
  const [categorias, setCategorias] = useState<ServicioCategoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [servicios, setServicios] = useState<ServicioItem[]>([]);
  
  // Contexto de navegación
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<ServicioCategoria | null>(null);
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState<Subcategoria | null>(null);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<any>(null);
  
  // Estados de carga
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [loadingSubcategorias, setLoadingSubcategorias] = useState(false);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    setLoadingCategorias(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3000/api/pago-servicios/categorias');
      const body = await res.json();
      if (body.ok) {
        const mapped = (body.data || []).map((c: any) => ({
          id: c.id_cat,
          nombre: c.cat_nombre,
          icon: c.cat_icono || null
        }));
        setCategorias(mapped);
      } else {
        setError(body.msg || 'Error al cargar categorías');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoadingCategorias(false);
    }
  };

  const cargarSubcategorias = async (idCat: string) => {
    setLoadingSubcategorias(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3000/api/pago-servicios/categorias/${idCat}/subcategorias`);
      const body = await res.json();
      if (body.ok) {
        return body.data || [];
      } else {
        console.error('Error al obtener subcategorías:', body.msg);
        return [];
      }
    } catch (err) {
      console.error('Error de conexión al obtener subcategorías:', err);
      return [];
    } finally {
      setLoadingSubcategorias(false);
    }
  };

  const cargarServiciosPorCategoria = async (idCat: string) => {
    setLoadingServicios(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3000/api/pago-servicios/categorias/${idCat}/servicios`);
      const body = await res.json();
      if (body.ok) {
        setServicios(body.data || []);
      } else {
        console.error('Error al obtener servicios:', body.msg);
        setServicios([]);
      }
    } catch (err) {
      console.error('Error de conexión al obtener servicios:', err);
      setServicios([]);
    } finally {
      setLoadingServicios(false);
    }
  };

  const cargarServiciosPorSubcategoria = async (idSubcat: string) => {
    setLoadingServicios(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3000/api/pago-servicios/subcategorias/${idSubcat}/servicios`);
      const body = await res.json();
      if (body.ok) {
        setServicios(body.data || []);
      } else {
        console.error('Error al obtener servicios:', body.msg);
        setServicios([]);
      }
    } catch (err) {
      console.error('Error de conexión al obtener servicios:', err);
      setServicios([]);
    } finally {
      setLoadingServicios(false);
    }
  };

  const handleCategoriaClick = async (categoria: ServicioCategoria) => {
    setCategoriaSeleccionada(categoria);
    
    // Primero verificar si tiene subcategorías
    const subcats = await cargarSubcategorias(categoria.id);
    
    if (subcats.length > 0) {
      // Tiene subcategorías, mostrar vista de subcategorías
      setSubcategorias(subcats);
      setVistaActual('subcategorias');
    } else {
      // No tiene subcategorías, cargar servicios directamente
      await cargarServiciosPorCategoria(categoria.id);
      setVistaActual('servicios');
    }
  };

  const handleSubcategoriaClick = async (subcategoria: Subcategoria) => {
    setSubcategoriaSeleccionada(subcategoria);
    await cargarServiciosPorSubcategoria(subcategoria.id_subcat);
    setVistaActual('servicios');
  };

  const handleServicioClick = (servicio: ServicioItem) => {
    setServicioSeleccionado({
      servicioId: servicio.id_srv,
      servicio: servicio.srv_nombre,
      categoria: categoriaSeleccionada?.nombre,
      subcategoria: subcategoriaSeleccionada?.subcat_nombre,
      tieneSubtipos: servicio.srv_tiene_subtipos
    });
    setVistaActual('detalle');
  };

  const handleVolverDesdeDetalle = () => {
    setServicioSeleccionado(null);
    setVistaActual('servicios');
  };

  const handlePagoExitoso = () => {
    // Volver al inicio después de un pago exitoso
    setServicioSeleccionado(null);
    setCategoriaSeleccionada(null);
    setSubcategoriaSeleccionada(null);
    setVistaActual('categorias');
    setSearchTerm('');
  };

  const handleVolver = () => {
    if (vistaActual === 'detalle') {
      setServicioSeleccionado(null);
      setVistaActual('servicios');
    } else if (vistaActual === 'servicios') {
      if (subcategoriaSeleccionada) {
        // Volver a subcategorías
        setSubcategoriaSeleccionada(null);
        setVistaActual('subcategorias');
      } else {
        // Volver a categorías
        setCategoriaSeleccionada(null);
        setVistaActual('categorias');
      }
    } else if (vistaActual === 'subcategorias') {
      // Volver a categorías
      setCategoriaSeleccionada(null);
      setSubcategoriaSeleccionada(null);
      setVistaActual('categorias');
    }
    setSearchTerm('');
  };

  const renderIcon = (iconName: string | null | undefined) => {
    if (!iconName) {
      return <DollarSign size={24} />;
    }
    const IconComponent = iconMap[iconName];
    if (IconComponent) {
      return <IconComponent size={24} />;
    }
    return <DollarSign size={24} />;
  };

  // Filtrado de búsqueda
  const categoriasFiltradas = categorias.filter(cat => 
    cat.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const subcategoriasFiltradas = subcategorias.filter(sub => 
    sub.subcat_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const serviciosFiltrados = servicios.filter(srv => 
    srv.srv_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingCategorias) {
    return (
      <div className="pagos-module">
        <header className="pagos-header">
          <h1>Pagos de Servicios</h1>
        </header>
        <div className="loading-state">
          Cargando categorías...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pagos-module">
        <header className="pagos-header">
          <h1>Pagos de Servicios</h1>
        </header>
        <div className="error-state">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="pagos-module">
      {/* VISTA DE DETALLE DEL SERVICIO */}
      {vistaActual === 'detalle' && servicioSeleccionado && (
        <PagoServicioDetalle
          cliente={cliente}
          servicioData={servicioSeleccionado}
          onVolver={handleVolverDesdeDetalle}
          onPagoExitoso={handlePagoExitoso}
        />
      )}

      {/* VISTAS PRINCIPALES */}
      {vistaActual !== 'detalle' && (
        <>
          <header className="pagos-header">
            {vistaActual !== 'categorias' && (
              <button className="btn-volver" onClick={handleVolver}>
                <ArrowLeft size={20} />
                Volver
              </button>
            )}
            <h1>
              {vistaActual === 'categorias' && 'Pagos de Servicios'}
              {vistaActual === 'subcategorias' && categoriaSeleccionada?.nombre}
              {vistaActual === 'servicios' && (subcategoriaSeleccionada?.subcat_nombre || categoriaSeleccionada?.nombre)}
            </h1>
          </header>

          <div className="pagos-search">
            <Search size={20} />
            <input 
              type="text"
              placeholder={
                vistaActual === 'categorias' ? 'Buscar categoría' :
                vistaActual === 'subcategorias' ? 'Buscar subcategoría' :
                'Buscar servicio o empresa'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="pagos-content">
            {/* VISTA DE CATEGORÍAS */}
            {vistaActual === 'categorias' && (
              <div className="categorias-grid">
                {categoriasFiltradas.map((categoria) => (
                  <button 
                    key={categoria.id} 
                    className="categoria-card"
                    onClick={() => handleCategoriaClick(categoria)}
                  >
                    <div className="categoria-icon">
                      {renderIcon(categoria.icon)}
                    </div>
                    <span className="categoria-nombre">{categoria.nombre}</span>
                    <ChevronRight size={20} className="arrow" />
                  </button>
                ))}
              </div>
            )}

            {/* VISTA DE SUBCATEGORÍAS */}
            {vistaActual === 'subcategorias' && (
              <>
                {loadingSubcategorias ? (
                  <div className="loading-state">Cargando subcategorías...</div>
                ) : (
                  <div className="lista-items">
                    {subcategoriasFiltradas.map((subcategoria) => (
                      <button 
                        key={subcategoria.id_subcat} 
                        className="item-lista"
                        onClick={() => handleSubcategoriaClick(subcategoria)}
                      >
                        <span>{subcategoria.subcat_nombre}</span>
                        <ChevronRight size={20} />
                      </button>
                    ))}
                    {subcategoriasFiltradas.length === 0 && (
                      <div className="empty-state">
                        No se encontraron subcategorías
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* VISTA DE SERVICIOS */}
            {vistaActual === 'servicios' && (
              <>
                {loadingServicios ? (
                  <div className="loading-state">Cargando servicios...</div>
                ) : (
                  <div className="lista-items">
                    {serviciosFiltrados.map((servicio) => (
                      <button 
                        key={servicio.id_srv} 
                        className="item-lista"
                        onClick={() => handleServicioClick(servicio)}
                      >
                        <span>{servicio.srv_nombre}</span>
                        <ChevronRight size={20} />
                      </button>
                    ))}
                    {serviciosFiltrados.length === 0 && (
                      <div className="empty-state">
                        No se encontraron servicios
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* PAGOS FRECUENTES - Solo en vista de categorías */}
            {vistaActual === 'categorias' && (
              <div className="pagos-recientes">
                <h2>Pagos frecuentes</h2>
                <div className="empty-recientes">
                  <p>No tienes pagos frecuentes aún</p>
                  <p className="hint">Tus servicios pagados aparecerán aquí para acceso rápido</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Pagos;