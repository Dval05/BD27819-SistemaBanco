export interface Cliente {
  _id: string;
  nombre: string;
  cedula: string;
  email: string;
  telefono?: string;
  usuario: string;
  password: string;
  saldo: number;
  codigoDeuna: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaccion {
  _id: string;
  clienteId: string;
  tipo: 'DEPOSITO' | 'TRANSFERENCIA_ENVIADA' | 'TRANSFERENCIA_RECIBIDA';
  monto: number;
  descripcion: string;
  referencia?: string;
  saldoResultante: number;
  fecha: string;
}

export interface LoginResponse {
  ok: boolean;
  msg: string;
  data: Cliente;
}

export interface RegistroResponse {
  ok: boolean;
  msg: string;
  data: Cliente;
}

export interface TransaccionesResponse {
  ok: boolean;
  data: Transaccion[];
}
