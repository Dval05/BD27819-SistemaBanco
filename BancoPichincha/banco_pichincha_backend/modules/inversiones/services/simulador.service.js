const CalculadoraInversion = require('../utils/calculadora.util');
const { CONFIGURACION_INVERSION } = require('../../../shared/constants/tasas-inversion.constants');

class SimuladorService {
  /**
   * Simula una inversión
   */
  async simular(monto, plazoDias) {
    // Validaciones
    if (!monto || monto < CONFIGURACION_INVERSION.MONTO_MINIMO) {
      throw {
        status: 400,
        message: `El monto mínimo es $${CONFIGURACION_INVERSION.MONTO_MINIMO}`,
      };
    }

    if (monto > CONFIGURACION_INVERSION.MONTO_MAXIMO) {
      throw {
        status: 400,
        message: `El monto máximo es $${CONFIGURACION_INVERSION.MONTO_MAXIMO}`,
      };
    }

    if (!plazoDias || plazoDias < CONFIGURACION_INVERSION.PLAZO_MINIMO_DIAS) {
      throw {
        status: 400,
        message: `El plazo mínimo es ${CONFIGURACION_INVERSION.PLAZO_MINIMO_DIAS} días`,
      };
    }

    if (plazoDias > CONFIGURACION_INVERSION.PLAZO_MAXIMO_DIAS) {
      throw {
        status: 400,
        message: `El plazo máximo es ${CONFIGURACION_INVERSION.PLAZO_MAXIMO_DIAS} días`,
      };
    }

    const simulacion = CalculadoraInversion.simular(monto, plazoDias);
    const recomendaciones = CalculadoraInversion.generarRecomendaciones(monto);

    return {
      simulacion,
      recomendaciones,
      configuracion: {
        montoMinimo: CONFIGURACION_INVERSION.MONTO_MINIMO,
        montoMaximo: CONFIGURACION_INVERSION.MONTO_MAXIMO,
        plazoMinimo: CONFIGURACION_INVERSION.PLAZO_MINIMO_DIAS,
        plazoMaximo: CONFIGURACION_INVERSION.PLAZO_MAXIMO_DIAS,
      },
    };
  }

  /**
   * Obtiene solo las recomendaciones
   */
  async obtenerRecomendaciones(monto) {
    if (!monto || monto < CONFIGURACION_INVERSION.MONTO_MINIMO) {
      throw {
        status: 400,
        message: `El monto mínimo es $${CONFIGURACION_INVERSION.MONTO_MINIMO}`,
      };
    }

    return CalculadoraInversion.generarRecomendaciones(monto);
  }
}

module.exports = new SimuladorService();
