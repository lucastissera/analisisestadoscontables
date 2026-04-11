import * as XLSX from "xlsx";
import type { DatosFinancieros } from "../types";
import { CAMPOS_IMPORT_EXCEL } from "../types";

const ALIAS: Record<string, keyof DatosFinancieros> = {
  razonSocial: "razonSocial",
  periodo: "periodo",
  activoCorriente: "activoCorriente",
  efectivoYEquivalentes: "efectivoYEquivalentes",
  creditosPorVentas: "creditosPorVentas",
  inventarios: "inventarios",
  otrosActivosCorrientes: "otrosActivosCorrientes",
  activoNoCorriente: "activoNoCorriente",
  bienesDeUso: "bienesDeUso",
  inversionesLargoPlazo: "inversionesLargoPlazo",
  intangibles: "intangibles",
  otrosActivosNoCorrientes: "otrosActivosNoCorrientes",
  pasivoCorriente: "pasivoCorriente",
  deudaFinancieraCortoPlazo: "deudaFinancieraCortoPlazo",
  proveedores: "proveedores",
  otrosPasivosCorrientes: "otrosPasivosCorrientes",
  pasivoNoCorriente: "pasivoNoCorriente",
  deudaFinancieraLargoPlazo: "deudaFinancieraLargoPlazo",
  otrosPasivosNoCorrientes: "otrosPasivosNoCorrientes",
  patrimonioNeto: "patrimonioNeto",
  ventasNetas: "ventasNetas",
  costoDeVentas: "costoDeVentas",
  gastosOperativos: "gastosOperativos",
  gastosFinancieros: "gastosFinancieros",
  resultadoNeto: "resultadoNeto",
  amortizacionesYDepreciaciones: "amortizacionesYDepreciaciones",
  flujoEfectivoOperativo: "flujoEfectivoOperativo",
};

const ALIAS_ESP: Record<string, keyof DatosFinancieros> = {
  "razón social": "razonSocial",
  "razon social": "razonSocial",
  empresa: "razonSocial",
  periodo: "periodo",
  ejercicio: "periodo",
  "activo corriente": "activoCorriente",
  "activo corriente (total)": "activoCorriente",
  "efectivo y equivalentes": "efectivoYEquivalentes",
  efectivo: "efectivoYEquivalentes",
  "créditos por ventas": "creditosPorVentas",
  "creditos por ventas": "creditosPorVentas",
  "cuentas por cobrar": "creditosPorVentas",
  inventarios: "inventarios",
  "otros activos corrientes": "otrosActivosCorrientes",
  "activo no corriente": "activoNoCorriente",
  "activo no corriente (total)": "activoNoCorriente",
  "bienes de uso": "bienesDeUso",
  "inversiones largo plazo": "inversionesLargoPlazo",
  intangibles: "intangibles",
  "otros activos no corrientes": "otrosActivosNoCorrientes",
  "pasivo corriente": "pasivoCorriente",
  "pasivo corriente (total)": "pasivoCorriente",
  "deuda financiera corto plazo": "deudaFinancieraCortoPlazo",
  "deuda cp": "deudaFinancieraCortoPlazo",
  proveedores: "proveedores",
  "otros pasivos corrientes": "otrosPasivosCorrientes",
  "pasivo no corriente": "pasivoNoCorriente",
  "pasivo no corriente (total)": "pasivoNoCorriente",
  "deuda financiera largo plazo": "deudaFinancieraLargoPlazo",
  "deuda lp": "deudaFinancieraLargoPlazo",
  "otros pasivos no corrientes": "otrosPasivosNoCorrientes",
  "patrimonio neto": "patrimonioNeto",
  patrimonio: "patrimonioNeto",
  "ventas netas": "ventasNetas",
  ventas: "ventasNetas",
  "costo de ventas": "costoDeVentas",
  "costo ventas": "costoDeVentas",
  "gastos operativos": "gastosOperativos",
  "gastos financieros": "gastosFinancieros",
  "gastos financieros (intereses)": "gastosFinancieros",
  intereses: "gastosFinancieros",
  "resultado neto": "resultadoNeto",
  "amortizaciones y depreciaciones": "amortizacionesYDepreciaciones",
  amortizaciones: "amortizacionesYDepreciaciones",
  depreciaciones: "amortizacionesYDepreciaciones",
  "flujo efectivo operativo": "flujoEfectivoOperativo",
  "flujo operativo": "flujoEfectivoOperativo",
  "flujo de efectivo operativo": "flujoEfectivoOperativo",
  "cff operativo": "flujoEfectivoOperativo",
  "flujo operativo (opcional)": "flujoEfectivoOperativo",
};

function normalizarClave(raw: unknown): keyof DatosFinancieros | null {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (s in ALIAS) return ALIAS[s];
  const low = s.toLowerCase();
  if (low in ALIAS_ESP) return ALIAS_ESP[low];
  return null;
}

function parseNumero(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const t = v.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
    const n = Number(t);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function filaVacia(row: unknown[]): boolean {
  return row.every((c) => c === undefined || c === null || String(c).trim() === "");
}

/** Anchos de columna en caracteres (`wch` de SheetJS) según el contenido más largo. */
function anchosColumnasDesdeFilas(
  filas: (string | number)[][],
  numColumnas: number
): { wch: number }[] {
  const maxPorCol = new Array(numColumnas).fill(0);
  for (const row of filas) {
    for (let c = 0; c < numColumnas; c++) {
      const cell = row[c];
      const len =
        cell === undefined || cell === null ? 0 : String(cell).length;
      if (len > maxPorCol[c]) maxPorCol[c] = len;
    }
  }
  const minW = 14;
  /** Columna A: conceptos; B: valores (pueden ser razón social larga). */
  const maxPorIndice = [56, 100];
  const pad = 2;
  return maxPorCol.map((w, i) => {
    const cap = maxPorIndice[i] ?? maxPorIndice[maxPorIndice.length - 1];
    return { wch: Math.min(cap, Math.max(minW, w + pad)) };
  });
}

function asignarCelda(
  acc: Partial<DatosFinancieros>,
  key: keyof DatosFinancieros,
  raw: unknown
) {
  if (key === "razonSocial" || key === "periodo") {
    acc[key] = String(raw ?? "").trim() as never;
    return;
  }
  if (key === "flujoEfectivoOperativo") {
    if (raw === undefined || raw === null || String(raw).trim() === "") {
      acc[key] = null as never;
    } else {
      acc[key] = parseNumero(raw) as never;
    }
    return;
  }
  acc[key] = parseNumero(raw) as never;
}

/**
 * Lee la primera hoja: una fila por concepto, columna A = concepto, columna B = valor.
 * Opcional: primera fila con encabezados "Concepto" / "Valor" (se omite si no reconoce el concepto).
 */
export function importarDatosDesdeArrayDeFilas(rows: unknown[][]): Partial<DatosFinancieros> {
  const acc: Partial<DatosFinancieros> = {};

  for (const row of rows) {
    if (!row || row.length < 2) continue;
    if (filaVacia(row as unknown[])) continue;
    const k = normalizarClave(row[0]);
    if (!k) continue;
    asignarCelda(acc, k, row[1]);
  }

  return acc;
}

export function importarDesdeArchivo(buffer: ArrayBuffer): Partial<DatosFinancieros> {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
  return importarDatosDesdeArrayDeFilas(rows);
}

export function exportarDatosAXlsx(d: DatosFinancieros): ArrayBuffer {
  const etiquetas: Record<keyof DatosFinancieros, string> = {
    razonSocial: "Razón social",
    periodo: "Período / ejercicio",
    activoCorriente: "Activo corriente (total)",
    efectivoYEquivalentes: "Efectivo y equivalentes",
    creditosPorVentas: "Créditos por ventas",
    inventarios: "Inventarios",
    otrosActivosCorrientes: "Otros activos corrientes",
    activoNoCorriente: "Activo no corriente (total)",
    bienesDeUso: "Bienes de uso",
    inversionesLargoPlazo: "Inversiones largo plazo",
    intangibles: "Intangibles",
    otrosActivosNoCorrientes: "Otros activos no corrientes",
    pasivoCorriente: "Pasivo corriente (total)",
    deudaFinancieraCortoPlazo: "Deuda financiera corto plazo",
    proveedores: "Proveedores",
    otrosPasivosCorrientes: "Otros pasivos corrientes",
    pasivoNoCorriente: "Pasivo no corriente (total)",
    deudaFinancieraLargoPlazo: "Deuda financiera largo plazo",
    otrosPasivosNoCorrientes: "Otros pasivos no corrientes",
    patrimonioNeto: "Patrimonio neto",
    ventasNetas: "Ventas netas",
    costoDeVentas: "Costo de ventas",
    gastosOperativos: "Gastos operativos",
    gastosFinancieros: "Gastos financieros (intereses)",
    resultadoNeto: "Resultado neto",
    amortizacionesYDepreciaciones: "Amortizaciones y depreciaciones",
    flujoEfectivoOperativo: "Flujo operativo (opcional)",
  };

  const filas: (string | number)[][] = [
    ["Concepto", "Valor"],
    ...CAMPOS_IMPORT_EXCEL.map((k) => {
      const v = d[k];
      const celda =
        v === null || v === undefined ? "" : (v as string | number);
      return [etiquetas[k], celda];
    }),
  ];

  const ws = XLSX.utils.aoa_to_sheet(filas);
  ws["!cols"] = anchosColumnasDesdeFilas(filas, 2);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Datos");
  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}

export function exportarPlantillaVacia(): ArrayBuffer {
  const vacio: DatosFinancieros = {
    razonSocial: "",
    periodo: "",
    activoCorriente: 0,
    efectivoYEquivalentes: 0,
    creditosPorVentas: 0,
    inventarios: 0,
    otrosActivosCorrientes: 0,
    activoNoCorriente: 0,
    bienesDeUso: 0,
    inversionesLargoPlazo: 0,
    intangibles: 0,
    otrosActivosNoCorrientes: 0,
    pasivoCorriente: 0,
    deudaFinancieraCortoPlazo: 0,
    proveedores: 0,
    otrosPasivosCorrientes: 0,
    pasivoNoCorriente: 0,
    deudaFinancieraLargoPlazo: 0,
    otrosPasivosNoCorrientes: 0,
    patrimonioNeto: 0,
    ventasNetas: 0,
    costoDeVentas: 0,
    gastosOperativos: 0,
    gastosFinancieros: 0,
    resultadoNeto: 0,
    amortizacionesYDepreciaciones: 0,
    flujoEfectivoOperativo: null,
  };
  return exportarDatosAXlsx(vacio);
}

export function exportarRatiosAXlsx(
  d: DatosFinancieros,
  ratios: { nombre: string; situacion: string; plazo: string; valorFmt: string; formula: string; explicacion: string }[]
): ArrayBuffer {
  const resumen: (string | number)[][] = [
    ["Razón social", d.razonSocial],
    ["Período", d.periodo],
    [],
    ["Ratio", "Situación", "Plazo", "Valor", "Fórmula", "Interpretación"],
    ...ratios.map((r) => [
      r.nombre,
      r.situacion === "economica" ? "Económica" : "Financiera",
      r.plazo === "corto" ? "Corto plazo" : "Largo plazo",
      r.valorFmt,
      r.formula,
      r.explicacion,
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(resumen);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Análisis");
  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}
