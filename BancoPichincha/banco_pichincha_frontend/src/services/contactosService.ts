const API_BASE_URL = 'http://localhost:3000/api';

export interface Contacto {
  id: string;
  idPersona: string;
  alias: string;
  nombreBeneficiario: string | null;
  tipoIdentificacion: string;
  identificacion: string;
  numeroCuenta: string;
  email: string;
  tipoCuenta: string;
  banco: {
    id: string;
    nombre: string;
    codigo: string;
  } | null;
  fechaCreacion: string;
}

export interface Banco {
  id: string;
  nombre: string;
  codigo: string;
}

export interface CrearContactoRequest {
  id_persona: string;
  alias: string;
  nombreBeneficiario?: string;
  tipoIdentificacion: string;
  identificacion: string;
  numeroCuenta: string;
  email: string;
  tipoCuenta: string;
  id_banco?: string | null;
}

export interface ValidarCuentaResponse {
  success: boolean;
  esBancoPichincha: boolean;
  message: string;
  datos?: {
    numeroCuenta: string;
    tipoCuenta: string;
    tipoIdentificacion: string;
    identificacion: string;
    nombreBeneficiario: string;
    email: string;
  };
}

const contactosService = {
  async obtenerContactos(idPersona: string): Promise<Contacto[]> {
    const response = await fetch(`${API_BASE_URL}/contactos/${idPersona}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Error al obtener contactos');
    }
    
    return data.data;
  },

  async crearContacto(contacto: CrearContactoRequest): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/contactos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contacto)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Error al crear contacto');
    }
  },

  async editarContacto(idContacto: string, updates: Partial<{
    alias: string;
    nombreBeneficiario: string;
    email: string;
    id_banco: string | null;
  }>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/contactos/${idContacto}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Error al editar contacto');
    }
  },

  async eliminarContacto(idContacto: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/contactos/${idContacto}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Error al eliminar contacto');
    }
  },

  async obtenerBancos(): Promise<Banco[]> {
    const response = await fetch(`${API_BASE_URL}/contactos/bancos/listar`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Error al obtener bancos');
    }
    
    return data.data;
  },

  async validarCuenta(numeroCuenta: string): Promise<ValidarCuentaResponse> {
    const response = await fetch(`${API_BASE_URL}/contactos/validar/cuenta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ numeroCuenta })
    });
    
    const data = await response.json();
    return data;
  }
};

export default contactosService;
