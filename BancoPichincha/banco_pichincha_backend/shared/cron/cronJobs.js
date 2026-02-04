const cron = require('node-cron');
const vencimientoService = require('../../modules/inversiones/services/vencimiento.service');

/**
 * Configuración de tareas programadas (Cron Jobs)
 */
class CronJobManager {
  /**
   * Inicializa todas las tareas programadas
   */
  static iniciar() {
    console.log('📅 Inicializando tareas programadas...');

    // MODO DEMO: Procesar cada minuto (para demostraciones)
    this.programarProcesamientoFrecuente();

    // MODO PRODUCCIÓN: Descomentar estas líneas y comentar la anterior
    // this.programarProcesamientoVencimientoDiario();
    // this.programarVerificacionProximas();

    console.log('✅ Tareas programadas iniciadas correctamente');
  }

  /**
   * Procesa inversiones vencidas todos los días a las 00:00
   * Cron: '0 0 * * *' = cada día a medianoche
   */
  static programarProcesamientoVencimientoDiario() {
    cron.schedule('0 0 * * *', async () => {
      console.log('\n⏰ [CRON] Ejecutando procesamiento automático de vencimientos...');
      console.log(`Fecha/Hora: ${new Date().toISOString()}`);
      
      try {
        const resultados = await vencimientoService.procesarInversionesVencidas();
        
        console.log('✅ [CRON] Procesamiento completado exitosamente');
        console.log(`   - Inversiones procesadas: ${resultados.procesadas.length}`);
        console.log(`   - Errores: ${resultados.errores.length}`);
        
        if (resultados.procesadas.length > 0) {
          console.log('   📊 Inversiones liquidadas:');
          resultados.procesadas.forEach(inv => {
            console.log(`      • ${inv.id_inv}: $${inv.monto} (vencimiento: ${inv.fecha_vencimiento})`);
          });
        }
        
        if (resultados.errores.length > 0) {
          console.error('   ⚠️ Errores encontrados:');
          resultados.errores.forEach(err => {
            console.error(`      • ${err.id_inv}: ${err.error}`);
          });
        }
      } catch (error) {
        console.error('❌ [CRON] Error en procesamiento automático:', error.message);
      }
    }, {
      timezone: 'America/Guayaquil' // Zona horaria de Ecuador
    });

    console.log('   ✓ Procesamiento de vencimientos: Todos los días a medianoche (00:00)');
  }

  /**
   * Verifica inversiones próximas a vencer cada lunes a las 09:00
   * Cron: '0 9 * * 1' = cada lunes a las 9 AM
   * (Opcional - solo para logs informativos)
   */
  static programarVerificacionProximas() {
    cron.schedule('0 9 * * 1', async () => {
      console.log('\n📋 [CRON] Verificando inversiones próximas a vencer...');
      
      try {
        const proximas = await vencimientoService.obtenerProximasVencer(7);
        
        if (proximas.length > 0) {
          console.log(`📌 Hay ${proximas.length} inversiones que vencen en los próximos 7 días:`);
          proximas.forEach(inv => {
            console.log(`   • ${inv.id_inv}: $${inv.monto} - Vence en ${inv.dias_restantes} días (${inv.fecha_vencimiento})`);
          });
        } else {
          console.log('✓ No hay inversiones próximas a vencer en los próximos 7 días');
        }
      } catch (error) {
        console.error('❌ [CRON] Error en verificación de próximas:', error.message);
      }
    }, {
      timezone: 'America/Guayaquil'
    });

    console.log('   ✓ Verificación de próximas: Cada lunes a las 09:00');
  }

  /**
   * Para desarrollo/pruebas: ejecuta cada minuto
   * ⚠️ Solo usar para testing, comentar en producción
   */
  static programarProcesamientoFrecuente() {
    cron.schedule('* * * * *', async () => {
      console.log('\n⚡ [TEST] Procesamiento de prueba cada minuto...');
      
      try {
        const resultados = await vencimientoService.procesarInversionesVencidas();
        console.log(`✓ Procesadas: ${resultados.procesadas.length}, Errores: ${resultados.errores.length}`);
      } catch (error) {
        console.error('❌ Error:', error.message);
      }
    });

    console.log('   ⚡ [MODO TEST] Procesamiento cada minuto - ¡Desactivar en producción!');
  }
}

module.exports = CronJobManager;
