/**
 * Módulo de Inversiones
 * Componente wrapper para el módulo de inversiones
 */

import { InversionesList } from './index';
import type { Cliente } from '../../types';

interface InversionesModuleProps {
  cliente: Cliente;
  onNavigate: (moduleId: string, data?: any) => void;
  initialData?: any;
}

function InversionesModule({ }: InversionesModuleProps) {
  return (
    <div className="inversiones-module-wrapper">
      <InversionesList />
    </div>
  );
}

export default InversionesModule;
