import type { DatosFinancieros, FormatoRatio, Plazo, RatioCalculado, Situacion } from "../types";
import { enriquecerExplicaciones } from "./explanations";

function div(a: number, b: number): number | null {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return a / b;
}

/** CFO declarado en estados o, si no, RN + amortizaciones/depreciaciones */
export function flujoOperativoUtilizado(d: DatosFinancieros): number {
  if (d.flujoEfectivoOperativo !== null && Number.isFinite(d.flujoEfectivoOperativo)) {
    return d.flujoEfectivoOperativo;
  }
  return d.resultadoNeto + d.amortizacionesYDepreciaciones;
}

function ratioBase(
  id: string,
  nombre: string,
  situacion: Situacion,
  plazo: Plazo,
  formato: FormatoRatio,
  valor: number | null,
  formula: string,
  explicacion: string
): RatioCalculado {
  return { id, nombre, situacion, plazo, formato, valor, formula, explicacion };
}

/** Cálculo numérico sin textos personalizados */
export function calcularRatiosNumericos(d: DatosFinancieros): RatioCalculado[] {
  const ac = d.activoCorriente;
  const pc = d.pasivoCorriente;
  const inv = d.inventarios;
  const cxc = d.creditosPorVentas;
  const at = d.activoCorriente + d.activoNoCorriente;
  const pt = d.pasivoCorriente + d.pasivoNoCorriente;
  const pn = d.patrimonioNeto;
  const df = d.deudaFinancieraCortoPlazo + d.deudaFinancieraLargoPlazo;
  const ventas = d.ventasNetas;
  const cv = d.costoDeVentas;
  const resultadoOp = ventas - cv - d.gastosOperativos;
  const gf = d.gastosFinancieros;

  const liquidezCorriente = div(ac, pc);
  const acida = div(ac - inv, pc);
  const capitalTrabajo = ac - pc;

  const rotCxc = div(ventas, cxc);
  const plazoCobro = rotCxc !== null ? 365 / rotCxc : null;

  const rotInv = div(cv, inv);
  const plazoInv = rotInv !== null ? 365 / rotInv : null;

  const margenBruto = div(ventas - cv, ventas);
  const margenOp = div(resultadoOp, ventas);
  const margenNeto = div(d.resultadoNeto, ventas);

  const roa = div(d.resultadoNeto, at);
  const roe = div(d.resultadoNeto, pn);
  const rotAct = div(ventas, at);

  const endTotal = div(pt, at);
  const endPat = div(df, pn);
  const cobInt = div(resultadoOp, gf);
  const solv = div(at, pt);
  const patAct = div(pn, at);

  const amort = d.amortizacionesYDepreciaciones;
  const ebitda = resultadoOp + amort;
  const cfo = flujoOperativoUtilizado(d);

  const margenEbitda = div(ebitda, ventas);
  const cobEbitdaIntereses = div(ebitda, gf);
  const deudaSobreEbitda = div(df, ebitda);
  const margenCfo = div(cfo, ventas);
  const cfoSobreDeuda = div(cfo, df);
  const cfoSobrePc = div(cfo, pc);
  const multPatrimonioDupont = div(at, pn);
  const margenNetoDec = div(d.resultadoNeto, ventas);
  const roeDupontPct =
    margenNetoDec !== null && rotAct !== null && multPatrimonioDupont !== null
      ? margenNetoDec * rotAct * multPatrimonioDupont * 100
      : null;
  const provSobreCv = div(d.proveedores, cv);
  const plazoPagoProvDias = provSobreCv !== null ? provSobreCv * 365 : null;

  const out: RatioCalculado[] = [
    ratioBase(
      "liquidez_corriente",
      "Liquidez corriente",
      "financiera",
      "corto",
      "indice",
      liquidezCorriente,
      "Activo corriente / Pasivo corriente",
      ""
    ),
    ratioBase(
      "prueba_acida",
      "Prueba ácida (liquidez seca)",
      "financiera",
      "corto",
      "indice",
      acida,
      "(Activo corriente − Inventarios) / Pasivo corriente",
      ""
    ),
    ratioBase(
      "capital_trabajo",
      "Capital de trabajo",
      "financiera",
      "corto",
      "indice",
      Number.isFinite(capitalTrabajo) ? capitalTrabajo : null,
      "Activo corriente − Pasivo corriente",
      ""
    ),
    ratioBase(
      "rotacion_cxc",
      "Rotación de cuentas por cobrar",
      "economica",
      "corto",
      "veces",
      rotCxc,
      "Ventas netas / Créditos por ventas (saldo medio aproximado)",
      ""
    ),
    ratioBase(
      "plazo_cobro_dias",
      "Plazo medio de cobro",
      "economica",
      "corto",
      "dias",
      plazoCobro,
      "365 / Rotación de cuentas por cobrar",
      ""
    ),
    ratioBase(
      "rotacion_inventarios",
      "Rotación de inventarios",
      "economica",
      "corto",
      "veces",
      rotInv,
      "Costo de ventas / Inventarios",
      ""
    ),
    ratioBase(
      "plazo_inventario_dias",
      "Plazo medio de inventario",
      "economica",
      "corto",
      "dias",
      plazoInv,
      "365 / Rotación de inventarios",
      ""
    ),
    ratioBase(
      "margen_bruto",
      "Margen bruto",
      "economica",
      "corto",
      "porcentaje",
      margenBruto !== null ? margenBruto * 100 : null,
      "(Ventas − Costo de ventas) / Ventas",
      ""
    ),
    ratioBase(
      "margen_operativo",
      "Margen operativo",
      "economica",
      "corto",
      "porcentaje",
      margenOp !== null ? margenOp * 100 : null,
      "Resultado operativo / Ventas netas",
      ""
    ),
    ratioBase(
      "margen_neto",
      "Margen neto",
      "economica",
      "largo",
      "porcentaje",
      margenNeto !== null ? margenNeto * 100 : null,
      "Resultado neto / Ventas netas",
      ""
    ),
    ratioBase(
      "roa",
      "ROA — Retorno sobre activos",
      "economica",
      "largo",
      "porcentaje",
      roa !== null ? roa * 100 : null,
      "Resultado neto / Activo total",
      ""
    ),
    ratioBase(
      "roe",
      "ROE — Retorno sobre patrimonio",
      "economica",
      "largo",
      "porcentaje",
      roe !== null ? roe * 100 : null,
      "Resultado neto / Patrimonio neto",
      ""
    ),
    ratioBase(
      "rotacion_activos",
      "Rotación de activos totales",
      "economica",
      "largo",
      "veces",
      rotAct,
      "Ventas netas / Activo total",
      ""
    ),
    ratioBase(
      "endeudamiento_total",
      "Endeudamiento total (pasivo / activo)",
      "financiera",
      "largo",
      "porcentaje",
      endTotal !== null ? endTotal * 100 : null,
      "Pasivo total / Activo total",
      ""
    ),
    ratioBase(
      "endeudamiento_patrimonial",
      "Endeudamiento financiero / Patrimonio",
      "financiera",
      "largo",
      "indice",
      endPat,
      "Deuda financiera CP+LP / Patrimonio neto",
      ""
    ),
    ratioBase(
      "cobertura_intereses",
      "Cobertura de intereses",
      "financiera",
      "largo",
      "veces",
      cobInt,
      "Resultado operativo / Gastos financieros",
      ""
    ),
    ratioBase(
      "solvencia",
      "Ratio de solvencia",
      "financiera",
      "largo",
      "indice",
      solv,
      "Activo total / Pasivo total",
      ""
    ),
    ratioBase(
      "patrimonio_activo",
      "Patrimonio / Activos",
      "financiera",
      "largo",
      "porcentaje",
      patAct !== null ? patAct * 100 : null,
      "Patrimonio neto / Activo total",
      ""
    ),
    ratioBase(
      "margen_ebitda",
      "Margen EBITDA",
      "economica",
      "largo",
      "porcentaje",
      margenEbitda !== null ? margenEbitda * 100 : null,
      "EBITDA / Ventas netas; EBITDA = Resultado operativo + Amortizaciones y depreciaciones",
      ""
    ),
    ratioBase(
      "cobertura_ebitda_intereses",
      "Cobertura de intereses (EBITDA)",
      "financiera",
      "largo",
      "veces",
      cobEbitdaIntereses,
      "EBITDA / Gastos financieros",
      ""
    ),
    ratioBase(
      "deuda_financiera_sobre_ebitda",
      "Deuda financiera / EBITDA (años)",
      "financiera",
      "largo",
      "veces",
      deudaSobreEbitda,
      "Deuda financiera CP+LP / EBITDA (aprox. años para amortizar deuda con EBITDA)",
      ""
    ),
    ratioBase(
      "margen_flujo_operativo",
      "Margen de flujo operativo",
      "economica",
      "largo",
      "porcentaje",
      margenCfo !== null ? margenCfo * 100 : null,
      "Flujo operativo / Ventas netas (flujo declarado o estimado RN + amortizaciones)",
      ""
    ),
    ratioBase(
      "flujo_sobre_deuda_financiera",
      "Flujo operativo / Deuda financiera",
      "financiera",
      "largo",
      "veces",
      cfoSobreDeuda,
      "Flujo operativo / Deuda financiera CP+LP",
      ""
    ),
    ratioBase(
      "flujo_sobre_pasivo_corriente",
      "Flujo operativo / Pasivo corriente",
      "financiera",
      "corto",
      "indice",
      cfoSobrePc,
      "Flujo operativo / Pasivo corriente (liquidez dinámica aproximada)",
      ""
    ),
    ratioBase(
      "dupont_multiplicador_patrimonio",
      "DuPont — Multiplicador de patrimonio",
      "financiera",
      "largo",
      "indice",
      multPatrimonioDupont,
      "Activo total / Patrimonio neto",
      ""
    ),
    ratioBase(
      "roe_dupont",
      "ROE vía DuPont (producto)",
      "economica",
      "largo",
      "porcentaje",
      roeDupontPct,
      "(Resultado neto / Ventas) × (Ventas / Activo) × (Activo / Patrimonio)",
      ""
    ),
    ratioBase(
      "plazo_pago_proveedores",
      "Plazo medio de pago a proveedores",
      "economica",
      "corto",
      "dias",
      plazoPagoProvDias,
      "(Proveedores / Costo de ventas) × 365 (compras aproximadas por costo de ventas)",
      ""
    ),
  ];

  return out;
}

export function calcularRatios(d: DatosFinancieros): RatioCalculado[] {
  return enriquecerExplicaciones(d, calcularRatiosNumericos(d));
}
