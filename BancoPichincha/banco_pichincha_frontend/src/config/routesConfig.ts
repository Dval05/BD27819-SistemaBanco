/**
 * Configuración de Rutas y Módulos
 * Define la relación entre items del menú y sus componentes
 */

import { lazy, type ComponentType } from 'react';

export interface ModuleRoute {
  menuId: string;
  component: ComponentType<any>;
  requiresAuth: boolean;
  title: string;
}

// Importación dinámica de módulos (lazy loading)
const InicioModule = lazy(() => import('../modules/inicio/Inicio'));
const ProductosModule = lazy(() => import('../modules/productos/Productos'));
const ContactosModule = lazy(() => import('../modules/contactos/Contactos'));
const TransferenciasModule = lazy(() => import('../modules/transferencias/Transferencias'));
const PagosModule = lazy(() => import('../modules/pagos/Pagos'));
const SolicitudesModule = lazy(() => import('../modules/solicitudes/Solicitudes'));
const InversionesModule = lazy(() => import('../modules/inversiones/InversionesModule'));
/**
 * Mapeo de rutas de módulos
 */
export const moduleRoutes: Record<string, ModuleRoute> = {
  'inicio': {
    menuId: 'inicio',
    component: InicioModule,
    requiresAuth: true,
    title: 'Inicio'
  },
  'productos': {
    menuId: 'productos',
    component: ProductosModule,
    requiresAuth: true,
    title: 'Mis Productos'
  },
  'contactos': {
    menuId: 'contactos',
    component: ContactosModule,
    requiresAuth: true,
    title: 'Mis Contactos'
  },
  'transferencias': {
    menuId: 'transferencias',
    component: TransferenciasModule,
    requiresAuth: true,
    title: 'Transferencias'
  },
  'pagos': {
    menuId: 'pagos',
    component: PagosModule,
    requiresAuth: true,
    title: 'Pagos'
  },
  'solicitudes': {
    menuId: 'solicitudes',
    component: SolicitudesModule,
    requiresAuth: true,
    title: 'Solicitudes'
  },
  'inversiones': {
    menuId: 'inversiones',
    component: InversionesModule,
    requiresAuth: true,
    title: 'Inversiones'
  }
};

/**
 * Obtener la ruta del módulo por ID
 */
export const getModuleRoute = (menuId: string): ModuleRoute | undefined => {
  return moduleRoutes[menuId];
};

/**
 * Verificar si un módulo existe
 */
export const moduleExists = (menuId: string): boolean => {
  return menuId in moduleRoutes;
};

export default moduleRoutes;
