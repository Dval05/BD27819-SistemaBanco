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
