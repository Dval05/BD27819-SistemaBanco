const { supabase } = require('../../../shared/config/database.config');

class PagoServiciosRepository {

  // =====================================
  // CATEGORÍAS
  // =====================================

  async getCategorias() {
    try {
      const { data, error } = await supabase
        .from('categoria_servicio')
        .select('id_cat, cat_nombre, cat_descripcion, cat_icono, cat_orden')
        .eq('cat_estado', '00')
        .order('cat_orden', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en getCategorias:', error);
      throw error;
    }
  }

  // =====================================
  // SUBCATEGORÍAS
  // =====================================

  async getSubcategoriasByCategoria(idCat) {
    try {
      const { data, error } = await supabase
        .from('subcategoria_servicio')
        .select('id_subcat, id_cat, subcat_nombre, subcat_descripcion, subcat_orden')
        .eq('id_cat', idCat)
        .eq('subcat_estado', '00')
        .order('subcat_orden', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en getSubcategoriasByCategoria:', error);
      throw error;
    }
  }

  // =====================================
  // SERVICIOS
  // =====================================

  async getServiciosByCategoria(idCat) {
    try {
      const { data, error } = await supabase
        .from('servicio')
        .select('id_srv, srv_nombre, srv_tiene_subtipos, srv_orden')
        .eq('id_cat', idCat)
        .is('id_subcat', null)
        .eq('srv_estado', '00')
        .order('srv_orden', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en getServiciosByCategoria:', error);
      throw error;
    }
  }

  async getServiciosBySubcategoria(idSubcat) {
    try {
      const { data, error } = await supabase
        .from('servicio')
        .select('id_srv, srv_nombre, srv_tiene_subtipos, srv_orden')
        .eq('id_subcat', idSubcat)
        .eq('srv_estado', '00')
        .order('srv_orden', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en getServiciosBySubcategoria:', error);
      throw error;
    }
  }

  async getServicioById(idSrv) {
    try {
      const { data, error } = await supabase
        .from('servicio')
        .select('id_srv, srv_nombre, srv_tiene_subtipos, srv_orden, srv_estado')
        .eq('id_srv', idSrv)
        .single();
      
      if (error && error.code === 'PGRST116') return null;
      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error('Error en getServicioById:', error);
      throw error;
    }
  }

  // =====================================
  // SUBTIPOS DE PAGO
  // =====================================

  async getSubtiposByServicio(idSrv) {
    try {
      const { data, error } = await supabase
        .from('subtipo_pago_servicio')
        .select('id_subtipo, subtipo_nombre, subtipo_descripcion, subtipo_orden')
        .eq('id_srv', idSrv)
        .eq('subtipo_estado', '00')
        .order('subtipo_orden', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en getSubtiposByServicio:', error);
      throw error;
    }
  }

  async getSubtipoById(idSubtipo) {
    try {
      const { data, error } = await supabase
        .from('subtipo_pago_servicio')
        .select('id_subtipo, id_srv, subtipo_nombre, subtipo_descripcion, subtipo_estado')
        .eq('id_subtipo', idSubtipo)
        .single();
      
      if (error && error.code === 'PGRST116') return null;
      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error('Error en getSubtipoById:', error);
      throw error;
    }
  }

  // =====================================
  // DATOS REQUERIDOS
  // =====================================

  async getDatosRequeridosByServicio(idSrv) {
    try {
      const { data, error } = await supabase
        .from('dato_requerido_pago')
        .select(`
          id_dato_req,
          datreq_orden,
          datreq_obligatorio,
          datreq_etiqueta,
          datreq_placeholder,
          datreq_ayuda,
          tipo_dato_entrada:id_tipodato (
            id_tipodato,
            tipodato_nombre,
            tipodato_longitud_min,
            tipodato_longitud_max,
            tipodato_tipo_validacion,
            tipodato_patron_regex,
            tipodato_mensaje_error
          )
        `)
        .eq('id_srv', idSrv)
        .order('datreq_orden', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(d => ({
        id_dato_req: d.id_dato_req,
        datreq_orden: d.datreq_orden,
        datreq_obligatorio: d.datreq_obligatorio,
        datreq_etiqueta: d.datreq_etiqueta,
        datreq_placeholder: d.datreq_placeholder,
        datreq_ayuda: d.datreq_ayuda,
        id_tipodato: d.tipo_dato_entrada?.id_tipodato,
        tipodato_nombre: d.tipo_dato_entrada?.tipodato_nombre,
        tipodato_longitud_min: d.tipo_dato_entrada?.tipodato_longitud_min,
        tipodato_longitud_max: d.tipo_dato_entrada?.tipodato_longitud_max,
        tipodato_tipo_validacion: d.tipo_dato_entrada?.tipodato_tipo_validacion,
        tipodato_patron_regex: d.tipo_dato_entrada?.tipodato_patron_regex,
        tipodato_mensaje_error: d.tipo_dato_entrada?.tipodato_mensaje_error
      }));
    } catch (error) {
      console.error('Error en getDatosRequeridosByServicio:', error);
      throw error;
    }
  }

  async getDatosRequeridosBySubtipo(idSubtipo) {
    try {
      const { data, error } = await supabase
        .from('dato_requerido_pago')
        .select(`
          id_dato_req,
          datreq_orden,
          datreq_obligatorio,
          datreq_etiqueta,
          datreq_placeholder,
          datreq_ayuda,
          tipo_dato_entrada:id_tipodato (
            id_tipodato,
            tipodato_nombre,
            tipodato_longitud_min,
            tipodato_longitud_max,
            tipodato_tipo_validacion,
            tipodato_patron_regex,
            tipodato_mensaje_error
          )
        `)
        .eq('id_subtipo', idSubtipo)
        .order('datreq_orden', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(d => ({
        id_dato_req: d.id_dato_req,
        datreq_orden: d.datreq_orden,
        datreq_obligatorio: d.datreq_obligatorio,
        datreq_etiqueta: d.datreq_etiqueta,
        datreq_placeholder: d.datreq_placeholder,
        datreq_ayuda: d.datreq_ayuda,
        id_tipodato: d.tipo_dato_entrada?.id_tipodato,
        tipodato_nombre: d.tipo_dato_entrada?.tipodato_nombre,
        tipodato_longitud_min: d.tipo_dato_entrada?.tipodato_longitud_min,
        tipodato_longitud_max: d.tipo_dato_entrada?.tipodato_longitud_max,
        tipodato_tipo_validacion: d.tipo_dato_entrada?.tipodato_tipo_validacion,
        tipodato_patron_regex: d.tipo_dato_entrada?.tipodato_patron_regex,
        tipodato_mensaje_error: d.tipo_dato_entrada?.tipodato_mensaje_error
      }));
    } catch (error) {
      console.error('Error en getDatosRequeridosBySubtipo:', error);
      throw error;
    }
  }

  // =====================================
  // CUENTAS
  // =====================================

  async getCuentaBySaldo(idCuenta) {
    try {
      const { data, error } = await supabase
        .from('cuenta')
        .select('id_cuenta, id_persona, cue_saldo_disponible, cue_estado')
        .eq('id_cuenta', idCuenta)
        .eq('cue_estado', '00')
        .single();
      
      if (error && error.code === 'PGRST116') return null;
      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error('Error en getCuentaBySaldo:', error);
      throw error;
    }
  }

  async isCuentaAhorro(idCuenta) {
    try {
      const { data, error } = await supabase
        .from('cuenta_ahorro')
        .select('id_cue_ahorro')
        .eq('id_cuenta', idCuenta)
        .single();
      
      if (error && error.code === 'PGRST116') return false;
      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error en isCuentaAhorro:', error);
      throw error;
    }
  }

  async getCuentasAhorroByPersona(idPersona) {
    try {
      const { data, error } = await supabase
        .from('cuenta_ahorro')
        .select(`
          id_cue_ahorro,
          id_cuenta,
          cue_numero,
          cue_saldo_disponible,
          cue_estado,
          cueaho_tasa_interes,
          cueaho_meta_ahorro,
          id_persona
        `)
        .eq('id_persona', idPersona)
        .eq('cue_estado', '00')
        .order('cue_numero', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en getCuentasAhorroByPersona:', error);
      throw error;
    }
  }

  // =====================================
  // TRANSACCIONES Y PAGOS
  // =====================================

  async createTransaccion(transaccion) {
    try {
      const { id_tra, id_cuenta, tra_monto, tra_tipo, tra_descripcion, tra_estado } = transaccion;
      
      const { data, error } = await supabase
        .from('transaccion')
        .insert({
          id_tra,
          id_cuenta,
          id_invmov: null,
          tra_fecha_hora: new Date().toISOString(),
          tra_monto,
          tra_tipo,
          tra_descripcion,
          tra_estado
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en createTransaccion:', error);
      throw error;
    }
  }

  async createPagoServicio(pagoServicio) {
    try {
      const {
        id_tra,
        id_pagser,
        id_cuenta,
        tra_monto,
        tra_descripcion,
        tra_estado,
        id_srv,
        pagser_estado,
        pagser_comprobante,
        pagser_referencia,
        id_subtipo
      } = pagoServicio;

      const { data, error } = await supabase
        .from('pago_servicios')
        .insert({
          id_tra,
          id_pagser,
          id_cuenta,
          id_invmov: null,
          tra_fecha_hora: new Date().toISOString(),
          tra_monto,
          tra_tipo: '03',
          tra_descripcion,
          tra_estado,
          id_srv,
          pagser_estado,
          pagser_comprobante,
          pagser_referencia,
          id_subtipo
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en createPagoServicio:', error);
      throw error;
    }
  }

  async updateSaldoCuenta(idCuenta, monto) {
    try {
      const { data: cuentaActual, error: errorGet } = await supabase
        .from('cuenta')
        .select('cue_saldo_disponible')
        .eq('id_cuenta', idCuenta)
        .single();
      
      if (errorGet) throw errorGet;
      
      const nuevoSaldo = (parseFloat(cuentaActual.cue_saldo_disponible) || 0) - parseFloat(monto);
      
      const { data, error } = await supabase
        .from('cuenta')
        .update({ cue_saldo_disponible: nuevoSaldo })
        .eq('id_cuenta', idCuenta)
        .select('cue_saldo_disponible')
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en updateSaldoCuenta:', error);
      throw error;
    }
  }

  // =====================================
  // HISTORIAL Y COMPROBANTES
  // =====================================

  async getHistorialPagosByPersona(idPersona, limit, offset) {
    try {
      const { data, error } = await supabase
        .from('pago_servicios')
        .select(`
          id_pagser,
          id_tra,
          tra_fecha_hora,
          tra_monto,
          tra_descripcion,
          pagser_comprobante,
          pagser_estado,
          servicio!inner (srv_nombre),
          subtipo_pago_servicio (subtipo_nombre),
          cuenta!inner (cue_numero, id_persona)
        `)
        .eq('cuenta.id_persona', idPersona)
        .order('tra_fecha_hora', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      return (data || []).map(d => ({
        id_pagser: d.id_pagser,
        id_tra: d.id_tra,
        tra_fecha_hora: d.tra_fecha_hora,
        tra_monto: d.tra_monto,
        tra_descripcion: d.tra_descripcion,
        pagser_comprobante: d.pagser_comprobante,
        pagser_estado: d.pagser_estado,
        srv_nombre: d.servicio?.srv_nombre,
        subtipo_nombre: d.subtipo_pago_servicio?.subtipo_nombre,
        cue_numero: d.cuenta?.cue_numero
      }));
    } catch (error) {
      console.error('Error en getHistorialPagosByPersona:', error);
      throw error;
    }
  }

  async getTotalHistorialPagosByPersona(idPersona) {
    try {
      const { count, error } = await supabase
        .from('pago_servicios')
        .select('id_pagser', { count: 'exact', head: true })
        .eq('cuenta.id_persona', idPersona);
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error en getTotalHistorialPagosByPersona:', error);
      throw error;
    }
  }

  async getComprobante(idPagser) {
    try {
      const { data, error } = await supabase
        .from('pago_servicios')
        .select(`
          *,
          servicio (srv_nombre),
          subtipo_pago_servicio (subtipo_nombre),
          cuenta!inner (cue_numero, id_persona, persona!inner (per_email))
        `)
        .eq('id_pagser', idPagser)
        .single();
      
      if (error && error.code === 'PGRST116') return null;
      if (error) throw error;
      
      if (!data) return null;
      
      return {
        ...data,
        srv_nombre: data.servicio?.srv_nombre,
        subtipo_nombre: data.subtipo_pago_servicio?.subtipo_nombre,
        cue_numero: data.cuenta?.cue_numero,
        per_email: data.cuenta?.persona?.per_email
      };
    } catch (error) {
      console.error('Error en getComprobante:', error);
      throw error;
    }
  }
}

module.exports = new PagoServiciosRepository();
