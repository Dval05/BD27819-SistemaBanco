import { createContext, useContext, useState, type ReactNode } from 'react';

type TipoNotificacion = 'exito' | 'error' | 'advertencia' | 'info';

interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  titulo?: string;
  mensaje: string;
}

interface NotificacionContextType {
  mostrarNotificacion: (tipo: TipoNotificacion, mensaje: string, titulo?: string) => void;
  exito: (mensaje: string, titulo?: string) => void;
  error: (mensaje: string, titulo?: string) => void;
  advertencia: (mensaje: string, titulo?: string) => void;
  info: (mensaje: string, titulo?: string) => void;
}

const NotificacionContext = createContext<NotificacionContextType | undefined>(undefined);

export const useNotificacion = () => {
  const context = useContext(NotificacionContext);
  if (!context) {
    throw new Error('useNotificacion debe usarse dentro de NotificacionProvider');
  }
  return context;
};

export const NotificacionProvider = ({ children }: { children: ReactNode }) => {
  const [notificacion, setNotificacion] = useState<Notificacion | null>(null);

  const mostrarNotificacion = (tipo: TipoNotificacion, mensaje: string, titulo?: string) => {
    const id = Date.now().toString();
    setNotificacion({ id, tipo, mensaje, titulo });
  };

  const cerrarNotificacion = () => {
    setNotificacion(null);
  };

  const exito = (mensaje: string, titulo?: string) => mostrarNotificacion('exito', mensaje, titulo);
  const error = (mensaje: string, titulo?: string) => mostrarNotificacion('error', mensaje, titulo);
  const advertencia = (mensaje: string, titulo?: string) => mostrarNotificacion('advertencia', mensaje, titulo);
  const info = (mensaje: string, titulo?: string) => mostrarNotificacion('info', mensaje, titulo);

  return (
    <NotificacionContext.Provider value={{ mostrarNotificacion, exito, error, advertencia, info }}>
      {children}
      {notificacion && (
        <div className="notificacion-overlay" onClick={cerrarNotificacion}>
          <div 
            className={`notificacion-modal notificacion-${notificacion.tipo}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notificacion-icono">
              {notificacion.tipo === 'exito' && '✅'}
              {notificacion.tipo === 'error' && '❌'}
              {notificacion.tipo === 'advertencia' && '⚠️'}
              {notificacion.tipo === 'info' && 'ℹ️'}
            </div>
            <div className="notificacion-contenido">
              {notificacion.titulo && (
                <h3 className="notificacion-titulo">{notificacion.titulo}</h3>
              )}
              <p className="notificacion-mensaje">{notificacion.mensaje}</p>
            </div>
            <button className="notificacion-cerrar" onClick={cerrarNotificacion}>
              ×
            </button>
          </div>
        </div>
      )}
    </NotificacionContext.Provider>
  );
};
