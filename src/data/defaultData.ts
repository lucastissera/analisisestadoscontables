import type { DatosFinancieros } from "../types";

/** Valores iniciales en cero: el usuario carga su balance; los totales de activo deben conciliar con pasivo + patrimonio. */
export const datosPorDefecto: DatosFinancieros = {
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
