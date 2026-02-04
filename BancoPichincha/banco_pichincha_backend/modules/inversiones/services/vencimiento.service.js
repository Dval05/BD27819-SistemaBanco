const inversionRepository = require('../repositories/inversion.repository');
const cuentaRepository = require('../../cuentas/repositories/cuenta.repository');
const movimientoRepository = require('../repositories/movimiento.repository');
const transaccionRepository = require('../../transacciones/repositories/transaccion.repository');
const CalculadoraInversion = require('../utils/calculadora.util');
const { InversionEstado } = require('../models/inversion.model');
const { MovimientoTipo } = require('../models/movimiento.model');
const { v4: uuidv4 } = require('uuid');

/**
 * Servicio para procesar vencimientos de inversiones
 */
class VencimientoService {
  /**
   * Procesa todas las inversiones vencidas pendientes
   * Retorna capital + intereses a la cuenta
   */
  async procesarInversionesVencidas() {
    try {
      console.log('=== INICIANDO PROCESAMIENTO DE VENCIMIENTOS ===');
      const fechaActual = new Date().toISOString().split('T')[0];
      
      // Obtener todas las inversiones activas
      const inversionesActivas = await inversionRepository.findAll({ estado: InversionEstado.ACTIVA });
      
      const inversionesVencidas = inversionesActivas.filter(inv => {
        return inv.inv_fecha_vencimiento <= fechaActual;
      });

      console.log(`Inversiones activas encontradas: ${inversionesActivas.length}`);
      console.log(`Inversiones vencidas para procesar: ${inversionesVencidas.length}`);

      const resultados = {
        procesadas: [],
        errores: [],
        total: inversionesVencidas.length
      };

      for (const inversion of inversionesVencidas) {
        try {
          console.log(`\n--- Procesando inversión ${inversion.id_inv} ---`);
          await this._liquidarInversion(inversion);
          resultados.procesadas.push({
            id_inv: inversion.id_inv,
            monto: inversion.inv_monto,
            fecha_vencimiento: inversion.inv_fecha_vencimiento
          });
          console.log(`✓ Inversión ${inversion.id_inv} liquidada exitosamente`);
        } catch (error) {
          console.error(`✗ Error al liquidar inversión ${inversion.id_inv}:`, error.message);
          resultados.errores.push({
            id_inv: inversion.id_inv,
            error: error.message
          });
        }
      }

      console.log('\n=== RESUMEN DE PROCESAMIENTO ===');
      console.log(`Total procesadas: ${resultados.procesadas.length}`);
      console.log(`Total errores: ${resultados.errores.length}`);

      return resultados;
    } catch (error) {
      console.error('Error al procesar vencimientos:', error);
      throw error;
    }
  }

  /**
   * Procesa una inversión específica por ID (para pruebas manuales)
   */
  async procesarInversionPorId(idInversion) {
    try {
      console.log(`\n=== PROCESANDO INVERSIÓN ${idInversion} ===`);
      
      const inversion = await inversionRepository.findById(idInversion);
      
      if (!inversion) {
        throw { status: 404, message: 'Inversión no encontrada' };
      }

      if (inversion.inv_estado !== InversionEstado.ACTIVA) {
        throw { status: 400, message: `La inversión ya fue procesada. Estado actual: ${inversion.inv_estado}` };
      }

      const fechaActual = new Date().toISOString().split('T')[0];
      
      console.log(`Fecha actual: ${fechaActual}`);
      console.log(`Fecha vencimiento: ${inversion.inv_fecha_vencimiento}`);
      console.log(`Monto inversión: $${inversion.inv_monto}`);
      console.log(`Plazo: ${inversion.inv_plazo_dias} días`);
      console.log(`Tasa: ${inversion.inv_tasa_interes}%`);

      // Para demo, permitir procesar aunque no esté vencida (con advertencia)
      if (inversion.inv_fecha_vencimiento > fechaActual) {
        console.warn(`⚠ ADVERTENCIA: La inversión aún no está vencida. Procesando para demostración...`);
      }

      const resultado = await this._liquidarInversion(inversion);
      
      console.log('\n✓ Inversión liquidada exitosamente');
      console.log(`Capital devuelto: $${resultado.capital}`);
      console.log(`Intereses pagados: $${resultado.intereses}`);
      console.log(`Total acreditado: $${resultado.total}`);
      
      return resultado;
    } catch (error) {
      console.error('Error al procesar inversión:', error);
      throw error;
    }
  }

  /**
   * Liquidación de inversión: devuelve capital + intereses a la cuenta
   */
  async _liquidarInversion(inversion) {
    // Verificar que la inversión esté ACTIVA (evitar procesar dos veces)
    if (inversion.inv_estado !== InversionEstado.ACTIVA) {
      console.log(`  ⚠️ Inversión ya fue procesada. Estado actual: ${inversion.inv_estado}`);
      throw new Error(`La inversión ya fue procesada previamente`);
    }

    // IMPORTANTE: Actualizar estado INMEDIATAMENTE para evitar procesamiento duplicado
    await inversionRepository.updateEstado(inversion.id_inv, InversionEstado.VENCIDA);
    console.log(`  ✓ Estado actualizado a VENCIDA`);

    // 1. Calcular montos
    const capital = parseFloat(inversion.inv_monto);
    let tasa = parseFloat(inversion.inv_tasa_interes || 0);
    
    // Detectar formato: si tasa > 1, está en porcentaje (2.65%), si <= 1, está en decimal (0.0265)
    if (tasa > 1) {
      tasa = tasa / 100; // Convertir porcentaje a decimal
      console.log(`  📊 Tasa convertida: ${inversion.inv_tasa_interes}% → ${tasa} (decimal)`);
    }
    
    const dias = inversion.inv_plazo_dias;
    const intereses = (capital * tasa * dias) / 360;
    const totalDevolucion = capital + intereses;

    console.log(`  Capital: $${capital.toFixed(2)}`);
    console.log(`  Intereses: $${intereses.toFixed(2)}`);
    console.log(`  Total: $${totalDevolucion.toFixed(2)}`);

    // 2. Obtener cuenta
    const cuenta = await cuentaRepository.findById(inversion.id_cuenta);
    if (!cuenta) {
      throw { status: 404, message: 'Cuenta asociada no encontrada' };
    }

    const saldoAnterior = parseFloat(cuenta.cue_saldo_disponible) || 0;
    const nuevoSaldo = saldoAnterior + totalDevolucion;

    console.log(`  Saldo anterior: $${saldoAnterior.toFixed(2)}`);
    console.log(`  Nuevo saldo: $${nuevoSaldo.toFixed(2)}`);

    // 3. Actualizar saldo de la cuenta
    await cuentaRepository.updateSaldo(inversion.id_cuenta, nuevoSaldo);

    // 4. Registrar transacción
    const idTransaccion = uuidv4();
    await transaccionRepository.create({
      id_tra: idTransaccion,
      id_cuenta: inversion.id_cuenta,
      tra_tipo: '00', // Crédito
      tra_monto: totalDevolucion,
      tra_descripcion: 'Liquidación de Plazo Fijo',
      tra_estado: '00', // Exitosa
      tra_fecha_hora: new Date().toISOString()
    });

    // 5. Registrar movimiento de liquidación
    await movimientoRepository.create({
      id_invmov: uuidv4(),
      id_inv: inversion.id_inv,
      id_tra: idTransaccion,
      invmov_tipo: MovimientoTipo.CANCELACION // '02' = Fin de inversión/liquidación
    });

    return {
      id_inv: inversion.id_inv,
      capital,
      intereses,
      total: totalDevolucion,
      saldo_anterior: saldoAnterior,
      saldo_nuevo: nuevoSaldo,
      id_transaccion: idTransaccion,
      fecha_liquidacion: new Date().toISOString()
    };
  }

  /**
   * Obtiene un reporte de inversiones próximas a vencer
   */
  async obtenerProximasVencer(diasAnticipacion = 7) {
    const fechaActual = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaActual.getDate() + diasAnticipacion);

    const fechaActualStr = fechaActual.toISOString().split('T')[0];
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

    const inversionesActivas = await inversionRepository.findAll({ estado: InversionEstado.ACTIVA });

    const proximasVencer = inversionesActivas.filter(inv => {
      return inv.inv_fecha_vencimiento >= fechaActualStr && 
             inv.inv_fecha_vencimiento <= fechaLimiteStr;
    });

    return proximasVencer.map(inv => {
      const tasa = CalculadoraInversion.obtenerTasa(inv.inv_monto, inv.inv_plazo_dias);
      const intereses = (inv.inv_monto * (tasa / 100) * inv.inv_plazo_dias) / 360;
      
      return {
        id_inv: inv.id_inv,
        id_cuenta: inv.id_cuenta,
        monto: inv.inv_monto,
        intereses_estimados: intereses,
        total_devolucion: parseFloat(inv.inv_monto) + intereses,
        fecha_vencimiento: inv.inv_fecha_vencimiento,
        dias_restantes: Math.ceil((new Date(inv.inv_fecha_vencimiento) - fechaActual) / (1000 * 60 * 60 * 24))
      };
    });
  }
}

module.exports = new VencimientoService();
