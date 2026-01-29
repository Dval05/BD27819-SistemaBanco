const { TASAS_INVERSION } = require('../../../shared/constants/tasas-inversion.constants');

class TasasService {
  /**
   * Obtiene la tabla completa de tasas formateada
   */
  async obtenerTabla() {
    // Agrupar tasas por rango de plazo
    const tablaAgrupada = {
      '31-60': [],
      '61-90': [],
      '91-120': [],
      '121-180': [],
      '181-240': [],
      '241-300': [],
      '301-360': [],
      '361+': [],
    };

    TASAS_INVERSION.forEach((tasa) => {
      let key;
      if (tasa.plazoMin >= 361) key = '361+';
      else if (tasa.plazoMin >= 301) key = '301-360';
      else if (tasa.plazoMin >= 241) key = '241-300';
      else if (tasa.plazoMin >= 181) key = '181-240';
      else if (tasa.plazoMin >= 121) key = '121-180';
      else if (tasa.plazoMin >= 91) key = '91-120';
      else if (tasa.plazoMin >= 61) key = '61-90';
      else key = '31-60';

      tablaAgrupada[key].push({
        montoMin: tasa.montoMin,
        montoMax: tasa.montoMax === Infinity ? null : tasa.montoMax,
        tasa: tasa.tasa,
      });
    });

    return {
      rangos: [
        { key: '31-60', label: 'De 31 a 60 días', tasas: tablaAgrupada['31-60'] },
        { key: '61-90', label: 'De 61 a 90 días', tasas: tablaAgrupada['61-90'] },
        { key: '91-120', label: 'De 91 a 120 días', tasas: tablaAgrupada['91-120'] },
        { key: '121-180', label: 'De 121 a 180 días', tasas: tablaAgrupada['121-180'] },
        { key: '181-240', label: 'De 181 a 240 días', tasas: tablaAgrupada['181-240'] },
        { key: '241-300', label: 'De 241 a 300 días', tasas: tablaAgrupada['241-300'] },
        { key: '301-360', label: 'De 301 a 360 días', tasas: tablaAgrupada['301-360'] },
        { key: '361+', label: 'De 361 días o más', tasas: tablaAgrupada['361+'] },
      ],
    };
  }

  /**
   * Obtiene la tasa específica para un monto y plazo
   */
  async obtenerTasaEspecifica(monto, plazoDias) {
    const tasaEncontrada = TASAS_INVERSION.find(
      (regla) =>
        plazoDias >= regla.plazoMin &&
        plazoDias <= regla.plazoMax &&
        monto >= regla.montoMin &&
        monto < regla.montoMax
    );

    if (!tasaEncontrada) {
      return { tasa: 2.50, mensaje: 'Tasa por defecto' };
    }

    return {
      tasa: tasaEncontrada.tasa,
      rangoMonto: {
        min: tasaEncontrada.montoMin,
        max: tasaEncontrada.montoMax === Infinity ? null : tasaEncontrada.montoMax,
      },
      rangoPlazo: {
        min: tasaEncontrada.plazoMin,
        max: tasaEncontrada.plazoMax,
      },
    };
  }
}

module.exports = new TasasService();
