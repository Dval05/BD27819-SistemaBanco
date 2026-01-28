export interface Inversion {
  id_inv: string;
  id_cuenta: string;
  inv_producto: string;
  inv_monto: number;
  inv_plazo_dias: number;
  inv_modalidad_interes: string;
  inv_fecha_apertura: string;
  inv_fecha_vencimiento: string;
  inv_renovacion_auto: string;
  inv_estado: string;
}

export interface InversionCronograma {
  id_invcr: string;
  id_inv: string;
  invcr_tipo: string;
  invcr_fecha_programada: string;
  invcr_monto_programado: number;
  invcr_estado: string;
}

export interface InversionMovimiento {
  id_invmov: string;
  id_inv: string;
  id_tra: string;
  invmov_tipo: string;
}

export interface CreateInversionDTO {
  idCuenta: string;
  producto: string;
  monto: number;
  plazoDias: number;
  modalidadInteres: string;
  renovacionAuto?: string;
}

export const InversionProducto = {
  PLAZO_FIJO: '00',
  FONDO_INVERSION: '01'
} as const;

export const InversionEstado = {
  ACTIVA: '00',
  VENCIDA: '01',
  CANCELADA: '02',
  RENOVADA: '03'
} as const;

export const ModalidadInteres = {
  MENSUAL: 'MENSUAL',
  TRIMESTRAL: 'TRIMESTRAL',
  SEMESTRAL: 'SEMESTRAL',
  AL_VENCIMIENTO: 'AL_VENCIMIENTO'
} as const;

export const ProductoLabels: Record<string, string> = {
  '00': 'Plazo Fijo',
  '01': 'Fondo de Inversión'
};

export const EstadoLabels: Record<string, string> = {
  '00': 'Activa',
  '01': 'Vencida',
  '02': 'Cancelada',
  '03': 'Renovada'
};
