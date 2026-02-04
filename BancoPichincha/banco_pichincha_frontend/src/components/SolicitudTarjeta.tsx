import { useState, useEffect } from 'react';
import { CreditCard, X, AlertCircle, DollarSign, TrendingUp, CheckCircle2 } from 'lucide-react';
import type { Cliente } from '../types';
import './SolicitudTarjeta.css';

interface SolicitudTarjetaProps {
  cliente: Cliente;
  onClose: () => void;
  onSuccess: () => void;
}

type TipoTarjeta = 'debito' | 'credito';
type MarcaTarjeta = 'VISA' | 'MASTERCARD' | 'DINERS' | 'AMEX' | 'DISCOVER' | 'JCB';

// Marcas que ofrecen tarjetas de débito y crédito
const MARCAS_POR_TIPO = {
  debito: ['VISA', 'MASTERCARD', 'DISCOVER', 'JCB'] as MarcaTarjeta[],
  credito: ['VISA', 'MASTERCARD', 'DINERS', 'AMEX', 'DISCOVER', 'JCB'] as MarcaTarjeta[]
};

// Requisitos mínimos de avalúo por marca de tarjeta
const REQUISITOS_MARCA = {
  VISA: { 
    avaluoMinimo: 500, 
    nombre: 'VISA',
    descripcion: 'Tarjeta básica ideal para comenzar',
    beneficios: [
      'Aceptada en más de 200 países',
      'Protección contra fraude 24/7',
      'Compras seguras en línea con Verified by Visa',
      'Acceso a promociones exclusivas',
      'Sin costo de mantenimiento el primer año'
    ],
    tasaInteres: '18.5% anual',
    cupoMaximo: '$5,000'
  },
  MASTERCARD: { 
    avaluoMinimo: 800, 
    nombre: 'MASTERCARD',
    descripcion: 'Aceptada internacionalmente',
    beneficios: [
      'Red global de aceptación',
      'Mastercard SecureCode para compras en línea',
      'Acceso a Priceless Cities',
      'Seguros de viaje incluidos',
      'Asistencia médica internacional 24/7'
    ],
    tasaInteres: '17.9% anual',
    cupoMaximo: '$7,000'
  },
  DINERS: { 
    avaluoMinimo: 1500, 
    nombre: 'DINERS CLUB',
    descripcion: 'Tarjeta premium con beneficios exclusivos',
    beneficios: [
      'Acceso a más de 1,000 salas VIP en aeropuertos',
      'Concierge 24/7 para reservas y asistencia',
      'Seguro de viaje internacional completo',
      'Programa de puntos con alta acumulación',
      'Descuentos en restaurantes premium',
      'Priority Pass incluido'
    ],
    tasaInteres: '16.5% anual',
    cupoMaximo: '$15,000'
  },
  AMEX: { 
    avaluoMinimo: 3000, 
    nombre: 'AMERICAN EXPRESS',
    descripcion: 'Tarjeta de alto prestigio y beneficios elite',
    beneficios: [
      'Membership Rewards - acumula puntos ilimitados',
      'Acceso a American Express Lounges',
      'Garantía extendida en todas tus compras',
      'Protección de precio por 120 días',
      'Seguro de renta de autos',
      'Servicio de concierge personal',
      'Acceso prioritario a eventos exclusivos'
    ],
    tasaInteres: '15.9% anual',
    cupoMaximo: '$25,000'
  },
  DISCOVER: { 
    avaluoMinimo: 1000, 
    nombre: 'DISCOVER',
    descripcion: 'Gran cobertura con cashback',
    beneficios: [
      'Cashback del 1% en todas las compras',
      'Hasta 5% cashback en categorías rotativas',
      'Sin comisión por transacciones internacionales',
      'Congelamiento gratuito de puntaje crediticio',
      'Servicio al cliente 24/7 desde EE.UU.',
      'Protección contra robo de identidad'
    ],
    tasaInteres: '17.5% anual',
    cupoMaximo: '$10,000'
  },
  JCB: { 
    avaluoMinimo: 1200, 
    nombre: 'JCB',
    descripcion: 'Tarjeta japonesa con beneficios en Asia',
    beneficios: [
      'Aceptación preferencial en Japón y Asia',
      'Descuentos exclusivos en tiendas asiáticas',
      'Acceso a JCB Plaza Lounges en ciudades clave',
      'Servicio multilingüe 24/7',
      'Seguro de viaje para Asia-Pacífico',
      'Programa de puntos OkiDoki'
    ],
    tasaInteres: '18.0% anual',
    cupoMaximo: '$12,000'
  }
};

const SolicitudTarjeta = ({ cliente, onClose, onSuccess }: SolicitudTarjetaProps) => {
  const [paso, setPaso] = useState<1 | 2 | 3>(1); // 1: tipo, 2: datos, 3: confirmación
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Datos del formulario
  const [tipoTarjeta, setTipoTarjeta] = useState<TipoTarjeta>('debito');
  const [marcaTarjeta, setMarcaTarjeta] = useState<MarcaTarjeta>('VISA');
  const [ingresosMensuales, setIngresosMensuales] = useState('');
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('');
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [avaluoTotal, setAvaluoTotal] = useState(0);
  const [marcasDisponibles, setMarcasDisponibles] = useState<MarcaTarjeta[]>([]);
  const [marcaRecomendada, setMarcaRecomendada] = useState<MarcaTarjeta | null>(null);
  const [mostrarDetallesMarca, setMostrarDetallesMarca] = useState(false);
  
  // Resultado
  const [cupoAprobado, setCupoAprobado] = useState(0);
  const [tarjetaGenerada, setTarjetaGenerada] = useState<any>(null);

  // Calcular avalúo total de todas las cuentas
  const calcularAvaluoTotal = (cuentasData: any[]) => {
    // IMPORTANTE: Convertir saldo a número para evitar concatenación de strings
    const total = cuentasData.reduce((sum, cuenta) => {
      const saldo = parseFloat(cuenta.saldo) || 0;
      return sum + saldo;
    }, 0);
    
    setAvaluoTotal(total);
    
    // Filtrar marcas según el tipo de tarjeta
    const marcasPermitidas = MARCAS_POR_TIPO[tipoTarjeta];
    
    // Determinar marcas disponibles según avalúo y tipo
    const disponibles: MarcaTarjeta[] = [];
    let recomendada: MarcaTarjeta | null = null;
    
    // Ordenar marcas por avalúo de MAYOR a MENOR para recomendar la mejor
    const marcasOrdenadas = Object.entries(REQUISITOS_MARCA).sort(
      ([, a], [, b]) => b.avaluoMinimo - a.avaluoMinimo
    );
    
    marcasOrdenadas.forEach(([marca, requisito]) => {
      const estaPermitida = marcasPermitidas.includes(marca as MarcaTarjeta);
      const cumpleAvaluo = total >= requisito.avaluoMinimo;
      const califica = estaPermitida && cumpleAvaluo;
      
      // Solo considerar marcas que estén permitidas para este tipo de tarjeta
      if (califica) {
        disponibles.push(marca as MarcaTarjeta);
        // Recomendar la primera que cumpla (ya están ordenadas de mayor a menor avalúo)
        if (!recomendada) {
          recomendada = marca as MarcaTarjeta;
        }
      }
    });
    
    // Si no califica para ninguna, recomendar la más básica del tipo
    if (disponibles.length === 0) {
      const primeraDelTipo = marcasPermitidas[0];
      disponibles.push(primeraDelTipo);
      recomendada = primeraDelTipo;
    }
    
    setMarcasDisponibles(disponibles);
    setMarcaRecomendada(recomendada);
    setMarcaTarjeta(recomendada || marcasPermitidas[0]);
  };

  // Cargar cuentas del cliente
  useEffect(() => {
    const cargarCuentas = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/auth/productos/${cliente.id}`);
        const data = await response.json();
        if (data.ok && data.data.cuentas) {
          setCuentas(data.data.cuentas);
          calcularAvaluoTotal(data.data.cuentas);
          if (data.data.cuentas.length > 0) {
            setCuentaSeleccionada(data.data.cuentas[0].id);
          }
        }
      } catch (err) {
        console.error('Error al cargar cuentas:', err);
      }
    };
    cargarCuentas();
  }, [cliente.id]);

  // Recalcular marcas disponibles cuando cambie el tipo de tarjeta
  useEffect(() => {
    if (cuentas.length > 0) {
      calcularAvaluoTotal(cuentas);
    }
  }, [tipoTarjeta]);

  // Calcular cupo basado en ingresos (política bancaria real)
  const calcularCupo = (ingresos: number): number => {
    // Los bancos generalmente aprueban entre 1x a 3x el ingreso mensual
    // Política Banco Pichincha:
    // - Hasta $1000: 2x ingresos
    // - $1001-$2000: 2.5x ingresos  
    // - Más de $2000: 3x ingresos
    // Tope máximo: $10,000
    
    let factor = 2;
    if (ingresos > 2000) factor = 3;
    else if (ingresos > 1000) factor = 2.5;
    
    const cupoCalculado = Math.min(ingresos * factor, 10000);
    return Math.round(cupoCalculado / 100) * 100; // Redondear a centenas
  };

  const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleContinuarPaso1 = () => {
    if (tipoTarjeta === 'debito') {
      // Para débito, ir directo a paso 3
      setPaso(3);
    } else {
      // Para crédito, ir a paso 2 (ingresos)
      setPaso(2);
    }
  };

  const handleContinuarPaso2 = () => {
    const ingresos = parseFloat(ingresosMensuales);
    if (isNaN(ingresos) || ingresos < 400) {
      setError('El ingreso mínimo requerido es $400');
      return;
    }
    const cupo = calcularCupo(ingresos);
    setCupoAprobado(cupo);
    setPaso(3);
  };

  const handleSolicitar = async () => {
    if (!cuentaSeleccionada) {
      setError('Debe seleccionar una cuenta');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = tipoTarjeta === 'debito' 
        ? 'http://localhost:3000/api/cajero/tarjeta/generar-debito'
        : 'http://localhost:3000/api/cajero/tarjeta/generar-credito';

      const body: any = {
        id_cuenta: cuentaSeleccionada,
        id_persona: cliente.id,
        marca: marcaTarjeta,
      };

      if (tipoTarjeta === 'credito') {
        body.cupo = cupoAprobado;
        body.ingresos = parseFloat(ingresosMensuales);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setTarjetaGenerada(data.data);
        setTimeout(() => {
          onSuccess();
        }, 3000);
      } else {
        setError(data.message || 'Error al generar tarjeta');
      }
    } catch (err: any) {
      setError('Error de conexión: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content solicitud-tarjeta" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {tarjetaGenerada ? (
          // Paso Final: Tarjeta generada exitosamente
          <div className="success-screen">
            <div className="success-icon">
              <CheckCircle2 size={64} />
            </div>
            <h2>¡Solicitud Aprobada!</h2>
            <p className="success-message">
              Tu tarjeta {tipoTarjeta === 'debito' ? 'de débito' : 'de crédito'} ha sido generada exitosamente
            </p>
            
            <div className="tarjeta-preview">
              <div className={`mini-tarjeta ${tipoTarjeta}`}>
                <div className="mini-marca">{marcaTarjeta}</div>
                <div className="mini-numero">{tarjetaGenerada.numeroOculto || '****'}</div>
                <div className="mini-tipo">{tipoTarjeta === 'debito' ? 'DÉBITO' : 'CRÉDITO'}</div>
              </div>
            </div>

            {tipoTarjeta === 'credito' && (
              <div className="info-aprobacion">
                <p><strong>Cupo aprobado:</strong> {formatMoney(cupoAprobado)}</p>
                <p className="info-small">Tu tarjeta estará disponible en 3-5 días hábiles</p>
              </div>
            )}

            {tipoTarjeta === 'debito' && tarjetaGenerada.pinPorDefecto && (
              <div className="pin-info">
                <AlertCircle size={20} />
                <div>
                  <p><strong>PIN temporal:</strong> {tarjetaGenerada.pinPorDefecto}</p>
                  <p className="info-small">Cámbialo en tu primer uso en el cajero</p>
                </div>
              </div>
            )}
          </div>
        ) : paso === 1 ? (
          // Paso 1: Selección de tipo y marca
          <>
            <div className="modal-header">
              <CreditCard size={32} className="modal-icon" />
              <h2>Nueva Tarjeta</h2>
              <p>Selecciona el tipo que mejor se adapte a tus necesidades</p>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <label className="form-label">Tipo de Tarjeta</label>
                <div className="tipo-opciones">
                  <div 
                    className={`tipo-card ${tipoTarjeta === 'debito' ? 'selected' : ''}`}
                    onClick={() => setTipoTarjeta('debito')}
                  >
                    <CreditCard size={24} />
                    <h3>Débito</h3>
                    <p>Vinculada a tu cuenta</p>
                    <ul>
                      <li>Sin cupo de crédito</li>
                      <li>Retiros en cajero</li>
                      <li>Compras con saldo disponible</li>
                    </ul>
                  </div>
                  <div 
                    className={`tipo-card ${tipoTarjeta === 'credito' ? 'selected' : ''}`}
                    onClick={() => setTipoTarjeta('credito')}
                  >
                    <TrendingUp size={24} />
                    <h3>Crédito</h3>
                    <p>Con línea de crédito</p>
                    <ul>
                      <li>Cupo según ingresos</li>
                      <li>Compras a crédito</li>
                      <li>Pago diferido</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">
                  Marca de la Tarjeta
                  <span className="avaluo-info">
                    Tu avalúo total: {formatMoney(avaluoTotal)}
                  </span>
                </label>
                
                {marcaRecomendada && (
                  <div className="marca-recomendacion">
                    <CheckCircle2 size={16} />
                    <span>Recomendada para {tipoTarjeta === 'debito' ? 'DÉBITO' : 'CRÉDITO'}: <strong>{REQUISITOS_MARCA[marcaRecomendada].nombre}</strong> - {REQUISITOS_MARCA[marcaRecomendada].descripcion}</span>
                  </div>
                )}

                <div className="marca-opciones">
                  {(Object.keys(REQUISITOS_MARCA) as MarcaTarjeta[]).map((marca) => {
                    const disponiblePorTipo = MARCAS_POR_TIPO[tipoTarjeta].includes(marca);
                    const disponiblePorAvaluo = marcasDisponibles.includes(marca);
                    const disponible = disponiblePorTipo && disponiblePorAvaluo;
                    const requisito = REQUISITOS_MARCA[marca];
                    
                    return (
                      <div 
                        key={marca}
                        className={`marca-option ${marcaTarjeta === marca ? 'selected' : ''} ${!disponible ? 'disabled' : ''}`}
                        onClick={() => {
                          if (disponible) {
                            setMarcaTarjeta(marca);
                            setError('');
                            setMostrarDetallesMarca(true);
                          } else if (!disponiblePorTipo) {
                            setError(`${requisito.nombre} no ofrece tarjetas de ${tipoTarjeta === 'debito' ? 'débito' : 'crédito'}. Solo está disponible para tarjetas de ${tipoTarjeta === 'debito' ? 'crédito' : 'débito'}.`);
                            setMostrarDetallesMarca(false);
                          } else {
                            setError(`No calificas para ${requisito.nombre}. Requiere avalúo mínimo de ${formatMoney(requisito.avaluoMinimo)}. Te recomendamos ${REQUISITOS_MARCA[marcaRecomendada || 'VISA'].nombre}.`);
                            setMostrarDetallesMarca(false);
                          }
                        }}
                      >
                        <span className={`marca-logo ${marca.toLowerCase()}`}>{marca}</span>
                        {!disponiblePorTipo ? (
                          <span className="marca-requisito">Solo {tipoTarjeta === 'debito' ? 'crédito' : 'débito'}</span>
                        ) : !disponiblePorAvaluo && (
                          <span className="marca-requisito">Min: {formatMoney(requisito.avaluoMinimo)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {mostrarDetallesMarca && marcaTarjeta && (
                <div className="marca-detalles">
                  <h4>{REQUISITOS_MARCA[marcaTarjeta].nombre}</h4>
                  <p className="marca-descripcion">{REQUISITOS_MARCA[marcaTarjeta].descripcion}</p>
                  
                  <div className="marca-info-grid">
                    <div className="info-item">
                      <span className="info-label">Avalúo mínimo requerido:</span>
                      <span className="info-value">{formatMoney(REQUISITOS_MARCA[marcaTarjeta].avaluoMinimo)}</span>
                    </div>
                    {tipoTarjeta === 'credito' && (
                      <>
                        <div className="info-item">
                          <span className="info-label">Tasa de interés:</span>
                          <span className="info-value">{REQUISITOS_MARCA[marcaTarjeta].tasaInteres}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Cupo máximo:</span>
                          <span className="info-value">{REQUISITOS_MARCA[marcaTarjeta].cupoMaximo}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="marca-beneficios">
                    <h5>Beneficios Incluidos:</h5>
                    <ul>
                      {REQUISITOS_MARCA[marcaTarjeta].beneficios.map((beneficio, index) => (
                        <li key={index}>
                          <CheckCircle2 size={16} />
                          <span>{beneficio}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {error && <div className="error-message">{error}</div>}

              <button 
                className="btn-solicitar"
                onClick={handleContinuarPaso1}
              >
                Continuar
              </button>
            </div>
          </>
        ) : paso === 2 ? (
          // Paso 2: Ingresos (solo para crédito)
          <>
            <div className="modal-header">
              <DollarSign size={32} className="modal-icon" />
              <h2>Información de Ingresos</h2>
              <p>Para calcular tu cupo de crédito</p>
            </div>

            <div className="modal-body">
              <div className="info-box">
                <AlertCircle size={20} />
                <p>El cupo se calcula basado en tus ingresos mensuales comprobables</p>
              </div>

              <div className="form-section">
                <label className="form-label">Ingresos Mensuales</label>
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    value={ingresosMensuales}
                    onChange={(e) => setIngresosMensuales(e.target.value)}
                    min="400"
                    step="0.01"
                  />
                </div>
                <p className="input-help">Ingreso mínimo requerido: $400</p>
              </div>

              <div className="politica-cupo">
                <h4>Política de Cupo</h4>
                <ul>
                  <li>Hasta $1,000: 2x tus ingresos</li>
                  <li>$1,001 - $2,000: 2.5x tus ingresos</li>
                  <li>Más de $2,000: 3x tus ingresos</li>
                  <li>Cupo máximo: $10,000</li>
                </ul>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="form-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setPaso(1)}
                >
                  Atrás
                </button>
                <button 
                  className="btn-solicitar"
                  onClick={handleContinuarPaso2}
                  disabled={!ingresosMensuales}
                >
                  Calcular Cupo
                </button>
              </div>
            </div>
          </>
        ) : (
          // Paso 3: Confirmación
          <>
            <div className="modal-header">
              <CheckCircle2 size={32} className="modal-icon" />
              <h2>Confirmar Solicitud</h2>
              <p>Revisa los detalles de tu tarjeta</p>
            </div>

            <div className="modal-body">
              <div className="resumen-solicitud">
                <div className="resumen-item">
                  <span className="resumen-label">Tipo</span>
                  <span className="resumen-value">{tipoTarjeta === 'debito' ? 'Débito' : 'Crédito'}</span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Marca</span>
                  <span className="resumen-value">{marcaTarjeta}</span>
                </div>
                {tipoTarjeta === 'credito' && (
                  <>
                    <div className="resumen-item destacado">
                      <span className="resumen-label">Cupo Aprobado</span>
                      <span className="resumen-value cupo">{formatMoney(cupoAprobado)}</span>
                    </div>
                    <div className="resumen-item">
                      <span className="resumen-label">Ingresos Declarados</span>
                      <span className="resumen-value">{formatMoney(parseFloat(ingresosMensuales))}</span>
                    </div>
                  </>
                )}
                <div className="resumen-item">
                  <span className="resumen-label">Cuenta Vinculada</span>
                  <select 
                    className="form-select"
                    value={cuentaSeleccionada}
                    onChange={(e) => setCuentaSeleccionada(e.target.value)}
                  >
                    {cuentas.map(cuenta => (
                      <option key={cuenta.id} value={cuenta.id}>
                        {cuenta.nombre} - {cuenta.numero}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="form-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setPaso(tipoTarjeta === 'credito' ? 2 : 1)}
                  disabled={loading}
                >
                  Atrás
                </button>
                <button 
                  className="btn-solicitar"
                  onClick={handleSolicitar}
                  disabled={loading || !cuentaSeleccionada}
                >
                  {loading ? 'Procesando...' : 'Confirmar Solicitud'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SolicitudTarjeta;
