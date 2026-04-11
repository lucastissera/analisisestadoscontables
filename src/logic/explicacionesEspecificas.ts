import type { DatosFinancieros, RatioCalculado } from "../types";
import { formatearValorRatio } from "./formatoRatios";

function num(
  n: number,
  opts: { min?: number; max?: number; grouping?: boolean } = {}
): string {
  const { min = 2, max = 6, grouping = true } = opts;
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
    useGrouping: grouping,
  });
}

function refEmpresa(d: DatosFinancieros): string {
  const n = d.razonSocial.trim();
  return n || "la empresa";
}

function periodoTxt(d: DatosFinancieros): string {
  return d.periodo.trim() || "el período analizado";
}

function sinDatos(d: DatosFinancieros, r: RatioCalculado): string {
  const p = periodoTxt(d);
  return `No es posible elaborar la interpretación numérica de «${r.nombre}» con los datos cargados para ${p}.`;
}

/**
 * Interpretación concreta del resultado (valores, período, redacción por ratio).
 */
export function explicacionEspecificaNarrativa(
  d: DatosFinancieros,
  r: RatioCalculado
): string {
  const periodo = periodoTxt(d);
  const entidad = refEmpresa(d);

  if (r.valor === null || !Number.isFinite(r.valor)) {
    return sinDatos(d, r);
  }

  const v = r.valor;

  switch (r.id) {
    case "liquidez_corriente":
      return `Por cada $1 de pasivo corriente, ${entidad} tiene $${num(v)} en activos corrientes en ${periodo}.`;

    case "prueba_acida":
      return `Por cada $1 de pasivo corriente, ${entidad} tiene $${num(v)} en activo corriente neto de inventarios en ${periodo}.`;

    case "capital_trabajo":
      return `En ${periodo}, el capital de trabajo de ${entidad} es de $${num(v, { min: 2, max: 2 })}.`;

    case "rotacion_cxc": {
      if (v <= 0) return sinDatos(d, r);
      const dias = 365 / v;
      return `El plazo medio de cobro de ${entidad} es de ${num(dias, { min: 1, max: 1 })} días en ${periodo}.`;
    }

    case "plazo_cobro_dias":
      return `El plazo medio de cobro es de ${num(v, { min: 1, max: 1 })} días en ${periodo}.`;

    case "rotacion_inventarios": {
      if (v <= 0) return sinDatos(d, r);
      const dias = 365 / v;
      return `Los inventarios rotan ${num(v, { min: 2, max: 2 })} veces al año; el plazo medio en stock se estima en ${num(dias, { min: 1, max: 1 })} días en ${periodo}.`;
    }

    case "plazo_inventario_dias":
      return `El plazo medio de permanencia en inventario es de ${num(v, { min: 1, max: 1 })} días en ${periodo}.`;

    case "margen_bruto":
      return `El margen bruto representa el ${num(v, { min: 2, max: 2 })} % de las ventas netas en ${periodo}.`;

    case "margen_operativo":
      return `El margen operativo representa el ${num(v, { min: 2, max: 2 })} % de las ventas netas en ${periodo}.`;

    case "margen_neto":
      return `El margen neto representa el ${num(v, { min: 2, max: 2 })} % de las ventas netas en ${periodo}.`;

    case "roa":
      return `El resultado neto representa el ${num(v, { min: 2, max: 2 })} % del activo total en ${periodo}.`;

    case "roe":
      return `El resultado neto representa el ${num(v, { min: 2, max: 2 })} % del patrimonio neto en ${periodo}.`;

    case "rotacion_activos":
      return `Por cada $1 de activo total, ${entidad} generó $${num(v)} de ventas netas en ${periodo}.`;

    case "endeudamiento_total":
      return `El pasivo total representa el ${num(v, { min: 2, max: 2 })} % del activo total en ${periodo}.`;

    case "endeudamiento_patrimonial":
      return `Por cada $1 de patrimonio neto, la deuda financiera total asciende a $${num(v)} en ${periodo}.`;

    case "cobertura_intereses":
      return `El resultado operativo cubre ${num(v, { min: 2, max: 2 })} veces los gastos financieros en ${periodo}.`;

    case "solvencia":
      return `Por cada $1 de pasivo total, ${entidad} cuenta con $${num(v)} de activo total en ${periodo}.`;

    case "patrimonio_activo":
      return `El patrimonio neto representa el ${num(v, { min: 2, max: 2 })} % del activo total en ${periodo}.`;

    case "margen_ebitda":
      return `El EBITDA representa el ${num(v, { min: 2, max: 2 })} % de las ventas netas en ${periodo}.`;

    case "cobertura_ebitda_intereses":
      return `El EBITDA cubre ${num(v, { min: 2, max: 2 })} veces los gastos financieros en ${periodo}.`;

    case "deuda_financiera_sobre_ebitda":
      return `La deuda financiera equivale a ${num(v, { min: 2, max: 2 })} veces el EBITDA del ejercicio en ${periodo}.`;

    case "margen_flujo_operativo":
      return `El flujo operativo representa el ${num(v, { min: 2, max: 2 })} % de las ventas netas en ${periodo}.`;

    case "flujo_sobre_deuda_financiera":
      return `Por cada $1 de deuda financiera, el flujo operativo del ejercicio fue de $${num(v)} en ${periodo}.`;

    case "flujo_sobre_pasivo_corriente":
      return `Por cada $1 de pasivo corriente, el flujo operativo anual fue de $${num(v)} en ${periodo}.`;

    case "dupont_multiplicador_patrimonio":
      return `Por cada $1 de patrimonio neto, ${entidad} mantiene $${num(v)} de activo total en ${periodo}.`;

    case "roe_dupont":
      return `El ROE vía DuPont alcanza el ${num(v, { min: 2, max: 2 })} % en ${periodo}.`;

    case "plazo_pago_proveedores":
      return `El plazo medio de pago a proveedores es de ${num(v, { min: 1, max: 1 })} días en ${periodo}.`;

    default:
      return `En ${entidad}, el indicador arroja ${formatearValorRatio(r.formato, v)} para ${periodo}.`;
  }
}
