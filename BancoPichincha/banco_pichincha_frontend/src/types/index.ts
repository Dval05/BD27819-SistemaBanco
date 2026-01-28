export interface Cliente {
  id: string;
  usuario: string;
  email: string;
  telefono: number;
  tipoPersona: 'NATURAL' | 'JURIDICA';
  estado: 'ACTIVO' | 'INACTIVO';
  nombre?: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  fechaNacimiento?: string;
  razonSocial?: string;
  nombreComercial?: string;
  ruc?: string;
}

export interface Transaccion {
  id_tra: string;
  id_cuenta: string;
  tra_tipo: string;
  tra_monto: number;
  tra_descripcion: string;
  tra_estado: string;
  tra_fecha_hora: string;
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
