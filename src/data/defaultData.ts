import type { DatosFinancieros } from "../types";

export const datosPorDefecto: DatosFinancieros = {
  razonSocial: "Empresa de ejemplo S.A.",
  periodo: "2025",

  activoCorriente: 420000,
  efectivoYEquivalentes: 95000,
  creditosPorVentas: 180000,
  inventarios: 120000,
  otrosActivosCorrientes: 25000,

  activoNoCorriente: 680000,
  bienesDeUso: 520000,
  inversionesLargoPlazo: 80000,
  intangibles: 45000,
  otrosActivosNoCorrientes: 35000,

  pasivoCorriente: 280000,
  deudaFinancieraCortoPlazo: 95000,
  proveedores: 140000,
  otrosPasivosCorrientes: 45000,

  pasivoNoCorriente: 310000,
  deudaFinancieraLargoPlazo: 240000,
  otrosPasivosNoCorrientes: 70000,

  patrimonioNeto: 510000,

  ventasNetas: 1850000,
  costoDeVentas: 1120000,
  gastosOperativos: 420000,
  gastosFinancieros: 28000,
  resultadoNeto: 185000,

  amortizacionesYDepreciaciones: 72000,
  flujoEfectivoOperativo: null,
};
