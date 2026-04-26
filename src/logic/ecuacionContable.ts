import type { DatosFinancieros } from "../types";

const TOL = 0.01;

/**
 * Ecuación del balance: Activo total = Pasivo total + Patrimonio neto
 * (sumando act/pas a nivel de rúbricas totales informadas en el formulario)
 */
export function comprobarEcuacionContable(d: DatosFinancieros) {
  const totalActivo = d.activoCorriente + d.activoNoCorriente;
  const totalPasivo = d.pasivoCorriente + d.pasivoNoCorriente;
  const pat = d.patrimonioNeto;
  const totalPasivoMasPat = totalPasivo + pat;
  const diferencia = totalActivo - totalPasivoMasPat;
  const ok = Math.abs(diferencia) < TOL;
  return { totalActivo, totalPasivo, pat, totalPasivoMasPat, diferencia, ok };
}
