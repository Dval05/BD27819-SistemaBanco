/**
 * TransferenciasModule - Módulo principal de transferencias
 * Gestiona la navegación entre las diferentes vistas del flujo de transferencias
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  TransferenciaInicio,
  NuevoContactoSeleccion,
  NuevoContactoPichincha,
  NuevoContactoOtroBanco,
  TransferenciaMonto,
  TransferenciaConfirmacion,
  TransferenciaExito
} from './views';
import { LoadingSpinner } from './components';
import type { VistaTransferencia, Cuenta, Contacto } from './types/transferencias.types';
import clienteService from '../../services/clienteService';
import styles from './TransferenciasModule.module.css';

// Tipo para el estado de navegación
interface NavigationState {
  vista: VistaTransferencia;
  datos?: any;
}

// Props del módulo
interface TransferenciasModuleProps {
  clienteId?: number | string;
  cliente?: any;
  onVolverInicio?: () => void;
}

const TransferenciasModule: React.FC<TransferenciasModuleProps> = ({ 
  clienteId: clienteIdProp,
  cliente,
  onVolverInicio 
}) => {
  // Obtener clienteId desde props o desde el objeto cliente
  const clienteId = clienteIdProp || cliente?.id_persona || '';
  
  // Estado de navegación con historial
  const [navigationStack, setNavigationStack] = useState<NavigationState[]>([
    { vista: 'INICIO' }
  ]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactoActual, setContactoActual] = useState<Contacto | null>(null);

  // Cargar cuentas del usuario
  useEffect(() => {
    const cargarCuentas = async () => {
      try {
        setLoading(true);
        if (!clienteId) {
          setCuentas([]);
          return;
        }
        
        // Obtener productos del usuario
        const productos = await clienteService.obtenerProductos(clienteId);
        
        // Convertir cuentas al formato esperado (solo cuentas activas)
        const cuentasFormateadas: Cuenta[] = (productos.cuentas || [])
          .filter((cuenta: any) => cuenta.estado === '00') // Solo cuentas activas
          .map((cuenta: any) => ({
            id: cuenta.id,
            numeroCuenta: cuenta.numeroCompleto || cuenta.numero,
            tipoCuenta: cuenta.nombre || 'Cuenta',
            saldoDisponible: Number(cuenta.saldo) || 0
          }));
        
        console.log('Cuentas del usuario cargadas:', cuentasFormateadas);
        setCuentas(cuentasFormateadas);
      } catch (error) {
        console.error('Error cargando cuentas:', error);
        setCuentas([]);
      } finally {
        setLoading(false);
      }
    };

    cargarCuentas();
  }, [clienteId]);

  // Estado actual (último en el stack)
  const currentState = navigationStack[navigationStack.length - 1];

  // Navegar a una nueva vista
  const handleNavigate = useCallback((vista: VistaTransferencia, datos?: any) => {
    // Si se navega a MONTO con contacto, guardar ese contacto
    if (vista === 'MONTO' && datos?.contacto) {
      setContactoActual(datos.contacto);
    }
    setNavigationStack(prev => [...prev, { vista, datos }]);
  }, []);

  // Volver a la vista anterior
  const handleBack = useCallback(() => {
    setNavigationStack(prev => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, -1);
    });
  }, []);

  // Volver al inicio del módulo
  const handleVolverInicio = useCallback(() => {
    setNavigationStack([{ vista: 'INICIO' }]);
    setContactoActual(null);
    if (onVolverInicio) {
      onVolverInicio();
    }
  }, [onVolverInicio]);

  // Callback cuando se crea un contacto nuevo
  const handleContactoCreado = useCallback((contacto: Contacto) => {
    setContactoActual(contacto);
  }, []);

  // Renderizar la vista actual
  const renderVista = () => {
    const { vista, datos } = currentState;

    switch (vista) {
      case 'INICIO':
        return (
          <TransferenciaInicio
            clienteId={clienteId}
            onNavigate={handleNavigate}
          />
        );

      case 'NUEVO_CONTACTO_SELECCION':
        return (
          <NuevoContactoSeleccion
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        );

      case 'NUEVO_CONTACTO_PICHINCHA':
        return (
          <NuevoContactoPichincha
            clienteId={clienteId}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onContactoCreado={handleContactoCreado}
          />
        );

      case 'NUEVO_CONTACTO_OTRO_BANCO':
        return (
          <NuevoContactoOtroBanco
            clienteId={clienteId}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onContactoCreado={handleContactoCreado}
          />
        );

      case 'MONTO':
        return (
          <TransferenciaMonto
            clienteId={clienteId}
            contacto={datos?.contacto}
            tipoTransferencia={datos?.tipoTransferencia || 'INTERNA'}
            cuentas={cuentas}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        );

      case 'CONFIRMACION':
        return (
          <TransferenciaConfirmacion
            clienteId={clienteId}
            datos={datos}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        );

      case 'EXITO':
        return (
          <TransferenciaExito
            transferencia={datos?.transferencia}
            datosOriginales={datos?.datosOriginales}
            onNavigate={handleNavigate}
            onVolverInicio={handleVolverInicio}
          />
        );

      default:
        return (
          <TransferenciaInicio
            clienteId={clienteId}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner message="Cargando módulo..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {renderVista()}
      </div>
    </div>
  );
};

export default TransferenciasModule;
