/**
 * Componente de Detalle de Pago de Servicio
 * Formulario dinámico con campos requeridos
 */

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle,
  AlertCircle,
  Loader,
  Info
} from 'lucide-react';
import type { Cliente } from '../../types';
import './PagoServicioDetalle.css';

interface PagoServicioDetalleProps {
  cliente: Cliente;
  servicioData: {
    servicioId: string;
    servicio: string;
    categoria: string;
    subcategoria?: string;
    tieneSubtipos?: boolean;
  };
  onVolver: () => void;
  onPagoExitoso: () => void;
}

interface DatoRequerido {
  id_dato_req: string;
  datreq_etiqueta: string;
  datreq_placeholder: string;
  datreq_obligatorio: string;
  tipodato_nombre: string;
  tipodato_longitud_min: number;
  tipodato_longitud_max: number;
  tipodato_patron_regex: string | null;
  tipodato_mensaje_error: string | null;
}

interface Subtipo {
  id_subtipo: string;
  subtipo_nombre: string;
}

interface Cuenta {
  id_cuenta: string;
  id_cue_ahorro: string;
  cue_numero: string;
  cue_saldo_disponible: number;
  cueaho_tasa_interes: number;
  cueaho_meta_ahorro: number;
}

function PagoServicioDetalle({ 
  cliente, 
  servicioData, 
  onVolver,
  onPagoExitoso 
}: PagoServicioDetalleProps) {
  const [etapaActual, setEtapaActual] = useState<'formulario' | 'confirmacion' | 'exito'>('formulario');
  
  // Estados de datos
  const [subtipos, setSubtipos] = useState<Subtipo[]>([]);
  const [datosRequeridos, setDatosRequeridos] = useState<DatoRequerido[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  
  // Formulario
  const [subtipoSeleccionado, setSubtipoSeleccionado] = useState<string>('');
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string>('');
  const [monto, setMonto] = useState<string>('');
  const [datosServicio, setDatosServicio] = useState<Record<string, string>>({});
  const [descripcion, setDescripcion] = useState<string>('');
  
  // Estados UI
  const [loading, setLoading] = useState(false);
  const [loadingSubtipos, setLoadingSubtipos] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [erroresValidacion, setErroresValidacion] = useState<Record<string, string>>({});
  // Deriva si realmente se usan subtipos (según datos existentes)
  const [usaSubtipos, setUsaSubtipos] = useState<boolean>(!!servicioData.tieneSubtipos);
  
  // Datos del pago exitoso
  const [resultadoPago, setResultadoPago] = useState<any>(null);

  // Utilidades para validación de campos con alternativas (PLACA / RAMV / CPN)
  const esCampoPlacaRamvCpn = (dato: DatoRequerido): boolean => {
    const etiqueta = (dato.datreq_etiqueta || '').toLowerCase();
    const placeholder = (dato.datreq_placeholder || '').toLowerCase();
    const texto = etiqueta + ' ' + placeholder;
    return texto.includes('placa') || texto.includes('ramv') || texto.includes('cpn');
  };

  const validaPlaca = (valor: string): boolean => {
    // Acepta formatos comunes: ABC1234 o ABC-1234
    return /^[A-Z]{3}-?[0-9]{4}$/.test(valor.toUpperCase());
  };

  const validaRamv = (valor: string, dato: DatoRequerido): boolean => {
    // Se asume RAMV numérico. Se respeta longitud min/max del tipo de dato.
    if (!/^\d+$/.test(valor)) return false;
    return valor.length >= (dato.tipodato_longitud_min || 1) &&
           valor.length <= (dato.tipodato_longitud_max || 50);
  };

  const validaCpn = (valor: string, dato: DatoRequerido): boolean => {
    // Se asume CPN numérico. Se respeta longitud min/max del tipo de dato.
    if (!/^\d+$/.test(valor)) return false;
    return valor.length >= (dato.tipodato_longitud_min || 1) &&
           valor.length <= (dato.tipodato_longitud_max || 50);
  };

  useEffect(() => {
    cargarCuentas();
    inicializarFormulario();
  }, []);

  const inicializarFormulario = async () => {
    if (servicioData.tieneSubtipos) {
      const haySubtipos = await cargarSubtipos();
      // Si el servicio indica que tiene subtipos pero no existen en BD,
      // se continúa como servicio sin subtipos.
      if (!haySubtipos) {
        setUsaSubtipos(false);
        await cargarDatosRequeridos(servicioData.servicioId, null);
      } else {
        setUsaSubtipos(true);
      }
    } else {
      setUsaSubtipos(false);
      await cargarDatosRequeridos(servicioData.servicioId, null);
    }
  };

  const cargarCuentas = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/cuentas/persona/${cliente.id_persona}`);
      const body = await res.json();
      if (body.ok) {
        const cuentasAhorro = body.data || [];
        setCuentas(cuentasAhorro);
        if (cuentasAhorro.length > 0) {
          setCuentaSeleccionada(cuentasAhorro[0].id_cuenta);
        }
      }
    } catch (err) {
      // Error silencioso
    }
  };

  const cargarSubtipos = async () => {
    setLoadingSubtipos(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/pago-servicios/servicios/${servicioData.servicioId}/subtipos`
      );
      const body = await res.json();
      if (body.ok) {
        const lista = body.data || [];
        setSubtipos(lista);
        return Array.isArray(lista) && lista.length > 0;
      }
    } catch (err) {
      // Error silencioso
    } finally {
      setLoadingSubtipos(false);
    }
    return false;
  };

  const cargarDatosRequeridos = async (idSrv: string, idSubtipo: string | null) => {
    setLoadingDatos(true);
    setError(null);
    try {
      let url = '';
      if (idSubtipo) {
        url = `http://localhost:3000/api/pago-servicios/subtipos/${idSubtipo}/datos-requeridos`;
      } else {
        url = `http://localhost:3000/api/pago-servicios/servicios/${idSrv}/datos-requeridos`;
      }
      
      const res = await fetch(url);
      const body = await res.json();
      if (body.ok) {
        setDatosRequeridos(body.data || []);
        // Inicializar objeto de datos
        const inicial: Record<string, string> = {};
        (body.data || []).forEach((dato: DatoRequerido) => {
          inicial[dato.id_dato_req] = '';
        });
        setDatosServicio(inicial);
      } else {
        setError(body.msg || 'Error al cargar datos requeridos');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoadingDatos(false);
    }
  };

  const handleSubtipoChange = async (idSubtipo: string) => {
    setSubtipoSeleccionado(idSubtipo);
    await cargarDatosRequeridos(servicioData.servicioId, idSubtipo);
  };

  const handleDatoChange = (idDato: string, valor: string) => {
    setDatosServicio(prev => ({ ...prev, [idDato]: valor }));
    // Limpiar error de este campo
    if (erroresValidacion[idDato]) {
      setErroresValidacion(prev => {
        const nuevo = { ...prev };
        delete nuevo[idDato];
        return nuevo;
      });
    }
  };

  const validarFormulario = (): boolean => {
    const errores: Record<string, string> = {};

    // Validar cuenta
    if (!cuentaSeleccionada) {
      setError('Debe seleccionar una cuenta');
      return false;
    }

    // Validar monto
    const montoNum = parseFloat(monto);
    if (!monto || isNaN(montoNum) || montoNum <= 0) {
      setError('Debe ingresar un monto válido mayor a 0');
      return false;
    }

    // Validar saldo suficiente
    const cuentaSelec = cuentas.find(c => c.id_cuenta === cuentaSeleccionada);
    if (cuentaSelec) {
      const saldo = cuentaSelec.cue_saldo_disponible;
      if (montoNum > saldo) {
        setError(`Saldo insuficiente. Saldo disponible: $${saldo.toFixed(2)}`);
        return false;
      }
    }

    // Validar subtipo si es necesario
    if (usaSubtipos && !subtipoSeleccionado) {
      setError('Debe seleccionar un tipo de servicio');
      return false;
    }

    // Validar datos requeridos
    datosRequeridos.forEach(dato => {
      const valor = datosServicio[dato.id_dato_req] || '';
      
      // Obligatoriedad
      if (dato.datreq_obligatorio === '00' && !valor.trim()) {
        errores[dato.id_dato_req] = 'Este campo es obligatorio';
        return;
      }

      if (valor.trim()) {
        // Longitud
        if (valor.length < dato.tipodato_longitud_min || valor.length > dato.tipodato_longitud_max) {
          errores[dato.id_dato_req] = 
            `Debe tener entre ${dato.tipodato_longitud_min} y ${dato.tipodato_longitud_max} caracteres`;
          return;
        }

        // Validación especial para PLACA / RAMV / CPN: aceptar cualquiera de los formatos
        if (esCampoPlacaRamvCpn(dato)) {
          const okPlaca = validaPlaca(valor);
          const okRamv = validaRamv(valor, dato);
          const okCpn = validaCpn(valor, dato);
          if (!(okPlaca || okRamv || okCpn)) {
            errores[dato.id_dato_req] = dato.tipodato_mensaje_error || 'Ingrese PLACA válida (ABC1234) o RAMV/CPN numérico';
            return;
          }
        } else {
          // Patrón regex genérico (si viene definido desde backend)
          if (dato.tipodato_patron_regex) {
            try {
              const regex = new RegExp(dato.tipodato_patron_regex);
              if (!regex.test(valor)) {
                errores[dato.id_dato_req] = dato.tipodato_mensaje_error || 'Formato inválido';
                return;
              }
            } catch (e) {
              // Error de regex
            }
          }
        }
      }
    });

    setErroresValidacion(errores);
    if (Object.keys(errores).length > 0) {
      setError('Por favor corrija los errores en el formulario');
      return false;
    }

    setError(null);
    return true;
  };

  const handleContinuar = () => {
    if (!validarFormulario()) {
      return;
    }
    setEtapaActual('confirmacion');
  };

  const handleConfirmarPago = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        id_persona: cliente.id_persona,
        id_cuenta: cuentaSeleccionada,
        id_srv: servicioData.servicioId,
        id_subtipo: subtipoSeleccionado || null,
        tra_monto: parseFloat(monto),
        datos_servicio: datosServicio,
        tra_descripcion: descripcion || `Pago de ${servicioData.servicio}`
      };

      const res = await fetch('http://localhost:3000/api/pago-servicios/procesar-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const body = await res.json();

      if (body.ok) {
        setResultadoPago(body.data);
        setEtapaActual('exito');
      } else {
        setError(body.msg || 'Error al procesar el pago');
        setEtapaActual('formulario');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      setEtapaActual('formulario');
    } finally {
      setLoading(false);
    }
  };

  const handleVolverFormulario = () => {
    setEtapaActual('formulario');
  };

  const renderTipoDatoInput = (dato: DatoRequerido) => {
    const valor = datosServicio[dato.id_dato_req] || '';
    const error = erroresValidacion[dato.id_dato_req];

    // Determinar tipo de input según el tipo de dato
    let inputType = 'text';
    if (dato.tipodato_nombre?.toLowerCase().includes('número') || 
        dato.tipodato_nombre?.toLowerCase().includes('cedula') ||
        dato.tipodato_nombre?.toLowerCase().includes('telefono')) {
      inputType = 'tel';
    } else if (dato.tipodato_nombre?.toLowerCase().includes('email')) {
      inputType = 'email';
    }

    return (
      <div key={dato.id_dato_req} className="form-group">
        <label>
          {dato.datreq_etiqueta}
          {dato.datreq_obligatorio === '00' && <span className="required">*</span>}
        </label>
        <input
          type={inputType}
          placeholder={dato.datreq_placeholder || dato.datreq_etiqueta}
          value={valor}
          onChange={(e) => handleDatoChange(dato.id_dato_req, e.target.value)}
          className={error ? 'input-error' : ''}
          maxLength={dato.tipodato_longitud_max}
        />
        {error && <span className="error-message">{error}</span>}
        <span className="input-hint">
          {dato.tipodato_longitud_min === dato.tipodato_longitud_max 
            ? `${dato.tipodato_longitud_max} caracteres`
            : `${dato.tipodato_longitud_min}-${dato.tipodato_longitud_max} caracteres`
          }
        </span>
      </div>
    );
  };

  if (etapaActual === 'exito') {
    return (
      <div className="pago-servicio-detalle">
        <div className="exito-container">
          <div className="exito-icono">
            <CheckCircle size={80} />
          </div>
          <h1>¡Pago Realizado Exitosamente!</h1>
          
          <div className="exito-detalles">
            <div className="detalle-row">
              <span className="label">Comprobante:</span>
              <span className="value">{resultadoPago?.comprobante}</span>
            </div>
            <div className="detalle-row">
              <span className="label">Servicio:</span>
              <span className="value">{resultadoPago?.servicio}</span>
            </div>
            <div className="detalle-row">
              <span className="label">Cliente:</span>
              <span className="value">{cliente.primerNombre} {cliente.primerApellido}</span>
            </div>
            <div className="detalle-row">
              <span className="label">Monto Pagado:</span>
              <span className="value monto">${resultadoPago?.monto_pagado?.toFixed(2)}</span>
            </div>
            <div className="detalle-row">
              <span className="label">Saldo Anterior:</span>
              <span className="value">${resultadoPago?.saldo_anterior?.toFixed(2)}</span>
            </div>
            <div className="detalle-row">
              <span className="label">Saldo Actual:</span>
              <span className="value">${resultadoPago?.saldo_actual?.toFixed(2)}</span>
            </div>
            <div className="detalle-row">
              <span className="label">Fecha:</span>
              <span className="value">
                {new Date(resultadoPago?.fecha_transaccion).toLocaleString('es-EC')}
              </span>
            </div>
          </div>

          <button className="btn-continuar" onClick={onPagoExitoso}>
            Continuar
          </button>
        </div>
      </div>
    );
  }

  if (etapaActual === 'confirmacion') {
    const cuentaSelec = cuentas.find(c => c.id_cuenta === cuentaSeleccionada);
    const subtipoSelec = subtipos.find(s => s.id_subtipo === subtipoSeleccionado);

    return (
      <div className="pago-servicio-detalle">
        <header className="detalle-header">
          <button className="btn-volver" onClick={handleVolverFormulario}>
            <ArrowLeft size={20} />
            Volver
          </button>
          <h1>Confirmar Pago</h1>
        </header>

        <div className="confirmacion-container">
          <div className="confirmacion-card">
            <h2>Resumen del Pago</h2>
            
            <div className="confirmacion-detalles">
              <div className="detalle-row">
                <span className="label">Servicio:</span>
                <span className="value">{servicioData.servicio}</span>
              </div>
              {subtipoSelec && (
                <div className="detalle-row">
                  <span className="label">Tipo:</span>
                  <span className="value">{subtipoSelec.subtipo_nombre}</span>
                </div>
              )}
              <div className="detalle-row">
                <span className="label">Cuenta:</span>
                <span className="value">{cuentaSelec?.cue_numero}</span>
              </div>
              <div className="detalle-row">
                <span className="label">Saldo Disponible:</span>
                <span className="value">${cuentaSelec?.cue_saldo_disponible.toFixed(2)}</span>
              </div>
              <div className="detalle-row destacado">
                <span className="label">Monto a Pagar:</span>
                <span className="value monto">${parseFloat(monto).toFixed(2)}</span>
              </div>
              
              {datosRequeridos.length > 0 && (
                <>
                  <h3>Datos del Servicio</h3>
                  {datosRequeridos.map(dato => (
                    <div key={dato.id_dato_req} className="detalle-row">
                      <span className="label">{dato.datreq_etiqueta}:</span>
                      <span className="value">{datosServicio[dato.id_dato_req]}</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="confirmacion-acciones">
              <button 
                className="btn-cancelar" 
                onClick={handleVolverFormulario}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar" 
                onClick={handleConfirmarPago}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader size={20} className="spinner" />
                    Procesando...
                  </>
                ) : (
                  'Confirmar Pago'
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pago-servicio-detalle">
      <header className="detalle-header">
        <button className="btn-volver" onClick={onVolver}>
          <ArrowLeft size={20} />
          Volver
        </button>
        <div>
          <h1>{servicioData.servicio}</h1>
          <p className="categoria-breadcrumb">
            {servicioData.categoria}
            {servicioData.subcategoria && ` > ${servicioData.subcategoria}`}
          </p>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="formulario-container">
        <div className="formulario-card">
          {/* Selección de Cuenta */}
          <div className="form-group">
            <label>
              Cuenta de Ahorro
              <span className="required">*</span>
            </label>
            <select 
              value={cuentaSeleccionada}
              onChange={(e) => setCuentaSeleccionada(e.target.value)}
            >
              <option value="">Seleccione una cuenta</option>
              {cuentas.map(cuenta => (
                <option key={cuenta.id_cuenta} value={cuenta.id_cuenta}>
                  {cuenta.cue_numero} - Saldo: ${cuenta.cue_saldo_disponible.toFixed(2)}
                </option>
              ))}
            </select>
            {cuentas.length === 0 && (
              <span className="info-message">
                <Info size={16} />
                No tienes cuentas de ahorro disponibles
              </span>
            )}
          </div>

          {/* Selección de Subtipo */}
          {usaSubtipos && (
            <div className="form-group">
              <label>
                Tipo de Servicio
                <span className="required">*</span>
              </label>
              {loadingSubtipos ? (
                <div className="loading-inline">Cargando opciones...</div>
              ) : (
                <select 
                  value={subtipoSeleccionado}
                  onChange={(e) => handleSubtipoChange(e.target.value)}
                >
                  <option value="">Seleccione un tipo</option>
                  {subtipos.map(subtipo => (
                    <option key={subtipo.id_subtipo} value={subtipo.id_subtipo}>
                      {subtipo.subtipo_nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Monto */}
          <div className="form-group">
            <label>
              Monto a Pagar
              <span className="required">*</span>
            </label>
            <div className="input-monto">
              <span className="prefijo">$</span>
              <input
                type="number"
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                step="0.01"
                min="0.01"
              />
            </div>
          </div>

          {/* Datos Requeridos Dinámicos */}
          {loadingDatos ? (
            <div className="loading-inline">Cargando campos requeridos...</div>
          ) : (
            datosRequeridos.map(dato => renderTipoDatoInput(dato))
          )}

          {/* Descripción Opcional */}
          <div className="form-group">
            <label>Descripción (Opcional)</label>
            <textarea
              placeholder="Agregue una descripción si lo desea"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              maxLength={200}
            />
          </div>

          <button 
            className="btn-pagar" 
            onClick={handleContinuar}
            disabled={loading || cuentas.length === 0}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

export default PagoServicioDetalle;