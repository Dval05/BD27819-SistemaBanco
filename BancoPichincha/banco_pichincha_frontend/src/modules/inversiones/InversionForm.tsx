import React, { useState } from 'react';
import { inversionService } from './services/inversionService';
import { InversionProducto, ModalidadInteres } from './types/inversion.types';
import type { CreateInversionDTO } from './types/inversion.types';
import './Inversiones.css';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const InversionForm: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateInversionDTO>({
    idCuenta: '',
    producto: InversionProducto.PLAZO_FIJO,
    monto: 0,
    plazoDias: 30,
    modalidadInteres: ModalidadInteres.MENSUAL,
    renovacionAuto: '01'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: CreateInversionDTO) => ({
      ...prev,
      [name]: name === 'monto' || name === 'plazoDias' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await inversionService.create(formData);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear inversión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="modal-header">
          <h2>Nueva Inversión</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </header>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit} className="inversion-form">
          <div className="form-group">
            <label htmlFor="idCuenta">ID Cuenta</label>
            <input
              type="text"
              id="idCuenta"
              name="idCuenta"
              value={formData.idCuenta}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="producto">Producto</label>
            <select
              id="producto"
              name="producto"
              value={formData.producto}
              onChange={handleChange}
              required
            >
              <option value={InversionProducto.PLAZO_FIJO}>Plazo Fijo</option>
              <option value={InversionProducto.FONDO_INVERSION}>Fondo de Inversión</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="monto">Monto (USD)</label>
            <input
              type="number"
              id="monto"
              name="monto"
              min="100"
              step="100"
              value={formData.monto}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="plazoDias">Plazo (días)</label>
            <input
              type="number"
              id="plazoDias"
              name="plazoDias"
              min="30"
              max="365"
              value={formData.plazoDias}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="modalidadInteres">Modalidad de Interés</label>
            <select
              id="modalidadInteres"
              name="modalidadInteres"
              value={formData.modalidadInteres}
              onChange={handleChange}
              required
            >
              <option value={ModalidadInteres.MENSUAL}>Mensual</option>
              <option value={ModalidadInteres.TRIMESTRAL}>Trimestral</option>
              <option value={ModalidadInteres.SEMESTRAL}>Semestral</option>
              <option value={ModalidadInteres.AL_VENCIMIENTO}>Al Vencimiento</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="renovacionAuto">Renovación Automática</label>
            <select
              id="renovacionAuto"
              name="renovacionAuto"
              value={formData.renovacionAuto}
              onChange={handleChange}
            >
              <option value="00">Sí</option>
              <option value="01">No</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Inversión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InversionForm;
