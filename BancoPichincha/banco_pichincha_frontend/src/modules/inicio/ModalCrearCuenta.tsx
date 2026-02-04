import React, { useState } from 'react';
import { X, Loader2, Wallet, PiggyBank, CreditCard } from 'lucide-react';
import './ModalCrearCuenta.css';

interface ModalCrearCuentaProps {
  onClose: () => void;
  onCrear: (tipoCuenta: 'ahorro' | 'corriente') => Promise<void>;
}

const ModalCrearCuenta: React.FC<ModalCrearCuentaProps> = ({ onClose, onCrear }) => {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<'ahorro' | 'corriente' | null>(null);
  const [creando, setCreando] = useState(false);

  const handleCrear = async () => {
    if (!tipoSeleccionado) return;
    
    setCreando(true);
    try {
      await onCrear(tipoSeleccionado);
      onClose();
    } catch (error) {
      // Error manejado por padre
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-crear-cuenta" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Crear Nueva Cuenta</h2>
          <button className="btn-cerrar" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-descripcion">
            Selecciona el tipo de cuenta que deseas crear. Se vinculará automáticamente una tarjeta de débito.
          </p>

          <div className="tipos-cuenta">
            <div 
              className={`tipo-cuenta-card ${tipoSeleccionado === 'ahorro' ? 'seleccionado' : ''}`}
              onClick={() => setTipoSeleccionado('ahorro')}
            >
              <div className="tipo-icono">
                <PiggyBank size={40} />
              </div>
              <h3>Cuenta de Ahorro</h3>
              <ul className="beneficios">
                <li>✓ Tasa de interés del 2.50% anual</li>
                <li>✓ Sin monto mínimo de apertura</li>
                <li>✓ Tarjeta de débito incluida</li>
                <li>✓ Sin costo de mantenimiento</li>
              </ul>
            </div>

            <div 
              className={`tipo-cuenta-card ${tipoSeleccionado === 'corriente' ? 'seleccionado' : ''}`}
              onClick={() => setTipoSeleccionado('corriente')}
            >
              <div className="tipo-icono">
                <Wallet size={40} />
              </div>
              <h3>Cuenta Corriente</h3>
              <ul className="beneficios">
                <li>✓ Cupo de sobregiro de $500.00</li>
                <li>✓ Tarjeta de débito incluida</li>
                <li>✓ Opción de chequera</li>
                <li>✓ Costo: $5.00/mes</li>
              </ul>
            </div>
          </div>

          <div className="tarjeta-info">
            <CreditCard size={20} />
            <span>Se creará automáticamente una tarjeta de débito vinculada a tu cuenta</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancelar" onClick={onClose} disabled={creando}>
            Cancelar
          </button>
          <button 
            className="btn-crear"
            onClick={handleCrear}
            disabled={!tipoSeleccionado || creando}
          >
            {creando ? (
              <>
                <Loader2 size={16} className="spinner" />
                Creando...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalCrearCuenta;
