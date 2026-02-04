/**
 * Types para el módulo de Transferencias
 * Banco Pichincha Frontend
 */

// Estados de las vistas
export type VistaTransferencia = 
  | 'INICIO'
  | 'NUEVO_CONTACTO_SELECCION'
  | 'NUEVO_CONTACTO_PICHINCHA'
  | 'NUEVO_CONTACTO_OTRO_BANCO'
  | 'MONTO'
  | 'CONFIRMACION'
  | 'EXITO'
  | 'ERROR';

// Tipos de identificación
export type TipoIdentificacion = '00' | '01' | '02';

// Tipos de cuenta
export type TipoCuenta = '00' | '01';

// Tipos de transferencia
export enum TipoTransferencia {
  INTERNA = '00',       // Banco Pichincha
  INTERBANCARIA = '01'  // Otro banco
}

// Estados de transferencia
export enum EstadoTransferencia {
  PENDIENTE = '00',
  COMPLETADA = '01',
  FALLIDA = '02',
  REVERSADA = '03'
}

// Interfaz de Banco
export interface Banco {
  id: number;
  nombre: string;
  codigo: string;
  estado: string;
}

// Interfaz de Contacto
export interface Contacto {
  id: number;
  alias: string;
  nombreBeneficiario: string;
  tipoIdentificacion: string;
  identificacion: string;
  numeroCuenta: string;
  email?: string;
  tipoCuenta: string;
  banco: number | null;
  bancoNombre?: string;
  estado: string;
  fechaCreacion: string;
}

// Interfaz para crear contacto
export interface CrearContactoRequest {
  cliId?: number | string;
  idPersona?: number | string;
  banId?: number;
  idBanco?: number;
  conTipoIdentificacion: string;
  conIdentificacion: string;
  conNombreBeneficiario: string;
  conTipoCuenta: string;
  conNumeroCuenta: string;
  conEmail?: string;
  conAlias: string;
}

// Interfaz de cuenta del usuario
export interface Cuenta {
  id: number;
  numeroCuenta: string;
  tipoCuenta: string;
  saldoDisponible: number;
}

// Interfaz de límite transaccional
export interface LimiteTransaccional {
  montoMaximoDiario: number;
  montoMaximoTransaccion: number;
  cantidadMaximaDiaria: number;
  disponibleDiario: number;
  cantidadDisponible: number;
  transferenciasHoy: number;
}

// Datos del beneficiario seleccionado
export interface Beneficiario {
  id?: number;
  nombre: string;
  numeroCuenta: string;
  tipoCuenta: string;
  tipoIdentificacion: string;
  identificacion: string;
  email?: string;
  banco: number | null;
  bancoNombre?: string;
  alias?: string;
  esNuevo: boolean;
  guardarContacto: boolean;
}

// Datos de la transferencia a realizar
export interface DatosTransferencia {
  beneficiario: Beneficiario;
  cuentaOrigen: Cuenta;
  monto: number;
  descripcion: string;
  tipoTransferencia: TipoTransferencia;
  comision: number;
  montoTotal: number;
}

// Request para crear transferencia
export interface CrearTransferenciaRequest {
  cliId: number | string;
  traCuentaOrigen: string;
  traCuentaDestino: string;
  traMonto: number;
  traTipoTransferencia: string;
  traDescripcion?: string;
  conId?: number;
}

// Respuesta de transferencia
export interface TransferenciaResponse {
  id: number;
  numeroOperacion?: string;
  monto: number;
  comision: number;
  total: number;
  estado: string;
  fecha: string;
  mensaje?: string;
}

// Respuesta de validación de cuenta Pichincha
export interface ValidacionCuentaResponse {
  existe: boolean;
  nombreTitular?: string;
  tipoCuenta?: string;
  tipoIdentificacion?: string;  // '00'=Cédula, '01'=RUC, '02'=Pasaporte
  identificacion?: string;       // Número de identificación
  mensaje?: string;
}

// Respuesta genérica de la API
export interface ApiResponse<T> {
  exito: boolean;
  mensaje: string;
  datos: T;
}

// Constantes
export const LIMITE_DIARIO_WEB = 15000;
export const COMISION_INTERBANCARIA = 0.41;
export const CODIGO_BANCO_PICHINCHA = '0010';

// Mapeo de tipos de identificación
export const TIPOS_IDENTIFICACION_MAP = {
  '00': 'Cédula',
  '01': 'RUC',
  '02': 'Pasaporte'
};

// Mapeo de tipos de cuenta
export const TIPOS_CUENTA_MAP = {
  '00': 'Ahorros',
  '01': 'Corriente'
};
