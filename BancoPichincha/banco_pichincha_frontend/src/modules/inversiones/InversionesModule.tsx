import React, { useState } from 'react';
import { SimuladorInversion } from './components/SimuladorInversion';
import SeleccionCuenta from './components/SeleccionCuenta/SeleccionCuenta';
import ConfirmacionInversion from './components/ConfirmacionInversion/ConfirmacionInversion';
import TablaIntereses from './components/TablaIntereses/TablaIntereses';
import ListadoInversiones from './components/ListadoInversiones/ListadoInversiones';
import DetalleInversion from './components/DetalleInversion/DetalleInversion';
import { useSimulador } from './hooks/useSimulador';
import type { Cuenta, Inversion } from './types/inversion.types';
import styles from './InversionesModule.module.css';

enum Vista {
  INICIO = 'INICIO',
  SIMULADOR = 'SIMULADOR',
  SELECCION_CUENTA = 'SELECCION_CUENTA',
  CONFIRMACION = 'CONFIRMACION',
  LISTADO = 'LISTADO',
  DETALLE = 'DETALLE',
}

interface Props {
  idPersona?: string;
  cliente?: any;
}

const InversionesModule: React.FC<Props> = ({ idPersona, cliente }) => {
  // Obtener idPersona desde props o desde el objeto cliente pasado por Dashboard
  const personaId = idPersona || cliente?.id_persona || '';
  
  // Debug
  console.log('InversionesModule - Props:', { idPersona, cliente });
  console.log('InversionesModule - personaId calculado:', personaId);
  
  const [vista, setVista] = useState<Vista>(Vista.INICIO);
  const [monto, setMonto] = useState(0);
  const [plazoDias, setPlazoDias] = useState(0);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<Cuenta | null>(null);
  const [inversionSeleccionada, setInversionSeleccionada] = useState<Inversion | null>(null);
  const [mostrarModalInfo, setMostrarModalInfo] = useState(false);

  const simulador = useSimulador();

  const handleIniciarSimulacion = () => {
    setVista(Vista.SIMULADOR);
  };

  const handleSimulacionCompleta = (montoSimulado: number, plazoSimulado: number) => {
    setMonto(montoSimulado);
    setPlazoDias(plazoSimulado);
    setVista(Vista.SELECCION_CUENTA);
  };

  const handleCuentaSeleccionada = (cuenta: Cuenta) => {
    setCuentaSeleccionada(cuenta);
    setVista(Vista.CONFIRMACION);
  };

  const handleExito = () => {
    // Limpiar datos
    setMonto(0);
    setPlazoDias(0);
    setCuentaSeleccionada(null);
    // Ir a listado
    setVista(Vista.LISTADO);
  };

  const handleVerListado = () => {
    setVista(Vista.LISTADO);
  };

  const handleVerDetalle = (inversion: Inversion) => {
    setInversionSeleccionada(inversion);
    setVista(Vista.DETALLE);
  };

  const handleVolverInicio = () => {
    setVista(Vista.INICIO);
    setMonto(0);
    setPlazoDias(0);
    setCuentaSeleccionada(null);
  };

  return (
    <div className={styles.module}>
      {vista === Vista.INICIO && (
        <div className={styles.inicio}>
          <div className={styles.header}>
            <h1 className={styles.titulo}>Depósito a plazo</h1>
          </div>

          <div className={styles.contenido}>
            <div className={styles.iconoGrande}>📊</div>
            
            <h2 className={styles.subtitulo}>
              Rentabiliza tus ahorros con un depósito a plazo y una tasa exclusiva
            </h2>

            <div className={styles.beneficios}>
              <div className={styles.beneficio}>
                <span className={styles.check}>✓</span>
                <p>
                  Tu depósito a plazo en línea te da una mejor tasa que en agencia,{' '}
                  <strong>obtén hasta 5.70%</strong>
                </p>
              </div>

              <div className={styles.beneficio}>
                <span className={styles.check}>✓</span>
                <p>
                  Personaliza tu depósito a plazo. Elige el plazo y monto que más te convenga{' '}
                  <strong>desde $ 500</strong>.
                </p>
              </div>

              <div className={styles.beneficio}>
                <span className={styles.check}>✓</span>
                <p>
                  Obtén una <strong>ganancia fija con el respaldo y solidez</strong> de Banco Pichincha.
                </p>
              </div>
            </div>

            <div className={styles.linkInfo}>
              <button 
                className={styles.infoLink}
                onClick={() => setMostrarModalInfo(true)}
              >
                ¿Cómo funciona el depósito a plazo fijo?
              </button>
            </div>

            <div className={styles.botonera}>
              <button className={styles.btnContinuar} onClick={handleIniciarSimulacion}>
                Continuar
              </button>
              <button className={styles.btnVerInversiones} onClick={handleVerListado}>
                Ver mis inversiones
              </button>
            </div>
          </div>

          {mostrarModalInfo && (
            <div className={styles.modalOverlay} onClick={() => setMostrarModalInfo(false)}>
              <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <h3 className={styles.modalTitulo}>¿Cómo funciona el depósito a plazo fijo?</h3>
                </div>
                <div className={styles.modalBody}>
                  <p className={styles.modalParrafo}>
                    Es un producto financiero que te permite <strong>hacer crecer tu dinero con una tasa
                    atractiva*</strong>. Solo deberás realizar un único depósito de dinero y guardarlo durante
                    el tiempo que tú determines. Al final del plazo recibirás el dinero que depositaste y tus
                    ganancias.
                  </p>
                  <p className={styles.modalParrafo}>
                    <strong>¡A más tiempo guardes el dinero, más ganarás!</strong>
                  </p>
                  <p className={styles.modalNota}>
                    *La tasa de interés varía según el monto y plazo elegido.
                  </p>

                  <div className={styles.ejemplo}>
                    <h4 className={styles.ejemploTitulo}>Ejemplo</h4>
                    <div className={styles.ejemploCard}>
                      <div className={styles.ejemploIcono}>👤</div>
                      <div className={styles.ejemploContent}>
                        <p className={styles.ejemploTexto}>
                          <strong>Juan quiere hacer crecer su dinero</strong>
                        </p>
                        <p className={styles.ejemploDetalle}>
                          y abre un depósito a plazo de <strong>$10,000</strong> por <strong>1 año</strong>. Si no
                          retira su dinero en ese plazo, considerando deducciones, habrá ganado{' '}
                          <strong>$864,79</strong> con una tasa (referencial) de <strong>8,80%</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button 
                    className={styles.btnEntendido}
                    onClick={() => setMostrarModalInfo(false)}
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {vista === Vista.SIMULADOR && (
        <SimuladorInversion
          onSimulacionCompleta={handleSimulacionCompleta}
          onCancelar={handleVolverInicio}
          resultado={simulador.resultado}
          recomendaciones={simulador.recomendaciones}
          loading={simulador.loading}
          error={simulador.error}
          simular={simulador.simular}
          cargarRecomendaciones={simulador.cargarRecomendaciones}
        />
      )}

      {vista === Vista.SELECCION_CUENTA && (
        <SeleccionCuenta
          idPersona={personaId}
          montoRequerido={monto}
          onCuentaSeleccionada={handleCuentaSeleccionada}
          onVolver={() => setVista(Vista.SIMULADOR)}
          onCancelar={handleVolverInicio}
        />
      )}

      {vista === Vista.CONFIRMACION && cuentaSeleccionada && simulador.resultado && (
        <ConfirmacionInversion
          monto={monto}
          plazoDias={plazoDias}
          tasa={simulador.resultado.simulacion.tasa}
          interes={simulador.resultado.simulacion.interes}
          montoFinal={simulador.resultado.simulacion.montoFinal}
          cuenta={cuentaSeleccionada}
          onExito={handleExito}
          onVolver={() => setVista(Vista.SELECCION_CUENTA)}
          onCancelar={handleVolverInicio}
        />
      )}

      {vista === Vista.LISTADO && (
        <>
          <div className={styles.listadoHeader}>
            <button className={styles.btnVolver} onClick={handleVolverInicio}>
              ← Volver al inicio
            </button>
            <button className={styles.btnNueva} onClick={handleIniciarSimulacion}>
              + Nueva inversión
            </button>
          </div>
          <ListadoInversiones idPersona={personaId} onVerDetalle={handleVerDetalle} />
        </>
      )}

      {vista === Vista.DETALLE && inversionSeleccionada && (
        <DetalleInversion 
          inversion={inversionSeleccionada} 
          onVolver={() => setVista(Vista.LISTADO)} 
        />
      )}
    </div>
  );
};

export default InversionesModule;
