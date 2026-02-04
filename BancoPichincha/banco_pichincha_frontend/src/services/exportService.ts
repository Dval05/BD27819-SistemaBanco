import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ClienteExport {
  nombre: string;
  saldoActual: number;
  saldoAnterior: number;
  montoCompras: number;
  pagoRealizado: number;
  saldoBase: number;
  pagoMinimoBase: number;
  esMoroso: boolean;
  interes: number;
  multa: number;
  pagoMinimo: number;
  pagoNoIntereses: number;
  createdAt: string;
}

interface Estadisticas {
  total: number;
  morosos: number;
  noMorosos: number;
}

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      startY?: number;
      head?: string[][];
      body: (string | number)[][];
      theme?: string;
      headStyles?: { fillColor: number[] };
    }) => void;
  }
}

// Exportar clientes a PDF
export const exportarClientesPDF = (clientes: ClienteExport[]): void => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.text('Banco Bandido de Peluche - Lista de Clientes', 14, 22);

  // Fecha
  doc.setFontSize(11);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

  // Tabla
  const tableData = clientes.map((cliente) => [
    cliente.nombre,
    `$${cliente.saldoActual.toFixed(2)}`,
    cliente.esMoroso ? 'Sí' : 'No',
    `$${cliente.pagoMinimo.toFixed(2)}`,
  ]);

  doc.autoTable({
    startY: 35,
    head: [['Cliente', 'Saldo Actual', 'Moroso', 'Pago Mínimo']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [255, 221, 0] },
  });

  doc.save('clientes.pdf');
};

// Exportar detalle de un cliente a PDF
export const exportarClienteDetallePDF = (cliente: ClienteExport): void => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.text('Banco Bandido de Peluche - Detalle del Cliente', 14, 22);

  // Información del cliente
  doc.setFontSize(12);
  let y = 35;

  doc.text(`Cliente: ${cliente.nombre}`, 14, y);
  y += 10;
  doc.text(`Fecha: ${new Date(cliente.createdAt).toLocaleDateString()}`, 14, y);
  y += 15;

  // Tabla de detalles
  const tableData: [string, string][] = [
    ['Saldo Anterior', `$${cliente.saldoAnterior.toFixed(2)}`],
    ['Monto Compras', `$${cliente.montoCompras.toFixed(2)}`],
    ['Pago Realizado', `$${cliente.pagoRealizado.toFixed(2)}`],
    ['Saldo Base', `$${cliente.saldoBase.toFixed(2)}`],
    ['Pago Mínimo Base', `$${cliente.pagoMinimoBase.toFixed(2)}`],
    ['Es Moroso', cliente.esMoroso ? 'Sí' : 'No'],
    ['Interés', `$${cliente.interes.toFixed(2)}`],
    ['Multa', `$${cliente.multa.toFixed(2)}`],
    ['Saldo Actual', `$${cliente.saldoActual.toFixed(2)}`],
    ['Pago Mínimo', `$${cliente.pagoMinimo.toFixed(2)}`],
    ['Pago Sin Intereses', `$${cliente.pagoNoIntereses.toFixed(2)}`],
  ];

  doc.autoTable({
    startY: y,
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [255, 221, 0] },
  });

  doc.save(`cliente_${cliente.nombre}.pdf`);
};

// Exportar clientes a Excel
export const exportarClientesExcel = (clientes: ClienteExport[]): void => {
  const data = clientes.map((cliente) => ({
    Cliente: cliente.nombre,
    'Saldo Anterior': cliente.saldoAnterior,
    'Monto Compras': cliente.montoCompras,
    'Pago Realizado': cliente.pagoRealizado,
    'Saldo Base': cliente.saldoBase,
    Moroso: cliente.esMoroso ? 'Sí' : 'No',
    Interés: cliente.interes,
    Multa: cliente.multa,
    'Saldo Actual': cliente.saldoActual,
    'Pago Mínimo': cliente.pagoMinimo,
    'Pago Sin Intereses': cliente.pagoNoIntereses,
    Fecha: new Date(cliente.createdAt).toLocaleDateString(),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
  XLSX.writeFile(wb, 'clientes.xlsx');
};

// Exportar estadísticas a PDF
export const exportarEstadisticasPDF = (estadisticas: Estadisticas): void => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.text('Banco Bandido de Peluche - Estadísticas', 14, 22);

  // Fecha
  doc.setFontSize(11);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

  // Tabla
  const tableData: [string, string][] = [
    ['Total de Clientes', estadisticas.total.toString()],
    ['Clientes Morosos', estadisticas.morosos.toString()],
    ['Clientes No Morosos', estadisticas.noMorosos.toString()],
    ['Porcentaje Morosos', `${((estadisticas.morosos / estadisticas.total) * 100).toFixed(2)}%`],
  ];

  doc.autoTable({
    startY: 40,
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [255, 221, 0] },
  });

  doc.save('estadisticas.pdf');
};

// Exportar estadísticas a Excel
export const exportarEstadisticasExcel = (estadisticas: Estadisticas): void => {
  const data = [
    {
      Descripción: 'Total de Clientes',
      Valor: estadisticas.total,
    },
    {
      Descripción: 'Clientes Morosos',
      Valor: estadisticas.morosos,
    },
    {
      Descripción: 'Clientes No Morosos',
      Valor: estadisticas.noMorosos,
    },
    {
      Descripción: 'Porcentaje Morosos',
      Valor: `${((estadisticas.morosos / estadisticas.total) * 100).toFixed(2)}%`,
    },
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Estadísticas');
  XLSX.writeFile(wb, 'estadisticas.xlsx');
};

// ============================================
// TRANSFERENCIAS
// ============================================

interface ComprobanteTransferencia {
  numeroOperacion: string;
  fecha: string;
  cuentaOrigen: {
    tipoCuenta: string;
    numeroCuenta: string;
  };
  beneficiario: string;
  cuentaDestino: string;
  tipoTransferencia: string;
  monto: number;
  comision: number;
  total: number;
  descripcion?: string;
}

/**
 * Exportar comprobante de transferencia a PDF
 */
export const exportarComprobantePDF = (datos: ComprobanteTransferencia): void => {
  const doc = new jsPDF();

  // Colores Banco Pichincha
  const colorPrimario: [number, number, number] = [255, 221, 0]; // Amarillo
  const colorSecundario: [number, number, number] = [0, 51, 102]; // Azul oscuro
  const colorTexto: [number, number, number] = [51, 51, 51]; // Gris oscuro

  // Encabezado con fondo amarillo
  doc.setFillColor(...colorPrimario);
  doc.rect(0, 0, 210, 40, 'F');

  // Logo/Título
  doc.setTextColor(...colorSecundario);
  doc.setFontSize(22);
  doc.text('BANCO PICHINCHA', 105, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text('Comprobante de Transferencia', 105, 30, { align: 'center' });

  // Resetear color de texto
  doc.setTextColor(...colorTexto);

  // Sección: Estado
  let y = 50;
  doc.setFillColor(46, 204, 113); // Verde éxito
  doc.circle(20, y + 3, 4, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSFERENCIA EXITOSA', 28, y + 5);

  // Información de la transferencia
  y += 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Número de operación destacado
  doc.setFillColor(240, 240, 240);
  doc.rect(14, y - 5, 182, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Número de Operación:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(datos.numeroOperacion, 140, y, { align: 'right' });

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha y Hora:', 20, y);
  doc.setFont('helvetica', 'normal');
  const fechaFormateada = new Date(datos.fecha).toLocaleString('es-EC', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(fechaFormateada, 140, y, { align: 'right' });

  // Línea separadora
  y += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 196, y);

  // Detalles de origen
  y += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CUENTA DE ORIGEN', 20, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tipo: ${datos.cuentaOrigen.tipoCuenta}`, 20, y);
  y += 6;
  const cuentaOrigenFormato = datos.cuentaOrigen.numeroCuenta.length >= 4 
    ? `****${datos.cuentaOrigen.numeroCuenta.slice(-4)}` 
    : datos.cuentaOrigen.numeroCuenta;
  doc.text(`Número: ${cuentaOrigenFormato}`, 20, y);

  // Flecha indicadora
  y += 10;
  doc.setFontSize(12);
  doc.text('↓', 105, y, { align: 'center' });

  // Detalles de destino
  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CUENTA DE DESTINO', 20, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Beneficiario: ${datos.beneficiario}`, 20, y);
  y += 6;
  const cuentaDestinoFormato = datos.cuentaDestino && datos.cuentaDestino.length >= 4
    ? `****${datos.cuentaDestino.slice(-4)}`
    : datos.cuentaDestino || 'N/A';
  doc.text(`Número de cuenta: ${cuentaDestinoFormato}`, 20, y);
  y += 6;
  doc.text(`Tipo: ${datos.tipoTransferencia}`, 20, y);

  // Línea separadora
  y += 8;
  doc.line(14, y, 196, y);

  // Detalles financieros
  y += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLES FINANCIEROS', 20, y);

  y += 10;
  const detallesFinancieros: [string, string][] = [
    ['Monto transferido', `$${datos.monto.toFixed(2)}`],
  ];

  if (datos.comision > 0) {
    detallesFinancieros.push(['Comisión', `$${datos.comision.toFixed(2)}`]);
  }

  detallesFinancieros.push(['Total debitado', `$${datos.total.toFixed(2)}`]);

  // Dibujar tabla manualmente
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  detallesFinancieros.forEach((fila) => {
    doc.text(fila[0], 20, y);
    doc.text(fila[1], 180, y, { align: 'right' });
    y += 8;
  });

  y += 2;

  // Descripción si existe
  if (datos.descripcion) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Descripción:', 20, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    const descripcionLines = doc.splitTextToSize(datos.descripcion, 170);
    doc.text(descripcionLines, 20, y);
    y += descripcionLines.length * 5 + 10;
  }

  // Pie de página
  y += 10;
  doc.setDrawColor(...colorPrimario);
  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);
  
  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Este es un comprobante electrónico válido.', 105, y, { align: 'center' });
  y += 5;
  doc.text(`Generado el ${new Date().toLocaleString('es-EC')}`, 105, y, { align: 'center' });
  y += 5;
  doc.text('Banco Pichincha - Contigo siempre', 105, y, { align: 'center' });

  // Guardar PDF
  const nombreArchivo = `Comprobante_${datos.numeroOperacion}_${new Date().getTime()}.pdf`;
  doc.save(nombreArchivo);
};
