import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { DatosFinancieros, RatioCalculado } from "../types";

function fmtValor(r: RatioCalculado): string {
  if (r.valor === null) return "N/D";
  const n = r.valor;
  switch (r.formato) {
    case "porcentaje":
      return `${n.toFixed(2)} %`;
    case "dias":
      return `${Math.round(n)} días`;
    case "veces":
      return `${n.toFixed(2)} veces`;
    default:
      return n.toFixed(2);
  }
}

export function generarPdfAnalisis(d: DatosFinancieros, ratios: RatioCalculado[]): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  let y = margin;

  doc.setFontSize(16);
  doc.text("Análisis de estados contables", margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`${d.razonSocial} — ${d.periodo}`, margin, y);
  y += 10;
  doc.setTextColor(0);

  const body = ratios.map((r) => [
    r.nombre,
    r.situacion === "economica" ? "Económica" : "Financiera",
    r.plazo === "corto" ? "Corto" : "Largo",
    fmtValor(r),
    r.formula,
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Ratio", "Situación", "Plazo", "Valor", "Fórmula"]],
    body,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [41, 98, 120] },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 22 },
      2: { cellWidth: 16 },
      3: { cellWidth: 18 },
      4: { cellWidth: 62 },
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY;

  doc.setFontSize(11);
  doc.text("Interpretación por ratio", margin, finalY + 10);

  let cursorY = finalY + 16;
  doc.setFontSize(8.5);

  for (const r of ratios) {
    const bloque = doc.splitTextToSize(`${r.nombre}: ${r.explicacion}`, 182);
    const h = bloque.length * 3.6 + 4;
    if (cursorY + h > 280) {
      doc.addPage();
      cursorY = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.text(r.nombre, margin, cursorY);
    cursorY += 4;
    doc.setFont("helvetica", "normal");
    doc.text(bloque, margin, cursorY);
    cursorY += bloque.length * 3.6 + 6;
  }

  return doc.output("blob");
}
