const InversionProducto = {
  PLAZO_FIJO: '00',
  FONDO_INVERSION: '01',
};

const InversionEstado = {
  ACTIVA: '00',
  VENCIDA: '01',
  CANCELADA: '02',
  RENOVADA: '03',
};

const ModalidadInteres = {
  MENSUAL: 'MENSUAL',
  TRIMESTRAL: 'TRIMESTRAL',
  SEMESTRAL: 'SEMESTRAL',
  AL_VENCIMIENTO: 'AL_VENCIMIENTO',
};

const RenovacionAuto = {
  SI: '00',
  NO: '01',
};

// Labels para frontend
const ProductoLabels = {
  '00': 'Depósito a Plazo Fijo',
  '01': 'Fondo de Inversión',
};

const EstadoLabels = {
  '00': 'Activa',
  '01': 'Vencida',
  '02': 'Cancelada',
  '03': 'Renovada',
};

const ModalidadLabels = {
  MENSUAL: 'Mensual',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  AL_VENCIMIENTO: 'Al Vencimiento',
};

module.exports = {
  InversionProducto,
  InversionEstado,
  ModalidadInteres,
  RenovacionAuto,
  ProductoLabels,
  EstadoLabels,
  ModalidadLabels,
};
