/**
 * Configuración del Menú de Navegación
 * Este archivo centraliza todas las opciones del menú para el Dashboard
 */

import {
  Home,
  CreditCard,
  Users,
  ArrowRightLeft,
  DollarSign,
  Building2,
  TrendingUp,
  Smartphone,
  Monitor,
  type LucideIcon
} from 'lucide-react';

export type MenuOptionId = 
  | 'inicio' 
  | 'productos' 
  | 'contactos' 
  | 'transferencias' 
  | 'pagos' 
  | 'solicitudes' 
  | 'inversiones'
  | 'retiro-sin-tarjeta'
  | 'cajero';

export type ProductTabId = 
  | 'todos' 
  | 'cuentas' 
  | 'tarjetas' 
  | 'prestamos' 
  | 'inversiones';

export interface MenuItem {
  id: MenuOptionId;
  label: string;
  icon: LucideIcon;
  hasSubmenu?: boolean;
  submenuItems?: SubMenuItem[];
  enabled: boolean;
  order: number;
}

export interface SubMenuItem {
  id: string;
  label: string;
  parentId: MenuOptionId;
}

export interface ProductTab {
  id: ProductTabId;
  label: string;
  enabled: boolean;
  order: number;
}

/**
 * Configuración de items del menú principal
 */
export const menuItems: MenuItem[] = [
  { 
    id: 'inicio', 
    label: 'Inicio', 
    icon: Home, 
    enabled: true, 
    order: 1 
  },
  { 
    id: 'productos', 
    label: 'Mis productos', 
    icon: CreditCard, 
    enabled: true, 
    order: 2 
  },
  { 
    id: 'contactos', 
    label: 'Mis contactos', 
    icon: Users, 
    enabled: true, 
    order: 3 
  },
  { 
    id: 'transferencias', 
    label: 'Transferencias', 
    icon: ArrowRightLeft, 
    enabled: true, 
    order: 4 
  },
  { 
    id: 'pagos', 
    label: 'Pagos', 
    icon: DollarSign, 
    hasSubmenu: true,
    submenuItems: [
      { id: 'servicios-basicos', label: 'Servicios básicos', parentId: 'pagos' },
      { id: 'tarjetas-credito', label: 'Tarjetas de crédito', parentId: 'pagos' },
      { id: 'prestamos', label: 'Préstamos', parentId: 'pagos' },
    ],
    enabled: true, 
    order: 5 
  },
  { 
    id: 'solicitudes', 
    label: 'Solicitudes', 
    icon: Building2, 
    enabled: true, 
    order: 6 
  },
  { 
    id: 'inversiones', 
    label: 'Inversiones', 
    icon: TrendingUp, 
    enabled: true, 
    order: 7 
  },
  { 
    id: 'retiro-sin-tarjeta', 
    label: 'Retiro sin tarjeta', 
    icon: Smartphone, 
    enabled: true, 
    order: 8 
  },
  { 
    id: 'cajero', 
    label: 'Cajero Automático', 
    icon: Monitor, 
    enabled: true, 
    order: 9 
  },
];

/**
 * Configuración de tabs de productos
 */
export const productTabs: ProductTab[] = [
  { id: 'todos', label: 'Todos', enabled: true, order: 1 },
  { id: 'cuentas', label: 'Cuentas', enabled: true, order: 2 },
  { id: 'tarjetas', label: 'Tarjetas de crédito', enabled: true, order: 3 },
  { id: 'prestamos', label: 'Préstamos', enabled: true, order: 4 },
  { id: 'inversiones', label: 'Inversiones', enabled: true, order: 5 },
];

/**
 * Obtener items del menú habilitados y ordenados
 */
export const getEnabledMenuItems = (): MenuItem[] => {
  return menuItems
    .filter(item => item.enabled)
    .sort((a, b) => a.order - b.order);
};

/**
 * Obtener tabs de productos habilitados y ordenados
 */
export const getEnabledProductTabs = (): ProductTab[] => {
  return productTabs
    .filter(tab => tab.enabled)
    .sort((a, b) => a.order - b.order);
};

/**
 * Buscar un item del menú por ID
 */
export const getMenuItemById = (id: MenuOptionId): MenuItem | undefined => {
  return menuItems.find(item => item.id === id);
};

/**
 * Buscar un tab de producto por ID
 */
export const getProductTabById = (id: ProductTabId): ProductTab | undefined => {
  return productTabs.find(tab => tab.id === id);
};

export default {
  menuItems,
  productTabs,
  getEnabledMenuItems,
  getEnabledProductTabs,
  getMenuItemById,
  getProductTabById,
};
