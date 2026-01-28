const InversionProducto = {
  PLAZO_FIJO: '00',
  FONDO_INVERSION: '01'
};

const InversionEstado = {
  ACTIVA: '00',
  VENCIDA: '01',
  CANCELADA: '02',
  RENOVADA: '03'
};

const ModalidadInteres = {
  MENSUAL: 'MENSUAL',
  TRIMESTRAL: 'TRIMESTRAL',
  SEMESTRAL: 'SEMESTRAL',
  AL_VENCIMIENTO: 'AL_VENCIMIENTO'
};

const RenovacionAuto = {
  SI: '00',
  NO: '01'
};

module.exports = {
  InversionProducto,
  InversionEstado,
  ModalidadInteres,
  RenovacionAuto
};
