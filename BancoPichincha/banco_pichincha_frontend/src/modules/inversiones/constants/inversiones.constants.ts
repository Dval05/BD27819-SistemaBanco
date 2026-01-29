export const CONFIGURACION = {
  MONTO_MINIMO: 500,
  MONTO_MAXIMO: 5000000,
  PLAZO_MINIMO_DIAS: 31,
  PLAZO_MAXIMO_DIAS: 1800,
  PLAZO_MINIMO_MESES: 1,
  PLAZO_MAXIMO_MESES: 60,
};

export const MENSAJES = {
  SALDO_INSUFICIENTE: 'La cuenta seleccionada no posee el saldo suficiente para realizar el depósito a plazo',
  MONTO_MINIMO: `El mínimo es $${CONFIGURACION.MONTO_MINIMO.toLocaleString()}`,
  PLAZO_MINIMO: `Escribe un valor entre 31 y ${CONFIGURACION.PLAZO_MAXIMO_DIAS} días`,
  EXITO_CREACION: 'Depósito a plazo creado exitosamente',
  ERROR_CREACION: 'Error al crear el depósito a plazo',
  CONFIRMAR_CANCELACION: '¿Está seguro que desea cancelar esta inversión?',
};

export const UNIDADES_PLAZO = {
  DIAS: 'dias',
  MESES: 'meses',
} as const;

export type UnidadPlazo = typeof UNIDADES_PLAZO[keyof typeof UNIDADES_PLAZO];

export const convertirPlazo = {
  diasAMeses: (dias: number): number => Math.round(dias / 30),
  mesesADias: (meses: number): number => meses * 30,
};
