export interface SimulacionInversion {
  monto: number;
  plazoDias: number;
  tasa: number;
  interes: number;
  montoFinal: number;
  fechaInicio: string;
  fechaVencimiento: string;
}

export interface RecomendacionPlazo extends SimulacionInversion {
  // Hereda todas las propiedades de SimulacionInversion
}

export interface ResultadoSimulacion {
  simulacion: SimulacionInversion;
  recomendaciones: RecomendacionPlazo[];
  configuracion: {
    montoMinimo: number;
    montoMaximo: number;
    plazoMinimo: number;
    plazoMaximo: number;
  };
}

export interface RangoTasa {
  montoMin: number;
  montoMax: number | null;
  tasa: number;
}

export interface GrupoTasas {
  key: string;
  label: string;
  tasas: RangoTasa[];
}

export interface TablaTasas {
  rangos: GrupoTasas[];
}
