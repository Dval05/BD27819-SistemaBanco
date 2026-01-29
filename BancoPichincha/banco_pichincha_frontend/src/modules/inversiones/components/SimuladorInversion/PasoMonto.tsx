import React from 'react';
import { CONFIGURACION, MENSAJES } from '../../constants/inversiones.constants';
import styles from './SimuladorInversion.module.css';

interface Props {
  monto: number;
  onChange: (monto: number) => void;
  onContinuar: () => void;
}

const PasoMonto: React.FC<Props> = ({ monto, onChange, onContinuar }) => {
  const [valorInput, setValorInput] = React.useState(monto.toString());
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setValorInput(value);
    
    const numValue = parseFloat(value) || 0;
    onChange(numValue);

    if (numValue > 0 && numValue < CONFIGURACION.MONTO_MINIMO) {
      setError(MENSAJES.MONTO_MINIMO);
    } else if (numValue > CONFIGURACION.MONTO_MAXIMO) {
      setError(`El máximo es $${CONFIGURACION.MONTO_MAXIMO.toLocaleString()}`);
    } else {
      setError(null);
    }
  };

  const handleContinuar = () => {
    if (monto >= CONFIGURACION.MONTO_MINIMO && monto <= CONFIGURACION.MONTO_MAXIMO) {
      onContinuar();
    }
  };

  const formatDisplay = (value: string) => {
    if (!value) return '';
    return parseFloat(value).toLocaleString('en-US');
  };

  return (
    <div className={styles.pasoContainer}>
      <h2 className={styles.titulo}>Monto de depósito</h2>

      <div className={styles.montoDisplay}>
        <span className={styles.simbolo}>$</span>
        <span className={styles.valor}>{monto > 0 ? formatDisplay(valorInput) : '0,00'}</span>
      </div>

      <input
        type="text"
        className={styles.montoInput}
        value={valorInput}
        onChange={handleChange}
        placeholder="0"
      />

      <p className={styles.ayuda}>
        Ingresa un monto entre ${CONFIGURACION.MONTO_MINIMO.toLocaleString()} y $
        {CONFIGURACION.MONTO_MAXIMO.toLocaleString()}
      </p>

      {error && <p className={styles.error}>{error}</p>}

      <button
        className={styles.btnContinuar}
        onClick={handleContinuar}
        disabled={monto < CONFIGURACION.MONTO_MINIMO || monto > CONFIGURACION.MONTO_MAXIMO}
      >
        Continuar
      </button>
    </div>
  );
};

export default PasoMonto;
