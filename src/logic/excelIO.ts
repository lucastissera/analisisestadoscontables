import * as XLSX from "xlsx-js-style";
import type { DatosFinancieros, RatioCalculado } from "../types";
import type { FilaComparativa } from "./comparativaRatios";
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
  inversionesActivosFijos: "inversionesActivosFijos",
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
  "inversiones en activos fijos": "inversionesActivosFijos",
  capex: "inversionesActivosFijos",
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

/** Ancho por columna según el texto más largo en esa columna (tope opcional por índice). */
function anchosColumnasLibres(
  filas: (string | number)[][],
  numColumnas: number,
  maxPorIndice: number[],
  minW = 10,
  pad = 2
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
  return maxPorCol.map((w, i) => {
    const cap = maxPorIndice[i] ?? 100;
    return { wch: Math.min(cap, Math.max(minW, w + pad)) };
  });
}

function redondear2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Formato Excel con unidad explícita en la celda (texto entre comillas en el numFmt). */
function numFmtValorRatio(r: RatioCalculado): string {
  switch (r.formato) {
    case "porcentaje":
      return "0.00%";
    case "dias":
      return '0.00" días"';
    case "veces":
      if (
        r.id === "deuda_financiera_sobre_ebitda" ||
        r.id === "pasivo_total_sobre_ebitda" ||
        r.id === "deuda_neta_sobre_ebitda"
      ) {
        return '0.00" años"';
      }
      return '0.00" veces"';
    case "monto":
      return "_-* #,##0.00_-;\\-* #,##0.00_-;_-* \"-\"??_-;_-@_-";
    case "indice":
      if (r.id === "capital_trabajo") {
        return '$#,##0.00" (importe)"';
      }
      return '0.00" veces"';
    default:
      return "0.00";
  }
}

function valorCeldaParaExcel(r: RatioCalculado): number | string {
  if (r.valor === null) return "";
  const v = redondear2(r.valor);
  if (r.formato === "porcentaje") return v / 100;
  return v;
}

/** Fila 0 = encabezados, 1–2 = razón social y período (datos de la empresa). */
const FILAS_EMPRESA_NEGRITA = 3;

/** Formato tipo contabilidad: separador de miles y 2 decimales (Excel aplica símbolo según región). */
const NUM_FMT_CONTABILIDAD = "_-* #,##0.00_-;\\-* #,##0.00_-;_-* \"-\"??_-;_-@_-";

function aplicarEstilosHojaDatos(ws: XLSX.WorkSheet) {
  const ref = ws["!ref"];
  if (!ref) return;
  const range = XLSX.utils.decode_range(ref);

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (!cell) continue;

      const prev = cell.s ?? {};
      const s: XLSX.CellStyle = { ...prev };

      if (R < FILAS_EMPRESA_NEGRITA) {
        s.font = { ...prev.font, bold: true };
      }

      if (C === 1 && R >= FILAS_EMPRESA_NEGRITA) {
        const v = cell.v;
        if (typeof v === "number" && Number.isFinite(v)) {
          s.numFmt = NUM_FMT_CONTABILIDAD;
          s.alignment = { ...prev.alignment, horizontal: "right" };
        }
      }

      cell.s = s;
    }
  }
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
    inversionesActivosFijos: "Inversiones en activos (CAPEX)",
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
  aplicarEstilosHojaDatos(ws);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Datos");
  return XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
    cellStyles: true,
  });
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
    inversionesActivosFijos: 0,
  };
  return exportarDatosAXlsx(vacio);
}

const FILAS_ENCABEZADO_ANALISIS = 4;
const COL_VALOR_ANALISIS = 3;

function aplicarEstilosHojaAnalisis(ws: XLSX.WorkSheet, ratios: RatioCalculado[]) {
  const ref = ws["!ref"];
  if (!ref) return;
  const range = XLSX.utils.decode_range(ref);

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (!cell) continue;

      const prev = cell.s ?? {};
      const s: XLSX.CellStyle = { ...prev };

      if (R < FILAS_ENCABEZADO_ANALISIS) {
        s.font = { ...prev.font, bold: true };
      }

      if (C === COL_VALOR_ANALISIS && R >= FILAS_ENCABEZADO_ANALISIS) {
        const idx = R - FILAS_ENCABEZADO_ANALISIS;
        const r = ratios[idx];
        if (r && r.valor !== null) {
          const v = valorCeldaParaExcel(r);
          if (typeof v === "number") {
            cell.v = v;
            cell.t = "n";
            s.numFmt = numFmtValorRatio(r);
            s.alignment = { ...prev.alignment, horizontal: "right" };
          }
        } else if (r && r.valor === null) {
          cell.v = "";
          cell.t = "s";
        }
      }

      cell.s = s;
    }
  }

  const ultimaFila1Based = FILAS_ENCABEZADO_ANALISIS + ratios.length;
  ws["!autofilter"] = {
    ref: `A${FILAS_ENCABEZADO_ANALISIS}:E${ultimaFila1Based}`,
  };
}

export function exportarRatiosAXlsx(
  d: DatosFinancieros,
  ratios: RatioCalculado[]
): ArrayBuffer {
  const filasAnalisis: (string | number)[][] = [
    ["Razón social", d.razonSocial],
    ["Período", d.periodo],
    [],
    ["Ratio", "Situación", "Plazo", "Valor", "Interpretación (empresa)"],
    ...ratios.map((r) => [
      r.nombre,
      r.situacion === "economica" ? "Económica" : "Financiera",
      r.plazo === "corto" ? "Corto plazo" : "Largo plazo",
      valorCeldaParaExcel(r),
      r.explicacionEspecifica,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(filasAnalisis);
  aplicarEstilosHojaAnalisis(ws, ratios);

  const maxColsAnalisis = [120, 26, 26, 28, 110];
  ws["!cols"] = anchosColumnasLibres(filasAnalisis, 5, maxColsAnalisis);

  const filasFormulas: (string | number)[][] = [
    ["Ratio", "Fórmula", "Interpretación general"],
    ...(ratios.length > 0
      ? ratios.map((r) => [r.nombre, r.formula, r.explicacionGeneral])
      : [["", "", ""]]),
  ];
  const wsForm = XLSX.utils.aoa_to_sheet(filasFormulas);
  wsForm["!cols"] = anchosColumnasLibres(filasFormulas, 3, [100, 120, 110]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Análisis");
  XLSX.utils.book_append_sheet(wb, wsForm, "Fórmulas");
  return XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
    cellStyles: true,
  });
}

const FILAS_ENCABEZADO_COMPARATIVA = 5;

function aplicarEstilosHojaComparativa(ws: XLSX.WorkSheet) {
  const ref = ws["!ref"];
  if (!ref) return;
  const range = XLSX.utils.decode_range(ref);
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (!cell) continue;
      const prev = cell.s ?? {};
      const s: XLSX.CellStyle = { ...prev };
      if (R < FILAS_ENCABEZADO_COMPARATIVA) {
        s.font = { ...prev.font, bold: true };
      }
      cell.s = s;
    }
  }
}

export function exportarComparativaAXlsx(
  filas: FilaComparativa[],
  empresa: string,
  etiquetaEjercicioAnterior: string,
  etiquetaEjercicioActual: string
): ArrayBuffer {
  const filasHoja: (string | number)[][] = [
    ["Análisis comparativo de ratios"],
    ["Empresa", empresa],
    ["Ejercicio anterior", etiquetaEjercicioAnterior],
    ["Ejercicio actual", etiquetaEjercicioActual],
    [],
    [
      "Ratio",
      "Situación",
      "Plazo",
      "vs. anterior",
      `Valor (${etiquetaEjercicioAnterior})`,
      `Valor (${etiquetaEjercicioActual})`,
      "Variación",
      "Análisis de causas de la variación",
    ],
    ...filas.map((f) => [
      f.nombre,
      f.situacionLabel,
      f.plazoLabel,
      f.tendenciaVsAnterior ?? "—",
      f.valorAnterior,
      f.valorActual,
      f.variacionResumen,
      f.analisisCausas,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(filasHoja);
  aplicarEstilosHojaComparativa(ws);
  ws["!cols"] = anchosColumnasLibres(filasHoja, 8, [36, 22, 22, 14, 22, 22, 40, 100]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Comparativo");
  return XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
    cellStyles: true,
  });
}
