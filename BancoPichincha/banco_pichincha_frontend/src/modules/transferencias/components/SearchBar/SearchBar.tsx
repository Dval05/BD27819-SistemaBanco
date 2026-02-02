/**
 * SearchBar - Barra de búsqueda de contactos
 * Permite filtrar contactos por nombre o alias
 */

import React from 'react';
import { Search, X } from 'lucide-react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Buscar contactos...' 
}) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={styles.container}>
      <Search className={styles.icon} size={20} />
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button className={styles.clearButton} onClick={handleClear} type="button">
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
