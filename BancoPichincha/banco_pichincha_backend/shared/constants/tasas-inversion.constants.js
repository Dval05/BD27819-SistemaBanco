/**
 * Tabla de Tasas de Interés para Depósitos a Plazo
 * Basada en monto y plazo en días
 */

const TASAS_INVERSION = [
  // 31-60 días
  { plazoMin: 31, plazoMax: 60, montoMin: 500, montoMax: 4999.99, tasa: 2.65 },
  { plazoMin: 31, plazoMax: 60, montoMin: 5000, montoMax: 9999.99, tasa: 2.85 },
  { plazoMin: 31, plazoMax: 60, montoMin: 10000, montoMax: 49999.99, tasa: 2.90 },
  { plazoMin: 31, plazoMax: 60, montoMin: 50000, montoMax: 99999.99, tasa: 4.70 },
  { plazoMin: 31, plazoMax: 60, montoMin: 100000, montoMax: Infinity, tasa: 4.75 },

  // 61-90 días
  { plazoMin: 61, plazoMax: 90, montoMin: 500, montoMax: 4999.99, tasa: 2.85 },
  { plazoMin: 61, plazoMax: 90, montoMin: 5000, montoMax: 9999.99, tasa: 3.05 },
  { plazoMin: 61, plazoMax: 90, montoMin: 10000, montoMax: 49999.99, tasa: 3.15 },
  { plazoMin: 61, plazoMax: 90, montoMin: 50000, montoMax: 99999.99, tasa: 4.85 },
  { plazoMin: 61, plazoMax: 90, montoMin: 100000, montoMax: Infinity, tasa: 4.90 },

  // 91-120 días
  { plazoMin: 91, plazoMax: 120, montoMin: 500, montoMax: 4999.99, tasa: 3.05 },
  { plazoMin: 91, plazoMax: 120, montoMin: 5000, montoMax: 9999.99, tasa: 3.25 },
  { plazoMin: 91, plazoMax: 120, montoMin: 10000, montoMax: 49999.99, tasa: 3.55 },
  { plazoMin: 91, plazoMax: 120, montoMin: 50000, montoMax: 99999.99, tasa: 5.00 },
  { plazoMin: 91, plazoMax: 120, montoMin: 100000, montoMax: Infinity, tasa: 5.05 },

  // 121-180 días
  { plazoMin: 121, plazoMax: 180, montoMin: 500, montoMax: 4999.99, tasa: 4.75 },
  { plazoMin: 121, plazoMax: 180, montoMin: 5000, montoMax: 9999.99, tasa: 4.80 },
  { plazoMin: 121, plazoMax: 180, montoMin: 10000, montoMax: 49999.99, tasa: 5.10 },
  { plazoMin: 121, plazoMax: 180, montoMin: 50000, montoMax: 99999.99, tasa: 5.15 },
  { plazoMin: 121, plazoMax: 180, montoMin: 100000, montoMax: Infinity, tasa: 5.20 },

  // 181-240 días
  { plazoMin: 181, plazoMax: 240, montoMin: 500, montoMax: 4999.99, tasa: 4.80 },
  { plazoMin: 181, plazoMax: 240, montoMin: 5000, montoMax: 9999.99, tasa: 4.85 },
  { plazoMin: 181, plazoMax: 240, montoMin: 10000, montoMax: 49999.99, tasa: 5.15 },
  { plazoMin: 181, plazoMax: 240, montoMin: 50000, montoMax: 99999.99, tasa: 5.20 },
  { plazoMin: 181, plazoMax: 240, montoMin: 100000, montoMax: Infinity, tasa: 5.25 },

  // 241-300 días
  { plazoMin: 241, plazoMax: 300, montoMin: 500, montoMax: 4999.99, tasa: 4.85 },
  { plazoMin: 241, plazoMax: 300, montoMin: 5000, montoMax: 9999.99, tasa: 4.90 },
  { plazoMin: 241, plazoMax: 300, montoMin: 10000, montoMax: 49999.99, tasa: 5.20 },
  { plazoMin: 241, plazoMax: 300, montoMin: 50000, montoMax: 99999.99, tasa: 5.30 },
  { plazoMin: 241, plazoMax: 300, montoMin: 100000, montoMax: Infinity, tasa: 5.35 },

  // 301-360 días
  { plazoMin: 301, plazoMax: 360, montoMin: 500, montoMax: 4999.99, tasa: 4.90 },
  { plazoMin: 301, plazoMax: 360, montoMin: 5000, montoMax: 9999.99, tasa: 5.00 },
  { plazoMin: 301, plazoMax: 360, montoMin: 10000, montoMax: 49999.99, tasa: 5.30 },
  { plazoMin: 301, plazoMax: 360, montoMin: 50000, montoMax: 99999.99, tasa: 5.40 },
  { plazoMin: 301, plazoMax: 360, montoMin: 100000, montoMax: Infinity, tasa: 5.45 },

  // 361+ días
  { plazoMin: 361, plazoMax: 1800, montoMin: 500, montoMax: 4999.99, tasa: 4.95 },
  { plazoMin: 361, plazoMax: 1800, montoMin: 5000, montoMax: 9999.99, tasa: 5.10 },
  { plazoMin: 361, plazoMax: 1800, montoMin: 10000, montoMax: 49999.99, tasa: 5.35 },
  { plazoMin: 361, plazoMax: 1800, montoMin: 50000, montoMax: 99999.99, tasa: 5.45 },
  { plazoMin: 361, plazoMax: 1800, montoMin: 100000, montoMax: Infinity, tasa: 5.50 },
];

const CONFIGURACION_INVERSION = {
  MONTO_MINIMO: 500,
  MONTO_MAXIMO: 5000000,
  PLAZO_MINIMO_DIAS: 31,
  PLAZO_MAXIMO_DIAS: 1800,
  RENOVACION_AUTOMATICA_DEFAULT: '01', // No
};

const MODALIDADES_PAGO_INTERES = {
  AL_VENCIMIENTO: 'AL_VENCIMIENTO',
  MENSUAL: 'MENSUAL',
  TRIMESTRAL: 'TRIMESTRAL',
  SEMESTRAL: 'SEMESTRAL',
};

module.exports = {
  TASAS_INVERSION,
  CONFIGURACION_INVERSION,
  MODALIDADES_PAGO_INTERES,
};
