/**
 * Módulo de Contactos
 * Gestión de contactos para transferencias
 */

import { useState } from 'react';
import { Search, Plus, User, Phone, Mail, ChevronRight, Trash2 } from 'lucide-react';
import type { Cliente } from '../../types';
import './Contactos.css';

interface Contacto {
  id: string;
  nombre: string;
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  email?: string;
  telefono?: string;
  esFavorito: boolean;
}

interface ContactosProps {
  cliente: Cliente;
  onNavigate: (moduleId: string, data?: any) => void;
}

function Contactos({ onNavigate }: ContactosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [contactos] = useState<Contacto[]>([
    // Los contactos se cargarán desde la API
  ]);

  const contactosFiltrados = contactos.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.numeroCuenta.includes(searchTerm)
  );

  return (
    <div className="contactos-module">
      <header className="contactos-header">
        <h1>Mis Contactos</h1>
        <button className="add-contacto-btn">
          <Plus size={20} />
          Agregar contacto
        </button>
      </header>

      <div className="contactos-search">
        <Search size={20} />
        <input 
          type="text"
          placeholder="Buscar por nombre o número de cuenta"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {contactosFiltrados.length === 0 ? (
        <div className="contactos-empty">
          <User size={48} />
          <h3>No tienes contactos registrados</h3>
          <p>Agrega contactos para realizar transferencias más rápido</p>
          <button className="add-contacto-btn primary">
            <Plus size={20} />
            Agregar mi primer contacto
          </button>
        </div>
      ) : (
        <div className="contactos-list">
          {contactosFiltrados.map((contacto) => (
            <div 
              key={contacto.id} 
              className="contacto-card"
              onClick={() => onNavigate('transferencias', { contacto })}
            >
              <div className="contacto-avatar">
                {contacto.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="contacto-info">
                <span className="contacto-nombre">{contacto.nombre}</span>
                <span className="contacto-cuenta">
                  {contacto.banco} - {contacto.tipoCuenta} ****{contacto.numeroCuenta.slice(-4)}
                </span>
                <div className="contacto-contacto">
                  {contacto.email && (
                    <span><Mail size={12} /> {contacto.email}</span>
                  )}
                  {contacto.telefono && (
                    <span><Phone size={12} /> {contacto.telefono}</span>
                  )}
                </div>
              </div>
              <div className="contacto-actions">
                <button className="action-btn transfer" onClick={(e) => { e.stopPropagation(); onNavigate('transferencias', { contacto }); }}>
                  Transferir
                </button>
                <button className="action-btn delete" onClick={(e) => e.stopPropagation()}>
                  <Trash2 size={16} />
                </button>
                <ChevronRight size={20} className="arrow" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Contactos;
