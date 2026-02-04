const { TASAS_INVERSION } = require('../../../shared/constants/tasas-inversion.constants');

class CalculadoraInversion {
  /**
   * Obtiene la tasa de interés según monto y plazo
   */
  static obtenerTasa(monto, plazoDias) {
    const tasaEncontrada = TASAS_INVERSION.find(
      (regla) =>
        plazoDias >= regla.plazoMin &&
        plazoDias <= regla.plazoMax &&
        monto >= regla.montoMin &&
        monto < regla.montoMax
    );

    if (!tasaEncontrada) {
      // Tasa por defecto si no se encuentra
      return 2.50;
    }

    return tasaEncontrada.tasa;
  }

  /**
   * Calcula el interés ganado
   */
  static calcularInteres(monto, tasaAnual, plazoDias) {
    // Auto-detectar formato de tasa
    let tasa = tasaAnual;
    if (tasa > 1) {
      tasa = tasa / 100; // Convertir porcentaje a decimal
    }
    
    const interes = (monto * tasa * plazoDias) / 360;
    return Math.round(interes * 100) / 100; // Redondear a 2 decimales
  }

  /**
   * Calcula el monto total a recibir
   */
  static calcularMontoFinal(monto, interes) {
    return Math.round((monto + interes) * 100) / 100;
  }

  /**
   * Simula una inversión completa
   */
  static simular(monto, plazoDias) {
    const tasa = this.obtenerTasa(monto, plazoDias);
    const interes = this.calcularInteres(monto, tasa, plazoDias);
    const montoFinal = this.calcularMontoFinal(monto, interes);

    const fechaInicio = new Date();
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + plazoDias);

    // Ajustar fecha si cae en fin de semana
    const diaSemana = fechaVencimiento.getDay();
    if (diaSemana === 0) {
      // Domingo
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 1);
    } else if (diaSemana === 6) {
      // Sábado
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 2);
    }

    return {
      monto,
      plazoDias,
      tasa,
      interes,
      montoFinal,
      fechaInicio: fechaInicio.toISOString().split('T')[0],
      fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
    };
  }

  /**
   * Genera recomendaciones de plazos optimizados
   */
  static generarRecomendaciones(monto) {
    const plazos = [61, 91, 121];
    return plazos.map((plazo) => this.simular(monto, plazo));
  }

  /**
   * Calcula fecha de vencimiento ajustando por días no laborables
   */
  static calcularFechaVencimiento(fechaInicio, plazoDias) {
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + plazoDias);

    const diaSemana = fecha.getDay();
    if (diaSemana === 0) {
      fecha.setDate(fecha.getDate() + 1);
    } else if (diaSemana === 6) {
      fecha.setDate(fecha.getDate() + 2);
    }

    return fecha.toISOString().split('T')[0];
  }
}

module.exports = CalculadoraInversion;
