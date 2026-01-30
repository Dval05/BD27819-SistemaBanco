import { useState, useEffect } from 'react';
import { CreditCard, X, AlertCircle } from 'lucide-react';
import type { Cliente } from '../types';
import './SolicitudTarjeta.css';

interface SolicitudTarjetaProps {
  cliente: Cliente;
  onClose: () => void;
  onSuccess: (tarjeta: any) => void;
}

const SolicitudTarjeta = ({ cliente, onClose, onSuccess }: SolicitudTarjetaProps) => {
  const [loading, setLoading] = useState(false);
  const [tarjetaGenerada, setTarjetaGenerada] = useState<any>(null);
  const [error, setError] = useState('');
  const [cuentaData, setCuentaData] = useState<{ id_cuenta: string; id_persona: string } | null>(null);
  const [creandoCuenta, setCreandoCuenta] = useState(false);

  // Obtener datos de cuenta si no están disponibles
  useEffect(() => {
    const obtenerCuenta = async () => {
      // Si ya tenemos los datos, usarlos
      if (cliente.id_cuenta && cliente.id_persona) {
        setCuentaData({ id_cuenta: cliente.id_cuenta, id_persona: cliente.id_persona });
        return;
      }

      // Si no, obtenerlos del backend
      try {
        const response = await fetch(`http://localhost:3000/api/cuentas/persona/${cliente.id}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        
        if ((data.success || data.ok) && data.data && data.data.length > 0) {
          const cuenta = data.data[0];
          setCuentaData({ 
            id_cuenta: cuenta.id_cuenta, 
            id_persona: cuenta.id_persona || cliente.id 
          });
        } else {
          // No hay cuenta, intentar crear una automáticamente
          await crearCuentaAutomatica();
        }
      } catch (err) {
        console.error('Error obteniendo cuenta:', err);
        await crearCuentaAutomatica();
      }
    };

    obtenerCuenta();
  }, [cliente]);

  const crearCuentaAutomatica = async () => {
    setCreandoCuenta(true);
    try {
      const response = await fetch('http://localhost:3000/api/cuentas/crear-ahorro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_persona: cliente.id }),
      });
      const data = await response.json();
      
      if ((data.success || data.ok) && data.data) {
        setCuentaData({ 
          id_cuenta: data.data.id_cuenta, 
          id_persona: cliente.id 
        });
        setError('');
      } else {
        setError('No se pudo crear una cuenta. Por favor, contacte al banco.');
      }
    } catch (err) {
      console.error('Error creando cuenta:', err);
      setError('Error al crear cuenta automática.');
    } finally {
      setCreandoCuenta(false);
    }
  };

  const generarTarjeta = async () => {
    if (!cuentaData?.id_cuenta) {
      setError('No se encontró una cuenta válida para generar la tarjeta.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/cajero/tarjeta/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cuenta: cuentaData.id_cuenta,
          id_persona: cuentaData.id_persona,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTarjetaGenerada(data.data);
        onSuccess(data.data);
      } else {
        setError(data.message || 'Error al generar tarjeta');
      }
    } catch (err: any) {
      setError('Error de conexión: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {!tarjetaGenerada ? (
          <>
            <div className="modal-header">
              <CreditCard size={32} className="modal-icon" />
              <h2>Solicitar Tarjeta Débito</h2>
            </div>

            <div className="modal-body">
              <div className="info-box">
                <AlertCircle size={20} />
                <p>Se generará una tarjeta débito con una clave de 4 dígitos aleatorios</p>
              </div>

              <div className="info-details">
                <p><strong>Beneficios:</strong></p>
                <ul>
                  <li>Retiros en cajero automático</li>
                  <li>Compras en establecimientos</li>
                  <li>Consulta de saldo</li>
                  <li>Transferencias sin contacto</li>
                </ul>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button 
                className="btn-solicitar"
                onClick={generarTarjeta}
                disabled={loading}
              >
                {loading ? 'Generando...' : 'Generar Tarjeta'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-header success">
              <div className="success-icon">✓</div>
              <h2>¡Tarjeta Generada!</h2>
            </div>

            <div className="modal-body">
              <div className="tarjeta-info">
                <div className="info-item">
                  <label>Número de Tarjeta:</label>
                  <p className="numero-tarjeta">{tarjetaGenerada.numeroTarjeta}</p>
                </div>

                <div className="info-item">
                  <label>Clave de 4 dígitos:</label>
                  <p className="pin-tarjeta">{tarjetaGenerada.pin}</p>
                  <small>⚠️ Guarda esta clave de forma segura</small>
                </div>

                <div className="info-item">
                  <label>CVV:</label>
                  <p>{tarjetaGenerada.cvv}</p>
                </div>

                <div className="info-item">
                  <label>Vencimiento:</label>
                  <p>{tarjetaGenerada.fechaExpiracion}</p>
                </div>

                <div className="info-item">
                  <label>Estado:</label>
                  <p className="estado-activa">{tarjetaGenerada.estado}</p>
                </div>
              </div>

              <div className="warning-box">
                <AlertCircle size={20} />
                <p>Puedes usar esta tarjeta en el cajero automático. La primera vez que la uses, deberás cambiar la clave.</p>
              </div>

              <button 
                className="btn-cerrar"
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SolicitudTarjeta;
