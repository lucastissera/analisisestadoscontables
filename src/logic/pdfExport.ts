import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { DatosFinancieros, RatioCalculado } from "../types";
import type { FilaComparativa } from "./comparativaRatios";
import { formatearValorRatio } from "./formatoRatios";

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
    formatearValorRatio(r.formato, r.valor),
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

export function generarPdfComparativa(
  empresa: string,
  etiquetaAnt: string,
  etiquetaAct: string,
  filas: FilaComparativa[]
): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 12;
  let y = margin;

  doc.setFontSize(15);
  doc.text("Análisis comparativo de ratios", margin, y);
  y += 7;
  doc.setFontSize(9.5);
  doc.setTextColor(70);
  doc.text(`${empresa}`, margin, y);
  y += 5;
  doc.text(`Ejercicio anterior: ${etiquetaAnt}  ·  Ejercicio actual: ${etiquetaAct}`, margin, y);
  y += 8;
  doc.setTextColor(0);

  const body = filas.map((f) => [
    f.nombre,
    f.situacionLabel,
    f.plazoLabel,
    f.valorAnterior,
    f.valorActual,
    f.variacionResumen,
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Ratio",
        "Sit.",
        "Plazo",
        "Ant.",
        "Act.",
        "Variación",
      ],
    ],
    body,
    styles: { fontSize: 6, cellPadding: 1 },
    headStyles: { fillColor: [41, 98, 120] },
    columnStyles: {
      0: { cellWidth: 34 },
      1: { cellWidth: 22 },
      2: { cellWidth: 22 },
      3: { cellWidth: 18 },
      4: { cellWidth: 18 },
      5: { cellWidth: 52 },
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  doc.setFontSize(10);
  doc.text("Análisis de causas por ratio", margin, finalY + 8);

  let cursorY = finalY + 14;
  doc.setFontSize(7.5);

  for (const f of filas) {
    const bloque = doc.splitTextToSize(`${f.nombre}: ${f.analisisCausas}`, 186);
    const h = bloque.length * 3.2 + 5;
    if (cursorY + h > 285) {
      doc.addPage();
      cursorY = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.text(f.nombre, margin, cursorY);
    cursorY += 3.5;
    doc.setFont("helvetica", "normal");
    doc.text(bloque, margin, cursorY);
    cursorY += bloque.length * 3.2 + 5;
  }

  return doc.output("blob");
}
