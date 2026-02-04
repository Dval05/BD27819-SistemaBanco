import { useState, Suspense, lazy, useCallback } from 'react';
import {
  LogOut,
  HelpCircle,
  Phone,
  MapPin,
  ChevronDown,
  Loader2,
  CreditCard
} from 'lucide-react';
import type { Cliente } from '../types';
import type { Cuenta, Tarjeta } from '../services/clienteService';
import CuentaDetalle from './CuentaDetalle';
import SolicitudTarjeta from './SolicitudTarjeta';
import ATMSimulator from './ATMSimulator';
import { 
  getEnabledMenuItems, 
  type MenuOptionId
} from '../config/menuConfig';
import './Dashboard.css';

// Lazy loading de módulos
const InicioModule = lazy(() => import('../modules/inicio/Inicio'));
const ProductosModule = lazy(() => import('../modules/productos/Productos'));
const TarjetaDetalleModule = lazy(() => import('../modules/productos/TarjetaDetalle'));
const ContactosModule = lazy(() => import('../modules/contactos/Contactos'));
const TransferenciasModule = lazy(() => import('../modules/transferencias/TransferenciasModule'));
const PagosModule = lazy(() => import('../modules/pagos/Pagos'));
const SolicitudesModule = lazy(() => import('../modules/solicitudes/Solicitudes'));
const InversionesModule = lazy(() => import('../modules/inversiones/InversionesModule'));
const RetiroSinTarjetaModule = lazy(() => import('../modules/retiro-sin-tarjeta/RetiroSinTarjeta'));
const PerfilModule = lazy(() => import('../modules/perfil/Perfil'));

interface DashboardProps {
  cliente: Cliente;
  onLogout: () => void;
  onClienteUpdate: (cliente: Cliente) => void;
}

// Tipo para datos de navegación
interface NavigationData {
  cuenta?: Cuenta;
  tarjeta?: Tarjeta;
  contacto?: any;
  [key: string]: any;
}

function Dashboard({ cliente, onLogout }: DashboardProps) {
  const [activeMenu, setActiveMenu] = useState<MenuOptionId>('inicio');
  const [showSaldos, setShowSaldos] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [navigationData, setNavigationData] = useState<NavigationData | null>(null);
  const [showSolicitudTarjeta, setShowSolicitudTarjeta] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Estado especial para vistas de detalle
  const [selectedCuenta, setSelectedCuenta] = useState<Cuenta | null>(null);
  const [selectedTarjeta, setSelectedTarjeta] = useState<Tarjeta | null>(null);

  // Obtener menú dinámicamente desde la configuración
  const menuItems = getEnabledMenuItems();

  // Manejar expansión de submenús
  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // Función de navegación dinámica
  const handleNavigate = useCallback((moduleId: string, data?: any) => {
    // Vistas especiales de detalle
    if (moduleId === 'cuenta-detalle' && data) {
      setSelectedCuenta(data);
      return;
    }
if (moduleId === 'tarjeta-detalle' && data) {
      setSelectedTarjeta(data);
      return;
    }

    // Limpiar estado de detalle
    setSelectedCuenta(null);
    setSelectedTarjeta(null);

    // Navegar al módulo
    setActiveMenu(moduleId as MenuOptionId);
    setNavigationData(data || null);
  }, []);

  // Función para volver al inicio
  const handleBackToMain = useCallback(() => {
    setSelectedCuenta(null);
    setSelectedTarjeta(null);
    setNavigationData(null);
  }, []);

  // Cerrar sidebar al navegar en móvil
  const handleNavigateAndCloseSidebar = useCallback((moduleId: string, data?: any) => {
    handleNavigate(moduleId, data);
    setSidebarOpen(false);
  }, [handleNavigate]);

  const getNombreCorto = () => {
    // Prioridad: primer nombre + primer apellido
    if (cliente.primerNombre && cliente.primerApellido) {
      return `${cliente.primerNombre.split(' ')[0]} ${cliente.primerApellido.split(' ')[0]}`;
    }

    // Solo primer nombre
    if (cliente.primerNombre) {
      return cliente.primerNombre.split(' ')[0];
    }

    // Nombre completo (tomar primer palabra)
    if (cliente.nombre) {
      return cliente.nombre.split(' ')[0];
    }
    
    // Capitalizar usuario como último recurso
    const usuario = cliente.usuario;
    return usuario.charAt(0).toUpperCase() + usuario.slice(1);
  };

  const getIniciales = () => {
    if (cliente.primerNombre && cliente.primerApellido) {
      return `${cliente.primerNombre[0]}${cliente.primerApellido[0]}`.toUpperCase();
    }
    if (cliente.nombre) {
      const partes = cliente.nombre.split(' ');
      return partes.length > 1 
        ? `${partes[0][0]}${partes[1][0]}`.toUpperCase()
        : partes[0].substring(0, 2).toUpperCase();
    }
    return cliente.usuario.substring(0, 2).toUpperCase();
  };

  // Renderizar módulo activo
  const renderModule = () => {
    // Si hay una cuenta seleccionada, mostrar el detalle
    if (selectedCuenta) {
      return (
        <CuentaDetalle 
          cuenta={selectedCuenta} 
          onBack={handleBackToMain} 
        />
      );
    }

    // Props comunes para todos los módulos
    const moduleProps = {
      cliente,
      onNavigate: handleNavigate,
      showSaldos,
      onToggleSaldos: () => setShowSaldos(!showSaldos),
      initialData: navigationData
    };

    // Renderizar el módulo correspondiente
    switch (activeMenu) {
      case 'inicio':
        return <InicioModule {...moduleProps} />;
      case 'productos':
        return <ProductosModule {...moduleProps} />;
      case 'contactos':
        return <ContactosModule {...moduleProps} />;
      case 'transferencias':
        return <TransferenciasModule {...moduleProps} />;
      case 'pagos':
        return <PagosModule {...moduleProps} />;
      case 'solicitudes':
        return <SolicitudesModule {...moduleProps} />;
      case 'inversiones':
        return <InversionesModule {...moduleProps} />;
      case 'retiro-sin-tarjeta':
        return <RetiroSinTarjetaModule {...moduleProps} />;
      case 'cajero':
        return (
          <ATMSimulator 
            onBack={() => handleNavigate('inicio')} 
            cliente={{
              id_persona: cliente.id_persona,
              id_cuenta: cliente.id_cuenta || '',
              nombre: cliente.nombre || `${cliente.primerNombre || ''} ${cliente.primerApellido || ''}`.trim(),
              saldo: cliente.saldo || 0,
              numero_cuenta: cliente.numeroCuenta || ''
            }}
          />
        );
      case 'perfil':
        return <PerfilModule {...moduleProps} />;
      default:
        return <InicioModule {...moduleProps} />;
    }
  };

  // Loading fallback para Suspense
  const LoadingFallback = () => (
    <div className="module-loading">
      <Loader2 className="spinner" size={32} />
      <p>Cargando...</p>
    </div>
  );

  return (
    <div className="dashboard">
      {/* Botón hamburguesa móvil */}
      <button 
        className="menu-toggle" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Overlay para cerrar sidebar en móvil */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay active" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <img src="/Banco-Pichincha.png" alt="Banco Pichincha Logo" className="logo-image" />
            <span className="logo-text">Banco Pichincha</span>
          </div>
          <div className="user-profile" onClick={() => handleNavigateAndCloseSidebar('perfil')}>
            <div className="user-avatar">{getIniciales()}</div>
            <div className="user-info">
              <span className="user-name">{getNombreCorto()}</span>
              <span className="user-link">Mi perfil</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => {
                  if (item.hasSubmenu) {
                    toggleSubmenu(item.id);
                  } else {
                    handleNavigateAndCloseSidebar(item.id);
                  }
                }}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
                {item.hasSubmenu && (
                  <ChevronDown 
                    size={16} 
                    className={`chevron ${expandedMenus[item.id] ? 'expanded' : ''}`}
                  />
                )}
              </button>
              {item.hasSubmenu && item.submenuItems && expandedMenus[item.id] && (
                <div className="submenu">
                  {item.submenuItems.map((subItem) => (
                    <button 
                      key={subItem.id} 
                      className="submenu-item"
                      onClick={() => handleNavigateAndCloseSidebar(subItem.parentId, { subMenu: subItem.id })}
                    >
                      {subItem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <button className="nav-item logout" onClick={onLogout}>
          <LogOut size={20} />
          <span>Cerrar sesión</span>
        </button>
      </aside>

      <main className="main-content">
        {selectedCuenta ? (
          // Vista de detalle de cuenta
          <Suspense fallback={<LoadingFallback />}>
            {renderModule()}
          </Suspense>
        ) : selectedTarjeta ? (
          // Vista de detalle de tarjeta
          <Suspense fallback={<LoadingFallback />}>
            <TarjetaDetalleModule 
              tarjeta={selectedTarjeta} 
              onBack={handleBackToMain}
            />
          </Suspense>
        ) : (
          // Vista normal con header
          <>
            <header className="main-header">
              <div className="welcome">
                <h1>Hola {getNombreCorto()}</h1>
                <p>¡Descubre lo nuevo de tu Banca Web!</p>
              </div>
              <div className="header-actions">
                <button className="help-btn">
                  <HelpCircle size={20} />
                  Ayuda
                </button>
                <button 
                  className="solicitar-tarjeta-btn"
                  onClick={() => setShowSolicitudTarjeta(true)}
                  title="Solicitar nueva tarjeta"
                >
                  <CreditCard size={20} />
                  Nueva Tarjeta
                </button>
              </div>
            </header>

            <div className="module-container">
              <Suspense fallback={<LoadingFallback />}>
                {renderModule()}
              </Suspense>
            </div>

            <footer className="main-footer">
              <button className="footer-btn">
                <Phone size={16} />
                Contáctanos
              </button>
              <button className="footer-btn">
                <MapPin size={16} />
                Ubícanos
              </button>
            </footer>
          </>
        )}

        {showSolicitudTarjeta && (
          <SolicitudTarjeta 
            cliente={cliente}
            onClose={() => setShowSolicitudTarjeta(false)}
            onSuccess={() => {
              setShowSolicitudTarjeta(false);
            }}
          />
        )}
      </main>
    </div>
  );
}


export default Dashboard;
