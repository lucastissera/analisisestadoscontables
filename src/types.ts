export type Situacion = "economica" | "financiera";
export type Plazo = "corto" | "largo";

export interface DatosFinancieros {
  /** Razón social o nombre comercial para textos explicativos */
  razonSocial: string;
  /** Ejercicio o período (texto libre) */
  periodo: string;

  activoCorriente: number;
  efectivoYEquivalentes: number;
  creditosPorVentas: number;
  inventarios: number;
  otrosActivosCorrientes: number;

  activoNoCorriente: number;
  bienesDeUso: number;
  inversionesLargoPlazo: number;
  intangibles: number;
  otrosActivosNoCorrientes: number;

  pasivoCorriente: number;
  deudaFinancieraCortoPlazo: number;
  proveedores: number;
  otrosPasivosCorrientes: number;

  pasivoNoCorriente: number;
  deudaFinancieraLargoPlazo: number;
  otrosPasivosNoCorrientes: number;

  patrimonioNeto: number;

  ventasNetas: number;
  costoDeVentas: number;
  gastosOperativos: number;
  gastosFinancieros: number;
  resultadoNeto: number;

  /** Para EBITDA: Resultado operativo + amortizaciones/depreciaciones */
  amortizacionesYDepreciaciones: number;
  /**
   * Flujo de efectivo por actividades operativas (del estado de efectivo).
   * `null` o celda vacía en Excel: se estima como resultado neto + amortizaciones y depreciaciones.
   */
  flujoEfectivoOperativo: number | null;
}

export type FormatoRatio = "indice" | "porcentaje" | "veces" | "dias";

export interface RatioCalculado {
  id: string;
  nombre: string;
  situacion: Situacion;
  plazo: Plazo;
  formato: FormatoRatio;
  valor: number | null;
  formula: string;
  explicacion: string;
}

export const CAMPOS_IMPORT_EXCEL = [
  "razonSocial",
  "periodo",
  "activoCorriente",
  "efectivoYEquivalentes",
  "creditosPorVentas",
  "inventarios",
  "otrosActivosCorrientes",
  "activoNoCorriente",
  "bienesDeUso",
  "inversionesLargoPlazo",
  "intangibles",
  "otrosActivosNoCorrientes",
  "pasivoCorriente",
  "deudaFinancieraCortoPlazo",
  "proveedores",
  "otrosPasivosCorrientes",
  "pasivoNoCorriente",
  "deudaFinancieraLargoPlazo",
  "otrosPasivosNoCorrientes",
  "patrimonioNeto",
  "ventasNetas",
  "costoDeVentas",
  "gastosOperativos",
  "gastosFinancieros",
  "resultadoNeto",
  "amortizacionesYDepreciaciones",
  "flujoEfectivoOperativo",
] as const satisfies readonly (keyof DatosFinancieros)[];
