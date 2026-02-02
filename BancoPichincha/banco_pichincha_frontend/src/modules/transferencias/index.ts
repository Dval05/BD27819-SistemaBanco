/**
 * Exportaciones principales del módulo de transferencias
 */

// Módulo principal
export { default as TransferenciasModule } from './TransferenciasModule';
export { default } from './TransferenciasModule';

// Tipos
export * from './types/transferencias.types';

// Servicio
export { transferenciasService } from './services/transferencias.service';

// Componentes reutilizables
export {
  ContactoCard,
  SearchBar,
  LoadingSpinner,
  ActionButton,
  CuentaSelector
} from './components';

// Vistas individuales (para uso directo si se necesita)
export {
  TransferenciaInicio,
  NuevoContactoSeleccion,
  NuevoContactoPichincha,
  NuevoContactoOtroBanco,
  TransferenciaMonto,
  TransferenciaConfirmacion,
  TransferenciaExito
} from './views';
