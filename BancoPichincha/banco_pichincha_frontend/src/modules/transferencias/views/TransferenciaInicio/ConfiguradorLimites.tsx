/**
 * ConfiguradorLimites - Componente para configurar límites de transferencia
 * Módulo colapsable para editar límites diarios y por transacción
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, Settings, Save, AlertCircle } from 'lucide-react';
import { transferenciasService } from '../../services/transferencias.service';
import type { LimiteTransaccional } from '../../types/transferencias.types';
import styles from './ConfiguradorLimites.module.css';

interface ConfiguradorLimitesProps {
  clienteId: number | string;
}

const ConfiguradorLimites: React.FC<ConfiguradorLimitesProps> = ({ clienteId }) => {
  const [expandido, setExpandido] = useState(false);
  const [limites, setLimites] = useState<LimiteTransaccional | null>(null);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  // Formulario
  const [montoMaximoDiario, setMontoMaximoDiario] = useState('');
  const [montoMaximoTransaccion, setMontoMaximoTransaccion] = useState('');
  const [cantidadMaximaDiaria, setCantidadMaximaDiaria] = useState('');

  useEffect(() => {
    cargarLimites();
  }, [clienteId]);

  const cargarLimites = async () => {
    try {
      const data = await transferenciasService.obtenerLimitesDisponibles(clienteId);
      setLimites(data);
      setMontoMaximoDiario(data.montoMaximoDiario?.toString() || '15000');
      setMontoMaximoTransaccion(data.montoMaximoTransaccion?.toString() || '5000');
      setCantidadMaximaDiaria(data.cantidadMaximaDiaria?.toString() || '20');
    } catch (err) {
      console.error('Error al cargar límites:', err);
    }
  };

  const handleGuardar = async () => {
    setError(null);
    setExito(false);

    // Validaciones
    const monto1 = parseFloat(montoMaximoDiario);
    const monto2 = parseFloat(montoMaximoTransaccion);
    const cantidad = parseInt(cantidadMaximaDiaria);

    if (!monto1 || monto1 <= 0) {
      setError('Monto máximo diario debe ser mayor a 0');
      return;
    }

    if (!monto2 || monto2 <= 0) {
      setError('Monto máximo por transacción debe ser mayor a 0');
      return;
    }

    if (monto2 > monto1) {
      setError('El monto por transacción no puede ser mayor que el diario');
      return;
    }

    if (!cantidad || cantidad <= 0) {
      setError('Cantidad máxima debe ser mayor a 0');
      return;
    }

    try {
      setGuardando(true);
      const resultado = await transferenciasService.guardarLimites(clienteId, {
        montoMaximoDiario: monto1,
        montoMaximoTransaccion: monto2,
        cantidadMaximaDiaria: cantidad
      });

      if (resultado.exito) {
        setExito(true);
        setEditando(false);
        await cargarLimites();
        setTimeout(() => setExito(false), 3000);
      } else {
        setError(resultado.mensaje || 'Error al guardar límites');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar límites');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.header}
        onClick={() => setExpandido(!expandido)}
      >
        <div className={styles.headerContent}>
          <Settings size={20} />
          <span>Configurar límites de transferencia</span>
        </div>
        <ChevronDown
          size={20}
          className={`${styles.chevron} ${expandido ? styles.expandido : ''}`}
        />
      </button>

      {expandido && (
        <div className={styles.content}>
          {!editando ? (
            // Vista de lectura
            <div className={styles.lectura}>
              <div className={styles.limiteItem}>
                <span className={styles.label}>Monto máximo diario:</span>
                <span className={styles.valor}>
                  ${parseFloat(montoMaximoDiario).toLocaleString('es-EC', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className={styles.limiteItem}>
                <span className={styles.label}>Monto máximo por transacción:</span>
                <span className={styles.valor}>
                  ${parseFloat(montoMaximoTransaccion).toLocaleString('es-EC', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className={styles.limiteItem}>
                <span className={styles.label}>Cantidad máxima de transferencias diarias:</span>
                <span className={styles.valor}>{cantidadMaximaDiaria}</span>
              </div>
              <button
                className={styles.editarBtn}
                onClick={() => setEditando(true)}
              >
                Editar límites
              </button>
            </div>
          ) : (
            // Vista de edición
            <div className={styles.edicion}>
              <div className={styles.formulario}>
                <div className={styles.grupoFormulario}>
                  <label>Monto máximo diario (USD)</label>
                  <input
                    type="number"
                    value={montoMaximoDiario}
                    onChange={(e) => setMontoMaximoDiario(e.target.value)}
                    placeholder="15000"
                    min="0"
                    step="100"
                  />
                </div>

                <div className={styles.grupoFormulario}>
                  <label>Monto máximo por transacción (USD)</label>
                  <input
                    type="number"
                    value={montoMaximoTransaccion}
                    onChange={(e) => setMontoMaximoTransaccion(e.target.value)}
                    placeholder="5000"
                    min="0"
                    step="100"
                  />
                </div>

                <div className={styles.grupoFormulario}>
                  <label>Cantidad máxima de transferencias diarias</label>
                  <input
                    type="number"
                    value={cantidadMaximaDiaria}
                    onChange={(e) => setCantidadMaximaDiaria(e.target.value)}
                    placeholder="20"
                    min="1"
                    step="1"
                  />
                </div>
              </div>

              {error && (
                <div className={styles.mensaje_error}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {exito && (
                <div className={styles.mensaje_exito}>
                  <span>✓ Límites guardados correctamente</span>
                </div>
              )}

              <div className={styles.botones}>
                <button
                  className={styles.cancelarBtn}
                  onClick={() => {
                    setEditando(false);
                    setError(null);
                    cargarLimites();
                  }}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  className={styles.guardarBtn}
                  onClick={handleGuardar}
                  disabled={guardando}
                >
                  {guardando ? (
                    <>Guardando...</>
                  ) : (
                    <>
                      <Save size={16} />
                      Guardar límites
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConfiguradorLimites;
