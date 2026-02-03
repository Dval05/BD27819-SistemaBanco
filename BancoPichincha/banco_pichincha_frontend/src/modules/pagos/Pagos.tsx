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
  Car,
  Store,
  Banknote,
  Building2,
  Receipt,
  Ticket,
  HeartPulse,
  ShieldCheck,
  Scale,
  GraduationCap,
  BatteryCharging,
  Heart,
  MoreHorizontal,
  Handshake,
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
  'Building2': Building2,
  'Smartphone': Smartphone,
  'Tv': Tv,
  'Home': Home,
  'DollarSign': DollarSign,
  'ShoppingCart': ShoppingCart,
  'FileText': FileText,
  'Globe': Globe,
  'Car': Car,
  'Store': Store,
  'Banknote': Banknote,
  'Receipt': Receipt,
  'Ticket': Ticket,
  'HeartPulse': HeartPulse,
  'ShieldCheck': ShieldCheck,
  'Scale': Scale,
  'GraduationCap': GraduationCap,
  'BatteryCharging': BatteryCharging,
  'Heart': Heart,
  'MoreHorizontal': MoreHorizontal,
  'Handshake': Handshake
};

type VistaActual = 'categorias' | 'subcategorias' | 'servicios' | 'detalle';

function Pagos({ cliente, onNavigate }: PagosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [vistaActual, setVistaActual] = useState<VistaActual>('categorias');
  // Evitar error por parámetro no usado (se reserva para futura navegación)
  void onNavigate;
  
  // Estados de datos
  const [categorias, setCategorias] = useState<ServicioCategoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [servicios, setServicios] = useState<ServicioItem[]>([]);
  // Pagos frecuentes
  interface PagoFrecuenteItem {
    id_pagser?: string;
    id_srv: string;
    id_subtipo?: string | null;
    srv_nombre: string;
    srv_tiene_subtipos?: boolean | null;
    cat_nombre?: string | null;
    subcat_nombre?: string | null;
    count?: number;
    ultimo_pago?: string | null;
  }
  const [pagosFrecuentes, setPagosFrecuentes] = useState<PagoFrecuenteItem[]>([]);
  const [loadingFrecuentes, setLoadingFrecuentes] = useState(false);
  const [errorFrecuentes, setErrorFrecuentes] = useState<string | null>(null);
  
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
    // Cargar pagos frecuentes para acceso rápido
    cargarPagosFrecuentes(cliente.id_persona);
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

  const cargarPagosFrecuentes = async (idPersona: string) => {
    setLoadingFrecuentes(true);
    setErrorFrecuentes(null);
    try {
      // Mostrar los 3 últimos pagos (manteniendo el título "Pagos frecuentes")
      const res = await fetch(`http://localhost:3000/api/pago-servicios/historial/${idPersona}?limit=3&offset=0`);
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        // No mostrar errores técnicos en pantalla
        setPagosFrecuentes([]);
        setErrorFrecuentes('No se pudieron cargar tus pagos frecuentes.');
        return;
      }
      if (contentType.includes('application/json')) {
        const body = await res.json();
        if (body.ok) {
          const pagos = (body.data?.pagos || []) as any[];
          const items: PagoFrecuenteItem[] = pagos.map((p) => ({
            id_pagser: p.id_pagser,
            id_srv: p.id_srv,
            id_subtipo: p.id_subtipo || null,
            srv_nombre: p.servicio,
            srv_tiene_subtipos: null,
            cat_nombre: null,
            subcat_nombre: null,
            count: undefined,
            ultimo_pago: p.fecha
          }));
          setPagosFrecuentes(items);
        } else {
          setPagosFrecuentes([]);
          setErrorFrecuentes('No se pudieron cargar tus pagos frecuentes.');
        }
      } else {
        // Respuesta no JSON (p.ej. HTML 404); silenciar en UI
        setPagosFrecuentes([]);
        setErrorFrecuentes('No se pudieron cargar tus pagos frecuentes.');
      }
    } catch (_err: any) {
      // Silenciar detalles técnicos; mostrar mensaje amigable
      setPagosFrecuentes([]);
      setErrorFrecuentes('No se pudieron cargar tus pagos frecuentes.');
    } finally {
      setLoadingFrecuentes(false);
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

  const handleFrecuenteClick = (item: PagoFrecuenteItem) => {
    if (!item.id_srv) return;
    // Navegar inmediato al detalle con estado base
    setServicioSeleccionado({
      servicioId: item.id_srv,
      servicio: item.srv_nombre,
      categoria: item.cat_nombre || categoriaSeleccionada?.nombre,
      subcategoria: item.subcat_nombre || subcategoriaSeleccionada?.subcat_nombre,
      tieneSubtipos: false
    });
    setVistaActual('detalle');
    // Luego resolver si tiene subtipos y actualizar
    (async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/pago-servicios/servicios/${item.id_srv}/subtipos`);
        const body = await res.json();
        if (res.ok && body?.ok) {
          const subtipos = body.data || [];
          const tiene = Array.isArray(subtipos) && subtipos.length > 0;
          setServicioSeleccionado((prev: any) => prev ? { ...prev, tieneSubtipos: tiene } : prev);
        }
      } catch (_) {
        // Silenciar errores
      }
    })();
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

  // Normaliza nombres para uso en mapeo (lowercase + sin tildes)
  const normalize = (s?: string | null) => (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Mapeo explícito por categoría (21 items)
  const categoryIconOverride: Record<string, any> = {
    'agua potable': Droplets,
    'electricidad': Zap,
    'sri': FileText,
    'iess': HeartPulse,
    'venta por catalogo': Store,
    'almacenes': Store,
    'instituciones publicas': Building2,
    'telecomunicaciones': Smartphone,
    'educacion': GraduationCap,
    'recargas': BatteryCharging,
    'salud': HeartPulse,
    'servicios financieros': Banknote,
    'aseguradoras': ShieldCheck,
    'servicios juridicos': Scale,
    'vivienda': Home,
    'empresas privadas': Building,
    'iglesias y fundaciones': Handshake,
    'servicios basicos': Home,
    'matrimonio': Heart,
    'nuevas empresas': Building2,
    'otros': MoreHorizontal
  };

  // Selección representativa de iconos por nombre
  const pickIconByName = (name?: string | null) => {
    const n = normalize(name);
    if (categoryIconOverride[n]) return categoryIconOverride[n];
    if (/agua|potable|hidro/.test(n)) return Droplets;
    if (/luz|eléctrica|electric|energía/.test(n)) return Zap;
    if (/internet|wifi|datos/.test(n)) return Wifi;
    if (/telef|celular|móvil|movil/.test(n)) return Smartphone;
    if (/tv|televisión|cable/.test(n)) return Tv;
    if (/tarjeta|crédito|debito/.test(n)) return CreditCard;
    if (/impuesto|sri|matricul|municipio|gobierno/.test(n)) return FileText;
    if (/vehicul|matricul|placa|ramv|cpn|transito/.test(n)) return Car;
    if (/banco|billetera|banwallet|finanzas|dinero|pago/.test(n)) return Banknote;
    if (/hogar|vivienda|servicios basicos|domicilio/.test(n)) return Home;
    if (/tienda|comercio|almacenes|shopping|compras|supermercado|retail|store/.test(n)) return Store;
    if (/global|internacional|exterior/.test(n)) return Globe;
    return DollarSign;
  };

  const renderIcon = (iconName: string | null | undefined, displayName?: string | null) => {
    // Lectura pasiva para evitar warning de variable no utilizada
    if (errorFrecuentes) { /* no-op */ }
    const isGeneric = !iconName || iconName === 'DollarSign' || iconName === 'Default' || iconName === 'None';
    const IconComponent = isGeneric ? pickIconByName(displayName) : (iconMap[iconName!] || pickIconByName(displayName));
    const Comp = IconComponent || DollarSign;
    return <Comp size={24} />;
  };

  const renderItemIcon = (displayName?: string | null) => {
    const Comp = pickIconByName(displayName) || DollarSign;
    return <Comp size={18} style={{ color: '#1a1a2e' }} />;
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
                      {renderIcon(categoria.icon, categoria.nombre)}
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
                        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {renderItemIcon(servicio.srv_nombre)}
                          {servicio.srv_nombre}
                        </span>
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
                {loadingFrecuentes ? (
                  <div className="loading-state">Cargando pagos frecuentes...</div>
                ) : pagosFrecuentes.length > 0 ? (
                  <div className="lista-items">
                    {pagosFrecuentes.map((item) => (
                      <button
                        type="button"
                        key={item.id_pagser || `${item.id_srv}-${item.id_subtipo ?? ''}-${item.ultimo_pago ?? ''}`}
                        className="item-lista"
                        onClick={() => handleFrecuenteClick(item)}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {renderItemIcon(item.srv_nombre)}
                          {item.srv_nombre}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#666', fontSize: 13 }}>
                            {item.count ? `${item.count} pagos` : ''}
                            {item.ultimo_pago ? ` · último: ${new Date(item.ultimo_pago).toLocaleDateString()}` : ''}
                          </span>
                          <ChevronRight size={20} />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="empty-recientes">
                    <p>No tienes pagos frecuentes aún</p>
                    <p className="hint">Tus servicios pagados aparecerán aquí para acceso rápido</p>
                    {/* No mostrar errores técnicos en pantalla */}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Pagos;