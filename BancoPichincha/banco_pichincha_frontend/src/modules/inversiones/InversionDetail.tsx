import React from 'react';
import { useInversionDetail } from './useInversiones';
import { ProductoLabels, EstadoLabels } from './types/inversion.types';
import './Inversiones.css';

interface Props {
  id: string;
  onClose: () => void;
}

const CronogramaTipoLabels: Record<string, string> = {
  '00': 'Pago Interés',
  '01': 'Devolución Capital'
};

const CronogramaEstadoLabels: Record<string, string> = {
  '00': 'Pendiente',
  '01': 'Ejecutado'
};

const InversionDetail: React.FC<Props> = ({ id, onClose }) => {
  const { inversion, cronogramas, loading, error } = useInversionDetail(id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-EC');
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading">Cargando detalle...</div>
        </div>
      </div>
    );
  }

  if (error || !inversion) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="error">{error || 'No se encontró la inversión'}</div>
          <button className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-lg">
        <header className="modal-header">
          <h2>Detalle de Inversión</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </header>

        <div className="detail-grid">
          <div className="detail-item">
            <span className="label">Producto:</span>
            <span className="value">{ProductoLabels[inversion.inv_producto]}</span>
          </div>
          <div className="detail-item">
            <span className="label">Monto:</span>
            <span className="value">{formatCurrency(inversion.inv_monto)}</span>
          </div>
          <div className="detail-item">
            <span className="label">Plazo:</span>
            <span className="value">{inversion.inv_plazo_dias} días</span>
          </div>
          <div className="detail-item">
            <span className="label">Modalidad:</span>
            <span className="value">{inversion.inv_modalidad_interes}</span>
          </div>
          <div className="detail-item">
            <span className="label">Fecha Apertura:</span>
            <span className="value">{formatDate(inversion.inv_fecha_apertura)}</span>
          </div>
          <div className="detail-item">
            <span className="label">Fecha Vencimiento:</span>
            <span className="value">{formatDate(inversion.inv_fecha_vencimiento)}</span>
          </div>
          <div className="detail-item">
            <span className="label">Renovación Auto:</span>
            <span className="value">{inversion.inv_renovacion_auto === '00' ? 'Sí' : 'No'}</span>
          </div>
          <div className="detail-item">
            <span className="label">Estado:</span>
            <span className={`estado estado-${inversion.inv_estado}`}>
              {EstadoLabels[inversion.inv_estado]}
            </span>
          </div>
        </div>

        <section className="cronogramas-section">
          <h3>Cronograma de Pagos</h3>
          <table className="cronogramas-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Fecha Programada</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {cronogramas.map(cr => (
                <tr key={cr.id_invcr}>
                  <td>{CronogramaTipoLabels[cr.invcr_tipo]}</td>
                  <td>{formatDate(cr.invcr_fecha_programada)}</td>
                  <td>{formatCurrency(cr.invcr_monto_programado)}</td>
                  <td>
                    <span className={`estado-cr estado-cr-${cr.invcr_estado}`}>
                      {CronogramaEstadoLabels[cr.invcr_estado]}
                    </span>
                  </td>
                </tr>
              ))}
              {cronogramas.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty">Sin cronograma</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default InversionDetail;
