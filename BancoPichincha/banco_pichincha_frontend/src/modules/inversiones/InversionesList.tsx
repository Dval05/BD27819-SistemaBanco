import React, { useState } from 'react';
import { useInversiones } from './useInversiones';
import { ProductoLabels, EstadoLabels } from './types/inversion.types';
import type { Inversion } from './types/inversion.types';
import InversionForm from './InversionForm';
import InversionDetail from './InversionDetail';
import './Inversiones.css';

const InversionesList: React.FC = () => {
  const { inversiones, loading, error, refresh, cancelarInversion } = useInversiones();
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleCancel = async (inv: Inversion) => {
    if (inv.inv_estado !== '00') return;
    if (window.confirm('¿Está seguro de cancelar esta inversión?')) {
      await cancelarInversion(inv.id_inv);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-EC');
  };

  if (loading && inversiones.length === 0) {
    return <div className="loading">Cargando inversiones...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="inversiones-container">
      <header className="inversiones-header">
        <h1>Módulo de Inversiones</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          Nueva Inversión
        </button>
      </header>

      {showForm && (
        <InversionForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      {selectedId && (
        <InversionDetail
          id={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}

      <table className="inversiones-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Monto</th>
            <th>Plazo</th>
            <th>Modalidad</th>
            <th>Apertura</th>
            <th>Vencimiento</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {inversiones.map(inv => (
            <tr key={inv.id_inv}>
              <td>{ProductoLabels[inv.inv_producto] || inv.inv_producto}</td>
              <td>{formatCurrency(inv.inv_monto)}</td>
              <td>{inv.inv_plazo_dias} días</td>
              <td>{inv.inv_modalidad_interes}</td>
              <td>{formatDate(inv.inv_fecha_apertura)}</td>
              <td>{formatDate(inv.inv_fecha_vencimiento)}</td>
              <td>
                <span className={`estado estado-${inv.inv_estado}`}>
                  {EstadoLabels[inv.inv_estado] || inv.inv_estado}
                </span>
              </td>
              <td className="actions">
                <button
                  className="btn-secondary"
                  onClick={() => setSelectedId(inv.id_inv)}
                >
                  Ver
                </button>
                {inv.inv_estado === '00' && (
                  <button
                    className="btn-danger"
                    onClick={() => handleCancel(inv)}
                  >
                    Cancelar
                  </button>
                )}
              </td>
            </tr>
          ))}
          {inversiones.length === 0 && (
            <tr>
              <td colSpan={8} className="empty">No hay inversiones registradas</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InversionesList;
