import type { DatosFinancieros, RatioCalculado } from "../types";
import { formatearValorRatio } from "./formatoRatios";

function fmtValor(r: Pick<RatioCalculado, "formato" | "valor">): string {
  return formatearValorRatio(r.formato, r.valor);
}

export function enriquecerExplicaciones(
  d: DatosFinancieros,
  ratios: RatioCalculado[]
): RatioCalculado[] {
  const nombre = d.razonSocial.trim() || "la empresa";
  const periodo = d.periodo.trim() || "el período analizado";

  const byId = Object.fromEntries(ratios.map((r) => [r.id, r]));

  const notaOrigenFlujo =
    d.flujoEfectivoOperativo !== null && Number.isFinite(d.flujoEfectivoOperativo)
      ? " Se utilizó el flujo operativo informado explícitamente en los datos."
      : " Al no informarse flujo del estado de efectivo, se estimó como resultado neto más amortizaciones y depreciaciones.";

  const texto = (id: string, cuerpo: string): string => {
    const r = byId[id];
    const v = r ? fmtValor(r) : "N/D";
    return `${cuerpo} En ${nombre}, el indicador arroja ${v} para ${periodo}.`;
  };

  return ratios.map((r) => {
    let explicacion = r.explicacion;
    switch (r.id) {
      case "liquidez_corriente":
        explicacion = texto(
          r.id,
          "Mide cuántos pesos de activo corriente hay por cada peso de pasivo corriente. Valores muy bajos sugieren tensiones para afrontar obligaciones inmediatas; valores muy altos pueden indicar activos ociosos."
        );
        break;
      case "prueba_acida":
        explicacion = texto(
          r.id,
          "Similar a la liquidez corriente pero excluye inventarios, que suelen ser menos líquidos. Refleja la capacidad de cubrir deudas de corto plazo con activos de más rápida realización."
        );
        break;
      case "capital_trabajo":
        explicacion = texto(
          r.id,
          "Es la diferencia entre activo y pasivo corriente. Un saldo positivo suele asociarse a margen para operar el ciclo corto sin depender de financiamiento extraordinario."
        );
        break;
      case "rotacion_cxc":
        explicacion = texto(
          r.id,
          "Indica cuántas veces, en promedio, se cobran las ventas a crédito en el año. Rotaciones más altas suelen implicar políticas de cobranza más eficientes (siempre que no se sacrifique volumen)."
        );
        break;
      case "plazo_cobro_dias":
        explicacion = texto(
          r.id,
          "Estima el tiempo promedio que transcurre entre la venta y el cobro. Plazos largos pueden tensionar la caja aun con buen resultado contable."
        );
        break;
      case "rotacion_inventarios":
        explicacion = texto(
          r.id,
          "Mide cuántas veces se renueva el stock en relación al costo de ventas. Sectores con inventarios perecederos suelen buscar rotaciones más altas."
        );
        break;
      case "plazo_inventario_dias":
        explicacion = texto(
          r.id,
          "Aproxima los días que el inventario permanece en poder de la empresa antes de venderse. Debe interpretarse junto con la estacionalidad y el tipo de producto."
        );
        break;
      case "margen_bruto":
        explicacion = texto(
          r.id,
          "Porcentaje de cada peso de ventas que queda después del costo directo de lo vendido. Es un primer filtro de rentabilidad comercial antes de gastos operativos."
        );
        break;
      case "margen_operativo":
        explicacion = texto(
          r.id,
          "Refleja la rentabilidad del negocio antes de intereses e impuestos. Ayuda a comparar el desempeño operativo entre empresas con estructuras de deuda distintas."
        );
        break;
      case "margen_neto":
        explicacion = texto(
          r.id,
          "Porcentaje de las ventas que finalmente se traduce en resultado neto. Integra endeudamiento, política fiscal y otros ingresos/gastos no operativos."
        );
        break;
      case "roa":
        explicacion = texto(
          r.id,
          "Retorno sobre activos totales: qué parte del activo se convierte en utilidad neta. Es útil para evaluar la eficiencia global en el uso de los recursos."
        );
        break;
      case "roe":
        explicacion = texto(
          r.id,
          "Retorno sobre patrimonio: rentabilidad para los dueños respecto del capital aportado y retenido. Debe leerse junto con el apalancamiento y el riesgo financiero."
        );
        break;
      case "rotacion_activos":
        explicacion = texto(
          r.id,
          "Ventas generadas por cada peso invertido en el activo total. Mayor rotación suele asociarse a modelos de negocio intensivos en volumen o activos más eficientes."
        );
        break;
      case "endeudamiento_total":
        explicacion = texto(
          r.id,
          "Participación del pasivo total en el financiamiento de los activos. Niveles elevados aumentan sensibilidad a tasas y a shocks de demanda."
        );
        break;
      case "endeudamiento_patrimonial":
        explicacion = texto(
          r.id,
          "Relación deuda (financiera) frente al patrimonio. Es un indicador clásico de apalancamiento: más deuda por cada peso de patrimonio implica mayor riesgo para accionistas."
        );
        break;
      case "cobertura_intereses":
        explicacion = texto(
          r.id,
          "Cuántas veces el resultado operativo cubre los gastos financieros (intereses). Valores bajos advierten fragilidad ante alzas de costo de deuda o caídas del margen operativo."
        );
        break;
      case "solvencia":
        explicacion = texto(
          r.id,
          "Capacidad general de los activos para respaldar el pasivo total. Valores mayores indican más colchón frente a acreedores en un horizonte amplio."
        );
        break;
      case "patrimonio_activo":
        explicacion = texto(
          r.id,
          "Proporción del activo financiada con patrimonio neto. Complementa el análisis de endeudamiento al mostrar el peso del capital propio en la estructura."
        );
        break;
      case "margen_ebitda":
        explicacion = texto(
          r.id,
          "Mide la generación operativa antes de intereses e impuestos, sin el efecto contable de amortizaciones. Suele usarse para comparar empresas con distinta política de inversiones en activos fijos."
        );
        break;
      case "cobertura_ebitda_intereses":
        explicacion = texto(
          r.id,
          "Versión más amplia de la cobertura de intereses: el EBITDA absorbe mejor la carga financiera que el resultado operativo solo cuando hay amortizaciones relevantes."
        );
        break;
      case "deuda_financiera_sobre_ebitda":
        explicacion = texto(
          r.id,
          "Indica cuántos años de EBITDA (aprox.) equivaldrían a la deuda financiera bruta. Es habitual en análisis de crédito; conviene contrastarlo con el sector y con la estructura de vencimientos."
        );
        break;
      case "margen_flujo_operativo":
        explicacion =
          texto(
            r.id,
            "Relaciona el efectivo generado por la operación con las ventas. Complementa los márgenes contables al reflejar cobranzas, pagos y working capital de forma más directa."
          ) + notaOrigenFlujo;
        break;
      case "flujo_sobre_deuda_financiera":
        explicacion =
          texto(
            r.id,
            "Cuántas veces el flujo operativo cubre la deuda financiera total. Valores bajos sugieren menor holgura para refinanciar o reducir deuda con caja propia."
          ) + notaOrigenFlujo;
        break;
      case "flujo_sobre_pasivo_corriente":
        explicacion =
          texto(
            r.id,
            "Aproxima si el flujo anual de la operación es suficiente frente al pasivo que vence en el corto plazo. No reemplaza proyecciones de tesorería pero da una foto de orden de magnitud."
          ) + notaOrigenFlujo;
        break;
      case "dupont_multiplicador_patrimonio":
        explicacion = texto(
          r.id,
          "Segundo pilar del DuPont junto al margen y la rotación: cuántos pesos de activos se financian con cada peso de patrimonio. Un multiplicador alto amplifica el ROE pero también el riesgo financiero."
        );
        break;
      case "roe_dupont":
        explicacion = texto(
          r.id,
          "Reexpresa el ROE como producto de margen neto, rotación de activos y multiplicador de patrimonio. Debe coincidir (salvo redondeos) con el ROE directo y ayuda a ver de dónde viene la rentabilidad del accionista."
        );
        break;
      case "plazo_pago_proveedores":
        explicacion = texto(
          r.id,
          "Estima los días medios de pago a proveedores usando el costo de ventas como proxy de compras. Es útil para analizar el ciclo de caja junto con cobranzas e inventarios."
        );
        break;
      default:
        explicacion = `${r.explicacion} En ${nombre}, el valor observado es ${fmtValor(r)} (${periodo}).`;
    }

    return { ...r, explicacion };
  });
}
