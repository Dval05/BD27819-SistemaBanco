// Enums
export enum InversionProducto {
  PLAZO_FIJO = '00',
  FONDO_INVERSION = '01',
}

export enum InversionEstado {
  ACTIVA = '00',
  VENCIDA = '01',
  CANCELADA = '02',
  RENOVADA = '03',
}

export enum ModalidadInteres {
  MENSUAL = 'MENSUAL',
  TRIMESTRAL = 'TRIMESTRAL',
  SEMESTRAL = 'SEMESTRAL',
  AL_VENCIMIENTO = 'AL_VENCIMIENTO',
}

export enum RenovacionAuto {
  SI = '00',
  NO = '01',
}

// Labels
export const ProductoLabels: Record<string, string> = {
  '00': 'Depósito a Plazo Fijo',
  '01': 'Fondo de Inversión',
};

export const EstadoLabels: Record<string, string> = {
  '00': 'Activa',
  '01': 'Vencida',
  '02': 'Cancelada',
  '03': 'Renovada',
};

export const ModalidadLabels: Record<string, string> = {
  MENSUAL: 'Mensual',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  AL_VENCIMIENTO: 'Al Vencimiento',
};

// Interfaces
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
  inv_tasa_interes?: number;
}

export interface InversionCronograma {
  id_invcr: string;
  id_inv: string;
  invcr_tipo: string;
  invcr_fecha_programada: string;
  invcr_monto_programado: number;
  invcr_estado: string;
}

export interface CreateInversionDTO {
  idCuenta: string;
  producto: string;
  monto: number;
  plazoDias: number;
  modalidadInteres: string;
  renovacionAuto?: string;
}

export interface Cuenta {
  id_cuenta: string;
  cue_numero: string;
  cue_saldo_disponible: number;
  cue_estado: string;
  tipo?: string;
}
