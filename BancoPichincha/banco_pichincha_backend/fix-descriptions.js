/**
 * Script para limpiar descripciones de transacciones que contienen UUIDs
 * Elimina los UUIDs de las descripciones de inversiones
 */

const { supabase } = require('./shared/config/database.config');

async function limpiarDescripciones() {
  console.log(' Limpiando descripciones de transacciones...\n');

  try {
    // Obtener TODAS las transacciones primero para ver qué hay
    const { data: todasTransacciones, error: errorTodas } = await supabase
      .from('transaccion')
      .select('id_tra, tra_descripcion, tra_tipo')
      .limit(50);

    if (errorTodas) {
      console.error('Error al obtener transacciones:', errorTodas);
      return;
    }

    console.log(` Total de transacciones encontradas: ${todasTransacciones.length}\n`);
    console.log('Todas las descripciones:');
    todasTransacciones.forEach((t, i) => {
      console.log(`  ${i + 1}. "${t.tra_descripcion}"`);
    });
    console.log('\n');

    // Filtrar las que contienen inversión o UUIDs
    const transacciones = todasTransacciones.filter(t => 
      t.tra_descripcion && (
        t.tra_descripcion.includes('inversión') || 
        t.tra_descripcion.includes('inversion') ||
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(t.tra_descripcion)
      )
    );

    console.log(`Encontradas ${transacciones.length} transacciones con UUIDs\n`);

    let actualizadas = 0;

    for (const tx of transacciones) {
      let nuevaDescripcion = tx.tra_descripcion;

      // Limpiar diferentes tipos de descripciones
      if (tx.tra_descripcion.includes('Apertura inversión')) {
        nuevaDescripcion = 'Apertura de Plazo Fijo';
      } else if (tx.tra_descripcion.includes('Pago interés')) {
        nuevaDescripcion = 'Pago de intereses - Plazo Fijo';
      } else if (tx.tra_descripcion.includes('Devolución capital')) {
        nuevaDescripcion = 'Devolución de capital - Plazo Fijo';
      } else if (tx.tra_descripcion.includes('Cancelación')) {
        nuevaDescripcion = 'Cancelación anticipada - Plazo Fijo';
      } else {
        // Remover UUID genérico (patrón: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
        nuevaDescripcion = tx.tra_descripcion.replace(
          /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
          ''
        ).trim();
      }

      if (nuevaDescripcion !== tx.tra_descripcion) {
        const { error: updateError } = await supabase
          .from('transaccion')
          .update({ tra_descripcion: nuevaDescripcion })
          .eq('id_tra', tx.id_tra);

        if (updateError) {
          console.error(` Error al actualizar ${tx.id_tra}:`, updateError);
        } else {
          console.log(` Actualizada: "${tx.tra_descripcion}" → "${nuevaDescripcion}"`);
          actualizadas++;
        }
      }
    }

    console.log(`\n Proceso completado: ${actualizadas}/${transacciones.length} transacciones actualizadas`);

  } catch (error) {
    console.error(' Error general:', error);
  }
}

// Ejecutar el script
limpiarDescripciones()
  .then(() => {
    console.log('\n Script finalizado correctamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n Error fatal:', error);
    process.exit(1);
  });
