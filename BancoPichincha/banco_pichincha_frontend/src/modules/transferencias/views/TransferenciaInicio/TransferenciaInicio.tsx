/**
 * TransferenciaInicio - Pantalla principal de transferencias
 * Muestra contactos guardados y opciones para nueva transferencia
 */

import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, ArrowLeftRight, Search } from 'lucide-react';
import { ContactoCard, SearchBar, LoadingSpinner, ActionButton } from '../../components';
import { transferenciasService } from '../../services/transferencias.service';
import type { Contacto, VistaTransferencia } from '../../types/transferencias.types';
import styles from './TransferenciaInicio.module.css';

interface TransferenciaInicioProps {
  clienteId: number | string;
  onNavigate: (vista: VistaTransferencia, datos?: any) => void;
}

const TransferenciaInicio: React.FC<TransferenciaInicioProps> = ({ 
  clienteId, 
  onNavigate 
}) => {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarContactos();
  }, [clienteId]);

  const cargarContactos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transferenciasService.obtenerContactos(clienteId);
      setContactos(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar contactos');
    } finally {
      setLoading(false);
    }
  };

  const contactosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return contactos;
    
    const termino = busqueda.toLowerCase();
    return contactos.filter(contacto => 
      contacto.alias?.toLowerCase().includes(termino) ||
      contacto.nombreBeneficiario.toLowerCase().includes(termino) ||
      contacto.numeroCuenta.includes(busqueda)
    );
  }, [contactos, busqueda]);

  const handleSeleccionarContacto = (contacto: Contacto) => {
    onNavigate('MONTO', { 
      contacto,
      tipoTransferencia: contacto.banco ? 'INTERBANCARIA' : 'INTERNA'
    });
  };

  const handleNuevoContacto = () => {
    onNavigate('NUEVO_CONTACTO_SELECCION');
  };

  const handleTransferirEntreCuentas = () => {
    onNavigate('MONTO', { 
      tipoTransferencia: 'ENTRE_CUENTAS'
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner message="Cargando contactos..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Transferencias</h1>
        <p className={styles.subtitle}>Envía dinero a tus contactos de forma rápida y segura</p>
      </div>

      {/* Acciones rápidas */}
      <div className={styles.quickActions}>
        <button 
          className={styles.quickAction}
          onClick={handleNuevoContacto}
        >
          <div className={styles.quickActionIcon}>
            <UserPlus size={24} />
          </div>
          <span>Añadir nuevo contacto</span>
        </button>

        <button 
          className={styles.quickAction}
          onClick={handleTransferirEntreCuentas}
        >
          <div className={styles.quickActionIcon}>
            <ArrowLeftRight size={24} />
          </div>
          <span>Transferir entre mis cuentas</span>
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className={styles.searchSection}>
        <SearchBar
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar por nombre, alias o número de cuenta"
        />
      </div>

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <ActionButton variant="outline" size="small" onClick={cargarContactos}>
            Reintentar
          </ActionButton>
        </div>
      )}

      {/* Lista de contactos */}
      <div className={styles.contactosSection}>
        <h2 className={styles.sectionTitle}>
          {busqueda ? 'Resultados de búsqueda' : 'Contactos guardados'}
          <span className={styles.count}>{contactosFiltrados.length}</span>
        </h2>

        {contactosFiltrados.length === 0 ? (
          <div className={styles.emptyState}>
            {busqueda ? (
              <>
                <Search size={48} />
                <h3>Sin resultados</h3>
                <p>No se encontraron contactos que coincidan con "{busqueda}"</p>
              </>
            ) : (
              <>
                <UserPlus size={48} />
                <h3>No tienes contactos guardados</h3>
                <p>Añade tu primer contacto para realizar transferencias más rápido</p>
                <ActionButton onClick={handleNuevoContacto} icon={<UserPlus size={18} />}>
                  Añadir contacto
                </ActionButton>
              </>
            )}
          </div>
        ) : (
          <div className={styles.contactosList}>
            {contactosFiltrados.map((contacto) => (
              <ContactoCard
                key={contacto.id}
                contacto={contacto}
                onClick={handleSeleccionarContacto}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferenciaInicio;
