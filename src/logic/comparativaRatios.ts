import type { DatosFinancieros, RatioCalculado } from "../types";
import { formatearValorRatio } from "./formatoRatios";
import { flujoOperativoUtilizado } from "./ratios";

export interface FilaComparativa {
  id: string;
  nombre: string;
  situacionLabel: string;
  plazoLabel: string;
  valorAnterior: string;
  valorActual: string;
  variacionResumen: string;
  analisisCausas: string;
}

/** Variación relativa (%) del valor actual respecto del anterior. */
function pctVariacion(ant: number | null, act: number | null): number | null {
  if (ant === null || act === null) return null;
  if (ant === 0) return null;
  return ((act - ant) / ant) * 100;
}

function textoPct(p: number | null): string {
  if (p === null || !Number.isFinite(p)) return "N/D";
  const s = p >= 0 ? "+" : "";
  return `${s}${p.toFixed(2)} %`;
}

function variacionRelativaCampo(
  key: keyof DatosFinancieros,
  a: DatosFinancieros,
  b: DatosFinancieros
): number | null {
  const va = a[key];
  const vb = b[key];
  if (typeof va !== "number" || typeof vb !== "number") return null;
  if (!Number.isFinite(va) || !Number.isFinite(vb) || va === 0) return null;
  return ((vb - va) / va) * 100;
}

function resumenVariacionRatio(
  formato: RatioCalculado["formato"],
  ant: number | null,
  act: number | null
): string {
  if (ant === null || act === null) return "No comparable (N/D en un período).";
  const diff = act - ant;
  const pct = pctVariacion(ant, act);
  switch (formato) {
    case "porcentaje": {
      const pp = diff;
      const t = pp >= 0 ? "+" : "";
      return `${t}${pp.toFixed(2)} p.p. respecto del ejercicio anterior${
        pct !== null ? ` (${textoPct(pct)})` : ""
      }.`;
    }
    case "dias": {
      const t = diff >= 0 ? "+" : "";
      return `${t}${diff.toFixed(2)} días; variación relativa ${textoPct(pct)}.`;
    }
    case "monto": {
      const t = diff >= 0 ? "+" : "";
      return `${t}${diff.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}; ${textoPct(pct)} vs. ejercicio anterior.`;
    }
    default:
      return `Variación absoluta ${diff >= 0 ? "+" : ""}${diff.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}; relativa ${textoPct(pct)}.`;
  }
}

function lineaDriver(
  etiqueta: string,
  pct: number | null
): string | null {
  if (pct === null || !Number.isFinite(pct)) return null;
  const dir = pct > 0.5 ? "subió" : pct < -0.5 ? "bajó" : "se mantuvo estable";
  if (dir === "se mantuvo estable") return `${etiqueta} se mantuvo similar al ejercicio anterior.`;
  return `${etiqueta} ${dir} aproximadamente un ${Math.abs(pct).toFixed(2)} % interanual.`;
}

function analisisPorId(
  id: string,
  dAnt: DatosFinancieros,
  dAct: DatosFinancieros,
  rAnt: RatioCalculado,
  rAct: RatioCalculado
): string {
  const a = rAnt.valor;
  const b = rAct.valor;
  const base = `Ejercicio anterior (${dAnt.periodo || "ant."}): ${formatearValorRatio(
    rAct.formato,
    a
  )}. Ejercicio actual (${dAct.periodo || "act."}): ${formatearValorRatio(rAct.formato, b)}. `;

  if (a === null || b === null) {
    return `${base}No se puede contrastar en profundidad porque el ratio no está definido en uno de los períodos (división por cero o datos faltantes).`;
  }

  const vAC = variacionRelativaCampo("activoCorriente", dAnt, dAct);
  const vPC = variacionRelativaCampo("pasivoCorriente", dAnt, dAct);
  const vInv = variacionRelativaCampo("inventarios", dAnt, dAct);
  const vVentas = variacionRelativaCampo("ventasNetas", dAnt, dAct);
  const vRN = variacionRelativaCampo("resultadoNeto", dAnt, dAct);
  const vAT =
    variacionRelativaCampo("activoCorriente", dAnt, dAct) !== null &&
    variacionRelativaCampo("activoNoCorriente", dAnt, dAct) !== null
      ? (() => {
          const atAnt = dAnt.activoCorriente + dAnt.activoNoCorriente;
          const atAct = dAct.activoCorriente + dAct.activoNoCorriente;
          if (atAnt === 0) return null;
          return ((atAct - atAnt) / atAnt) * 100;
        })()
      : null;
  const vPT = (() => {
    const ptAnt = dAnt.pasivoCorriente + dAnt.pasivoNoCorriente;
    const ptAct = dAct.pasivoCorriente + dAct.pasivoNoCorriente;
    if (ptAnt === 0) return null;
    return ((ptAct - ptAnt) / ptAnt) * 100;
  })();
  const vPN = variacionRelativaCampo("patrimonioNeto", dAnt, dAct);
  const vCxC = variacionRelativaCampo("creditosPorVentas", dAnt, dAct);
  const vCV = variacionRelativaCampo("costoDeVentas", dAnt, dAct);
  const vGF = variacionRelativaCampo("gastosFinancieros", dAnt, dAct);
  const vGO = variacionRelativaCampo("gastosOperativos", dAnt, dAct);
  const dfAnt = dAnt.deudaFinancieraCortoPlazo + dAnt.deudaFinancieraLargoPlazo;
  const dfAct = dAct.deudaFinancieraCortoPlazo + dAct.deudaFinancieraLargoPlazo;
  const vDF = dfAnt !== 0 ? ((dfAct - dfAnt) / dfAnt) * 100 : null;
  const cfoAnt = flujoOperativoUtilizado(dAnt);
  const cfoAct = flujoOperativoUtilizado(dAct);
  const vCFO = cfoAnt !== 0 ? ((cfoAct - cfoAnt) / cfoAnt) * 100 : null;
  const roAnt = dAnt.ventasNetas - dAnt.costoDeVentas - dAnt.gastosOperativos;
  const roAct = dAct.ventasNetas - dAct.costoDeVentas - dAct.gastosOperativos;
  const vRO = roAnt !== 0 ? ((roAct - roAnt) / roAnt) * 100 : null;
  const ebitdaAnt = roAnt + dAnt.amortizacionesYDepreciaciones;
  const ebitdaAct = roAct + dAct.amortizacionesYDepreciaciones;
  const vEbitda = ebitdaAnt !== 0 ? ((ebitdaAct - ebitdaAnt) / ebitdaAnt) * 100 : null;

  const partes: string[] = [base];

  switch (id) {
    case "liquidez_corriente":
    case "prueba_acida": {
      const l1 = lineaDriver("Activo corriente", vAC);
      const l2 = lineaDriver("Pasivo corriente", vPC);
      const l3 = id === "prueba_acida" ? lineaDriver("Inventarios", vInv) : null;
      partes.push(
        "La liquidez depende de la relación entre activo y pasivo corriente (y en la prueba ácida, del peso de inventarios). "
      );
      if (l1) partes.push(l1 + " ");
      if (l2) partes.push(l2 + " ");
      if (l3) partes.push(l3 + " ");
      if (vAC !== null && vPC !== null) {
        if (vAC > vPC)
          partes.push(
            "Al crecer más el activo corriente que el pasivo corriente, la cobertura de deuda corta mejora en términos de stocks. "
          );
        else if (vPC > vAC)
          partes.push(
            "Un pasivo corriente que crece más rápido que el activo corriente presiona la liquidez. "
          );
      }
      break;
    }
    case "capital_trabajo": {
      const ctAnt = dAnt.activoCorriente - dAnt.pasivoCorriente;
      const ctAct = dAct.activoCorriente - dAct.pasivoCorriente;
      partes.push(
        `Capital de trabajo pasó de ${ctAnt.toLocaleString("es-AR")} a ${ctAct.toLocaleString("es-AR")}. `
      );
      {
        const la = lineaDriver("Activo corriente", vAC);
        const lb = lineaDriver("Pasivo corriente", vPC);
        if (la) partes.push(la + " ");
        if (lb) partes.push(lb + " ");
      }
      break;
    }
    case "rotacion_cxc":
    case "plazo_cobro_dias": {
      {
        const lv = lineaDriver("Ventas netas", vVentas);
        const lc = lineaDriver("Créditos por ventas (saldo)", vCxC);
        if (lv) partes.push(lv + " ");
        if (lc) partes.push(lc + " ");
      }
      partes.push(
        "Si las ventas crecen más que los saldos por cobrar, la rotación mejora y el plazo de cobro tiende a acortarse; la situación inversa alarga el cobro. "
      );
      break;
    }
    case "rotacion_inventarios":
    case "plazo_inventario_dias": {
      {
        const lcv = lineaDriver("Costo de ventas", vCV);
        const li = lineaDriver("Inventarios", vInv);
        if (lcv) partes.push(lcv + " ");
        if (li) partes.push(li + " ");
      }
      partes.push(
        "Mayor rotación suele asociarse a costo de ventas que crece más que el inventario, o a una baja de stock relativa. "
      );
      break;
    }
    case "margen_bruto": {
      const mbAnt = dAnt.ventasNetas !== 0 ? (dAnt.ventasNetas - dAnt.costoDeVentas) / dAnt.ventasNetas : null;
      const mbAct = dAct.ventasNetas !== 0 ? (dAct.ventasNetas - dAct.costoDeVentas) / dAct.ventasNetas : null;
      {
        const lv = lineaDriver("Ventas netas", vVentas);
        const lcv = lineaDriver("Costo de ventas", vCV);
        if (lv) partes.push(lv + " ");
        if (lcv) partes.push(lcv + " ");
      }
      if (mbAnt !== null && mbAct !== null && mbAct < mbAnt)
        partes.push(
          "Un margen bruto menor suele deberse a que el costo de ventas absorbe una porción mayor de cada peso de venta (menor capacidad de precio o mayor costo de producto). "
        );
      else if (mbAnt !== null && mbAct !== null && mbAct > mbAnt)
        partes.push("El margen bruto mejora si el costo de ventas crece menos que las ventas en términos relativos. ");
      break;
    }
    case "margen_operativo":
    case "margen_neto": {
      {
        const lv = lineaDriver("Ventas netas", vVentas);
        const lr = lineaDriver("Resultado neto", vRN);
        if (lv) partes.push(lv + " ");
        if (lr) partes.push(lr + " ");
      }
      if (id === "margen_operativo" && vGO !== null)
        partes.push(lineaDriver("Gastos operativos", vGO)! + " ");
      partes.push(
        "Los márgenes sobre ventas sintetizan precio, costo y estructura de gastos: conviene ver si el resultado crece al ritmo de las ventas. "
      );
      break;
    }
    case "roa":
    case "roe": {
      {
        const lr = lineaDriver("Resultado neto", vRN);
        if (lr) partes.push(lr + " ");
      }
      if (id === "roa" && vAT !== null) partes.push(lineaDriver("Activo total (aprox.)", vAT)! + " ");
      if (id === "roe" && vPN !== null) partes.push(lineaDriver("Patrimonio neto", vPN)! + " ");
      partes.push(
        "El retorno sube si el resultado crece más que la base (activo o patrimonio); si la base crece más que el resultado, el retorno cae aun con utilidades positivas. "
      );
      break;
    }
    case "roce":
    case "roic": {
      if (vRO !== null) partes.push(lineaDriver("Resultado operativo (aprox.)", vRO)! + " ");
      partes.push(
        "Cambios en capital empleado o invertido y en el resultado operativo explican la variación del retorno operativo sobre el capital. "
      );
      break;
    }
    case "rotacion_activos": {
      {
        const lv = lineaDriver("Ventas netas", vVentas);
        if (lv) partes.push(lv + " ");
      }
      if (vAT !== null) partes.push(lineaDriver("Activo total", vAT)! + " ");
      partes.push("Mayor rotación indica más ventas por cada unidad de activo; activos que crecen más que las ventas la reducen. ");
      break;
    }
    case "endeudamiento_total":
    case "solvencia":
    case "patrimonio_activo": {
      if (vPT !== null) partes.push(lineaDriver("Pasivo total", vPT)! + " ");
      if (vAT !== null) partes.push(lineaDriver("Activo total", vAT)! + " ");
      partes.push(
        "El apalancamiento y la solvencia dependen de cómo evoluciona el pasivo frente al activo y al patrimonio. "
      );
      break;
    }
    case "endeudamiento_patrimonial": {
      if (vDF !== null) partes.push(lineaDriver("Deuda financiera", vDF)! + " ");
      if (vPN !== null) partes.push(lineaDriver("Patrimonio neto", vPN)! + " ");
      partes.push("Si la deuda financiera crece más que el patrimonio, sube el apalancamiento financiero relativo. ");
      break;
    }
    case "cobertura_intereses":
    case "cobertura_ebitda_intereses": {
      if (vGF !== null) partes.push(lineaDriver("Gastos financieros (intereses)", vGF)! + " ");
      if (id === "cobertura_intereses" && vRO !== null)
        partes.push(lineaDriver("Resultado operativo (aprox.)", vRO)! + " ");
      if (id === "cobertura_ebitda_intereses" && vEbitda !== null)
        partes.push(lineaDriver("EBITDA aproximado", vEbitda)! + " ");
      partes.push(
        "La cobertura mejora si el resultado o el EBITDA crecen más que los intereses, o si los intereses bajan. "
      );
      break;
    }
    case "margen_ebitda":
    case "deuda_financiera_sobre_ebitda":
    case "pasivo_total_sobre_ebitda":
    case "deuda_neta_sobre_ebitda": {
      if (vEbitda !== null) partes.push(lineaDriver("EBITDA aproximado", vEbitda)! + " ");
      if (vDF !== null) partes.push(lineaDriver("Deuda financiera", vDF)! + " ");
      if (vPT !== null && (id === "pasivo_total_sobre_ebitda" || id === "deuda_neta_sobre_ebitda"))
        partes.push(lineaDriver("Pasivo total", vPT)! + " ");
      partes.push(
        "Los múltiplos sobre EBITDA son sensibles al denominador (EBITDA) y al numerador (deuda o pasivo): caídas de EBITDA con deuda estable empeoran el indicador. "
      );
      break;
    }
    case "margen_flujo_operativo":
    case "flujo_sobre_deuda_financiera":
    case "flujo_sobre_pasivo_corriente": {
      if (vCFO !== null) partes.push(lineaDriver("Flujo operativo utilizado", vCFO)! + " ");
      if (id === "margen_flujo_operativo" && vVentas !== null)
        partes.push(lineaDriver("Ventas", vVentas)! + " ");
      if (id === "flujo_sobre_deuda_financiera" && vDF !== null)
        partes.push(lineaDriver("Deuda financiera", vDF)! + " ");
      if (id === "flujo_sobre_pasivo_corriente" && vPC !== null)
        partes.push(lineaDriver("Pasivo corriente", vPC)! + " ");
      partes.push(
        "El flujo operativo refleja utilidad y ajustes no monetarios; comparalo con la evolución de ventas y de la deuda para interpretar coberturas. "
      );
      break;
    }
    case "free_cash_flow": {
      const fcfAnt = cfoAnt - dAnt.inversionesActivosFijos;
      const fcfAct = cfoAct - dAct.inversionesActivosFijos;
      const vCapex = variacionRelativaCampo("inversionesActivosFijos", dAnt, dAct);
      if (vCFO !== null) partes.push(lineaDriver("Flujo operativo", vCFO)! + " ");
      if (vCapex !== null) partes.push(lineaDriver("CAPEX informado", vCapex)! + " ");
      partes.push(
        `FCF aprox. pasó de ${fcfAnt.toLocaleString("es-AR")} a ${fcfAct.toLocaleString("es-AR")}. Más CAPEX reduce el FCF si el flujo operativo no lo compensa. `
      );
      break;
    }
    case "dupont_multiplicador_patrimonio":
    case "roe_dupont": {
      if (vPN !== null) partes.push(lineaDriver("Patrimonio neto", vPN)! + " ");
      if (vAT !== null) partes.push(lineaDriver("Activo total", vAT)! + " ");
      if (vVentas !== null) partes.push(lineaDriver("Ventas", vVentas)! + " ");
      partes.push(
        "El ROE por DuPont descompone margen, rotación de activos y apalancamiento: la variación puede venir de cualquiera de esas tres palancas. "
      );
      break;
    }
    case "plazo_pago_proveedores": {
      const vProv = variacionRelativaCampo("proveedores", dAnt, dAct);
      {
        const lp = lineaDriver("Proveedores", vProv);
        const lcv = lineaDriver("Costo de ventas", vCV);
        if (lp) partes.push(lp + " ");
        if (lcv) partes.push(lcv + " ");
      }
      partes.push(
        "Un mayor plazo de pago suele asociarse a proveedores que crecen más que el costo de ventas (compras a crédito relativamente mayores). "
      );
      break;
    }
    default:
      partes.push(
        "La variación del ratio se interpreta comparando el numerador y el denominador de su fórmula entre ejercicios (ventas, márgenes, activos, pasivos y deuda). "
      );
  }

  return partes.join("").trim();
}

export function generarFilasComparativa(
  ratiosAnt: RatioCalculado[],
  ratiosAct: RatioCalculado[],
  dAnt: DatosFinancieros,
  dAct: DatosFinancieros
): FilaComparativa[] {
  const mapAnt = new Map(ratiosAnt.map((r) => [r.id, r]));
  const out: FilaComparativa[] = [];
  for (const rAct of ratiosAct) {
    const rAnt = mapAnt.get(rAct.id);
    if (!rAnt) continue;
    out.push({
      id: rAct.id,
      nombre: rAct.nombre,
      situacionLabel: rAct.situacion === "economica" ? "Económica" : "Financiera",
      plazoLabel: rAct.plazo === "corto" ? "Corto plazo" : "Largo plazo",
      valorAnterior: formatearValorRatio(rAct.formato, rAnt.valor),
      valorActual: formatearValorRatio(rAct.formato, rAct.valor),
      variacionResumen: resumenVariacionRatio(rAct.formato, rAnt.valor, rAct.valor),
      analisisCausas: analisisPorId(rAct.id, dAnt, dAct, rAnt, rAct),
    });
  }
  return out;
}
