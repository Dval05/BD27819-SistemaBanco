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
const ContactosModule = lazy(() => import('../modules/contactos/Contactos'));
const TransferenciasModule = lazy(() => import('../modules/transferencias/Transferencias'));
const PagosModule = lazy(() => import('../modules/pagos/Pagos'));
const SolicitudesModule = lazy(() => import('../modules/solicitudes/Solicitudes'));
const InversionesModule = lazy(() => import('../modules/inversiones/InversionesModule'));
const RetiroSinTarjetaModule = lazy(() => import('../modules/retiro-sin-tarjeta/RetiroSinTarjeta'));

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
  
  // Estado especial para vistas de detalle
  const [selectedCuenta, setSelectedCuenta] = useState<Cuenta | null>(null);

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

    // Limpiar estado de detalle
    setSelectedCuenta(null);

    // Navegar al módulo
    setActiveMenu(moduleId as MenuOptionId);
    setNavigationData(data || null);
  }, []);

  // Función para volver al inicio
  const handleBackToMain = useCallback(() => {
    setSelectedCuenta(null);
    setNavigationData(null);
  }, []);

  const getNombreCorto = () => {
    //if (cliente.primerNombre) {
    //  return cliente.primerNombre;
    //}

    if (cliente.primerNombre && cliente.primerApellido) {
      return `${cliente.primerNombre.split(' ')[0]} ${cliente.primerApellido.split(' ')[0]}`;
    }

    if (cliente.nombre) {
      return cliente.nombre.split(' ')[0];
    }
    return cliente.usuario;
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
      default:
        return <InicioModule {...moduleProps} />;
    }
  };

  // Loading fallback para Suspense
  const LoadingFallback = () => (
    <div className="module-loading">
      <Loader2 className="spinner" size={32} />
      <p>Cargando módulo...</p>
    </div>
  );

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <svg viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="4" fill="#FFD100"/>
                <path d="M10 30V10h8c4.5 0 8 3 8 7s-3.5 7-8 7h-4v6h-4z" fill="#00377B"/>
              </svg>
            </div>
            <span className="brand-text">BANCO<br/>PICHINCHA</span>
          </div>
        </div>

        <div className="user-info">
          <div className="user-avatar">{getIniciales()}</div>
          <div className="user-details">
            <span className="user-name">{getNombreCorto().toUpperCase()}</span>
            <span className="user-link">Mi perfil</span>
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
                    handleNavigate(item.id);
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
                      onClick={() => handleNavigate(subItem.parentId, { subMenu: subItem.id })}
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
          // Vista de detalle de cuenta - Layout independiente
          <Suspense fallback={<LoadingFallback />}>
            {renderModule()}
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
                  title="Solicitar nueva tarjeta débito"
                >
                  <CreditCard size={20} />
                  Solicitar Tarjeta
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
            onSuccess={(tarjeta) => {
              setShowSolicitudTarjeta(false);
              // Aquí puedes actualizar el estado del cliente si es necesario
            }}
          />
        )}
      </main>
    </div>
  );
}

export default Dashboard;
