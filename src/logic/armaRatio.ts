import type { DatosFinancieros, FormatoRatio } from "../types";
import { datosPorDefecto } from "../data/defaultData";
import { calcularRatiosNumericos } from "./ratios";
import { formatearValorRatio } from "./formatoRatios";
import { redondearDecimales, parseMontoIngreso } from "./numerosFormulario";

const BASE_META = datosPorDefecto;

/** Variables contables cuyo ajuste aislado se prueba respecto de cada ratio (coherente con fórmulas en `ratios.ts`). */
const RATIO_VARS: Record<string, (keyof DatosFinancieros)[]> = {
  liquidez_corriente: ["activoCorriente", "pasivoCorriente"],
  prueba_acida: ["activoCorriente", "inventarios", "pasivoCorriente"],
  capital_trabajo: ["activoCorriente", "pasivoCorriente"],
  rotacion_cxc: ["ventasNetas", "creditosPorVentas"],
  plazo_cobro_dias: ["ventasNetas", "creditosPorVentas"],
  rotacion_inventarios: ["costoDeVentas", "inventarios"],
  plazo_inventario_dias: ["costoDeVentas", "inventarios"],
  margen_bruto: ["ventasNetas", "costoDeVentas"],
  margen_operativo: ["ventasNetas", "costoDeVentas", "gastosOperativos"],
  margen_neto: ["ventasNetas", "resultadoNeto"],
  roa: ["resultadoNeto", "activoCorriente", "activoNoCorriente"],
  roe: ["resultadoNeto", "patrimonioNeto"],
  roce: [
    "ventasNetas",
    "costoDeVentas",
    "gastosOperativos",
    "patrimonioNeto",
    "deudaFinancieraCortoPlazo",
    "deudaFinancieraLargoPlazo",
  ],
  roic: [
    "ventasNetas",
    "costoDeVentas",
    "gastosOperativos",
    "patrimonioNeto",
    "deudaFinancieraCortoPlazo",
    "deudaFinancieraLargoPlazo",
    "efectivoYEquivalentes",
  ],
  rotacion_activos: ["ventasNetas", "activoCorriente", "activoNoCorriente"],
  endeudamiento_total: ["pasivoCorriente", "pasivoNoCorriente", "activoCorriente", "activoNoCorriente"],
  endeudamiento_patrimonial: ["deudaFinancieraCortoPlazo", "deudaFinancieraLargoPlazo", "patrimonioNeto"],
  cobertura_intereses: ["ventasNetas", "costoDeVentas", "gastosOperativos", "gastosFinancieros"],
  solvencia: ["activoCorriente", "activoNoCorriente", "pasivoCorriente", "pasivoNoCorriente"],
  patrimonio_activo: ["patrimonioNeto", "activoCorriente", "activoNoCorriente"],
  margen_ebitda: ["ventasNetas", "costoDeVentas", "gastosOperativos", "amortizacionesYDepreciaciones"],
  cobertura_ebitda_intereses: [
    "ventasNetas",
    "costoDeVentas",
    "gastosOperativos",
    "amortizacionesYDepreciaciones",
    "gastosFinancieros",
  ],
  deuda_financiera_sobre_ebitda: [
    "deudaFinancieraCortoPlazo",
    "deudaFinancieraLargoPlazo",
    "ventasNetas",
    "costoDeVentas",
    "gastosOperativos",
    "amortizacionesYDepreciaciones",
  ],
  pasivo_total_sobre_ebitda: [
    "pasivoCorriente",
    "pasivoNoCorriente",
    "ventasNetas",
    "costoDeVentas",
    "gastosOperativos",
    "amortizacionesYDepreciaciones",
  ],
  deuda_neta_sobre_ebitda: [
    "deudaFinancieraCortoPlazo",
    "deudaFinancieraLargoPlazo",
    "efectivoYEquivalentes",
    "ventasNetas",
    "costoDeVentas",
    "gastosOperativos",
    "amortizacionesYDepreciaciones",
  ],
  margen_flujo_operativo: [
    "ventasNetas",
    "resultadoNeto",
    "amortizacionesYDepreciaciones",
    "flujoEfectivoOperativo",
  ],
  free_cash_flow: [
    "resultadoNeto",
    "amortizacionesYDepreciaciones",
    "flujoEfectivoOperativo",
    "inversionesActivosFijos",
  ],
  flujo_sobre_deuda: [
    "resultadoNeto",
    "amortizacionesYDepreciaciones",
    "flujoEfectivoOperativo",
    "deudaFinancieraCortoPlazo",
    "deudaFinancieraLargoPlazo",
  ],
  flujo_sobre_pasivo_corriente: [
    "resultadoNeto",
    "amortizacionesYDepreciaciones",
    "flujoEfectivoOperativo",
    "pasivoCorriente",
  ],
  dupont_multiplicador_patrimonio: ["activoCorriente", "activoNoCorriente", "patrimonioNeto"],
  roe_dupont: ["resultadoNeto", "ventasNetas", "activoCorriente", "activoNoCorriente", "patrimonioNeto"],
  plazo_pago_proveedores: ["proveedores", "costoDeVentas"],
};

const ETIQ: Partial<Record<keyof DatosFinancieros, string>> = {
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
  flujoEfectivoOperativo: "Flujo operativo (explícito)",
  inversionesActivosFijos: "Inversiones en activos (CAPEX)",
};

function labelCampo(k: keyof DatosFinancieros): string {
  return ETIQ[k] ?? String(k);
}

function mergeCampo(d: DatosFinancieros, k: keyof DatosFinancieros, x: number): DatosFinancieros {
  if (k === "flujoEfectivoOperativo") {
    return { ...d, flujoEfectivoOperativo: x };
  }
  return { ...d, [k]: x } as DatosFinancieros;
}

function valorRatioId(d: DatosFinancieros, id: string): number | null {
  return calcularRatiosNumericos(d).find((r) => r.id === id)?.valor ?? null;
}

function metaRatio(id: string) {
  return calcularRatiosNumericos(BASE_META).find((x) => x.id === id) ?? null;
}

export function listarRatiosArmaOptions(): { id: string; nombre: string }[] {
  return calcularRatiosNumericos(BASE_META).map((x) => ({ id: x.id, nombre: x.nombre }));
}

function boundsKey(d: DatosFinancieros, k: keyof DatosFinancieros): { lo: number; hi: number } {
  const raw = k === "flujoEfectivoOperativo" ? d.flujoEfectivoOperativo : (d[k] as number);
  const v = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
  if (k === "resultadoNeto") {
    return { lo: v - 5e7, hi: v + 5e7 };
  }
  if (k === "flujoEfectivoOperativo") {
    return { lo: -1e8, hi: 1e8 };
  }
  if (k === "gastosFinancieros" && d.gastosFinancieros < 1e-6) {
    return { lo: 1e-4, hi: 1e7 };
  }
  const lo = 0;
  const hi = Math.max(1e-6, Math.abs(v)) * 1e4 + 1e7;
  return { lo, hi: Math.max(hi, lo + 1) };
}

const STEPS = 120;
const REFINE = 24;

/**
 * Ajuste de una sola variable (busca en grilla + refinamiento) para acercar el ratio al valor objetivo.
 */
function mejorAjusteUnaVariable(
  d: DatosFinancieros,
  ratioId: string,
  k: keyof DatosFinancieros,
  target: number
): { necesario: number; error: number } {
  const { lo, hi } = boundsKey(d, k);
  const base = d[k];
  const baseN =
    k === "flujoEfectivoOperativo"
      ? (d.flujoEfectivoOperativo !== null && Number.isFinite(d.flujoEfectivoOperativo) ? d.flujoEfectivoOperativo : 0)
      : (typeof base === "number" ? base : 0);

  let bestX = baseN;
  let bestE = 1e18;

  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const x = lo + t * (hi - lo);
    if (k !== "resultadoNeto" && k !== "flujoEfectivoOperativo" && x < 0) continue;
    const e = errRatio(mergeCampo(d, k, x), ratioId, target);
    if (e < bestE) {
      bestE = e;
      bestX = x;
    }
  }
  const span = (hi - lo) / 50;
  for (let r = 0; r < REFINE; r++) {
    for (const mul of [0.5, 1, 2, -0.5, -1, -2]) {
      const x = bestX + mul * span * Math.pow(0.6, r);
      if (k !== "flujoEfectivoOperativo" && k !== "resultadoNeto" && x < 0) continue;
      const e = errRatio(mergeCampo(d, k, x), ratioId, target);
      if (e < bestE) {
        bestE = e;
        bestX = x;
      }
    }
  }

  if (k !== "flujoEfectivoOperativo" && k !== "resultadoNeto") {
    bestX = Math.max(0, bestX);
  }
  return { necesario: redondearDecimales(bestX, 2), error: bestE };
}

function errRatio(d: DatosFinancieros, ratioId: string, target: number): number {
  const v = valorRatioId(d, ratioId);
  if (v === null || !Number.isFinite(v)) return 1e12;
  return (v - target) * (v - target);
}

export function parseObjetivoRatio(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = parseMontoIngreso(t);
  return Number.isFinite(n) ? n : null;
}

export type FilaArmaRatio = {
  clave: keyof DatosFinancieros;
  etiqueta: string;
  actual: string;
  necesario: string;
  delta: string;
  errorResidual: string;
  nota: string | null;
};

/**
 * Construye el análisis: qué ocurriría si solo varía cada variable de balance/resultado para aproximarse al ratio objetivo.
 */
export function analizarArmaRatio(
  d: DatosFinancieros,
  ratioId: string,
  objetivo: number
): {
  ok: boolean;
  mensaje: string | null;
  ratioNombre: string;
  formula: string;
  formato: FormatoRatio;
  valorActual: string;
  valorObjetivo: string;
  filas: FilaArmaRatio[];
} {
  const meta = metaRatio(ratioId);
  if (!meta) {
    return {
      ok: false,
      mensaje: "Ratio no reconocido.",
      ratioNombre: "",
      formula: "",
      formato: "indice",
      valorActual: "",
      valorObjetivo: "",
      filas: [],
    };
  }

  const actual = valorRatioId(d, ratioId);
  if (actual === null || !Number.isFinite(actual)) {
    return {
      ok: false,
      mensaje:
        "Con los datos actuales el ratio no es calculable (división inválida o faltan datos). Cargá valores coherentes e intentá de nuevo.",
      ratioNombre: meta.nombre,
      formula: meta.formula,
      formato: meta.formato,
      valorActual: "N/D",
      valorObjetivo: formatearValorRatio(meta.formato, objetivo),
      filas: [],
    };
  }

  const keys = RATIO_VARS[ratioId];
  if (!keys?.length) {
    return {
      ok: false,
      mensaje: "Este ratio no tiene listado de variables para el análisis incremental.",
      ratioNombre: meta.nombre,
      formula: meta.formula,
      formato: meta.formato,
      valorActual: formatearValorRatio(meta.formato, actual),
      valorObjetivo: formatearValorRatio(meta.formato, objetivo),
      filas: [],
    };
  }

  const tol = Math.max(1e-3, 1e-4 * (1 + Math.abs(objetivo)));
  const filas: FilaArmaRatio[] = [];
  const unicos = [...new Set(keys)];

  for (const k of unicos) {
    const d0 = d[k];
    const actNum = k === "flujoEfectivoOperativo" && (d0 === null || d0 === undefined) ? 0 : (d0 as number);
    const { necesario } = mejorAjusteUnaVariable(d, ratioId, k, objetivo);
    const merge = mergeCampo(d, k, necesario);
    const vr = valorRatioId(merge, ratioId);
    const residual =
      vr !== null && Number.isFinite(vr) ? Math.abs(vr - objetivo) : Number.POSITIVE_INFINITY;
    const nota =
      residual <= tol
        ? null
        : residual < Math.abs(actual - objetivo) * 0.5
          ? "Aproximación: el ratio no es lineal en esta variable; puede haber otras x que den mejor ajuste."
          : "Con solo esta partida, el objetivo queda lejos: revisá otras filas, combinación de partidas, o comprobá que el objetivo sea alcanzable con los supuestos del modelo.";

    const fmtMonto = (n: number) => n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const actStr =
      k === "flujoEfectivoOperativo" && d.flujoEfectivoOperativo === null
        ? "— (estimado internamente: RN + amort.)"
        : fmtMonto(typeof actNum === "number" ? actNum : 0);
    const delta = necesario - (typeof actNum === "number" && Number.isFinite(actNum) ? actNum : 0);

    filas.push({
      clave: k,
      etiqueta: labelCampo(k),
      actual: actStr,
      necesario: fmtMonto(necesario),
      delta: (delta >= 0 ? "+" : "") + fmtMonto(delta),
      errorResidual:
        vr === null || !Number.isFinite(vr) ? "N/D" : `± ${residual.toFixed(4)} (unid. ratio)`,
      nota: residual <= tol ? null : nota,
    });
  }

  return {
    ok: true,
    mensaje: null,
    ratioNombre: meta.nombre,
    formula: meta.formula,
    formato: meta.formato,
    valorActual: formatearValorRatio(meta.formato, actual),
    valorObjetivo: formatearValorRatio(meta.formato, objetivo),
    filas,
  };
}

export function generarHtmlAnalisisArmaRatio(razon: string, periodo: string, a: ReturnType<typeof analizarArmaRatio>): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const filas = a.filas
    .map(
      (f) => `<tr>
  <td>${esc(f.etiqueta)} <small style="opacity:.75">(${esc(String(f.clave))})</small></td>
  <td style="text-align:right;white-space:nowrap">${esc(f.actual)}</td>
  <td style="text-align:right;white-space:nowrap">${esc(f.necesario)}</td>
  <td style="text-align:right;white-space:nowrap">${esc(f.delta)}</td>
  <td style="text-align:center">${esc(f.errorResidual)}</td>
  <td>${f.nota ? esc(f.nota) : "—"}</td>
</tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${esc("Arma tu ratio — " + a.ratioNombre)}</title>
  <style>
    body { font-family: "Segoe UI", system-ui, sans-serif; max-width: 1100px; margin: 1.2rem auto; padding: 0 1rem; line-height: 1.5;
      background: #0f1419; color: #e8eef4; }
    h1 { font-size: 1.25rem; }
    h2 { font-size: 1.05rem; margin-top: 1.2rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-top: 0.5rem; }
    th, td { border: 1px solid #2f3d4d; padding: 0.45rem 0.5rem; vertical-align: top; }
    th { text-align: left; background: #1a222c; }
    .aviso { background: #2a1f12; border: 1px solid #b45309; padding: 0.75rem; border-radius: 8px; margin: 0.8rem 0; }
    .met { color: #3db8a6; }
    p.sub { color: #8fa3b6; font-size: 0.9rem; }
  </style>
</head>
<body>
  <h1>${esc(a.ratioNombre)}</h1>
  <p class="sub">${esc(razon || "—")} · ${esc(periodo || "período no informado")}</p>
  <p><strong>Valor actual:</strong> ${esc(a.valorActual)} &nbsp;|&nbsp; <strong>Objetivo ingresado:</strong> ${esc(
    a.valorObjetivo
  )}</p>
  <p><strong>Fórmula en el sistema:</strong> ${esc(a.formula)}</p>
  ${
    !a.ok
      ? `<div class="aviso">${esc(a.mensaje ?? "No se pudo generar el análisis.")}</div>`
      : ""
  }
  ${
    a.ok && a.filas.length
      ? `<h2 class="met">Ajuste variable por variable (resto de partidas fijas)</h2>
  <p class="sub">Cada fila indica, en términos aproximados, qué valor debería tomar <strong>esa sola</strong> partida para aproximarse al ratio objetivo. Los ratios reales en la práctica se relacionan con varias partidas a la vez: usá esto como guía (no como único camino exigible).</p>
  <table>
    <thead>
      <tr>
        <th>Partida / concepto</th>
        <th>Valor actual</th>
        <th>Valor necesario (ajuste aislado)</th>
        <th>Diferencia (Δ)</th>
        <th>Error restante (ratio)</th>
        <th>Nota</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>`
      : ""
  }
  <p class="sub" style="margin-top:1.2rem">Análisis generado automáticamente a partir de los datos cargados en el sistema. Entrada del objetivo en las mismas unidades que se muestran en pantalla (índice, %, días, veces o $ según el ratio).</p>
</body>
</html>`;
}

/**
 * Abre en nueva pestaña el informe HTML.
 */
export function abrirAnalisisArmaRatioEnNuevaPestana(html: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const u = URL.createObjectURL(blob);
  const w = window.open(u, "_blank", "noopener,noreferrer");
  if (w) {
    setTimeout(() => URL.revokeObjectURL(u), 60_000);
  } else {
    URL.revokeObjectURL(u);
  }
}
