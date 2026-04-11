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

  const notaOrigenFlujo =
    d.flujoEfectivoOperativo !== null && Number.isFinite(d.flujoEfectivoOperativo)
      ? " Se utilizó el flujo operativo informado explícitamente en los datos."
      : " Al no informarse flujo del estado de efectivo, se estimó como resultado neto más amortizaciones y depreciaciones.";

  const indicadorArroja = (r: RatioCalculado) =>
    `En ${nombre}, el indicador arroja ${fmtValor(r)} para ${periodo}.`;

  const valorObservado = (r: RatioCalculado) =>
    `En ${nombre}, el valor observado es ${fmtValor(r)} (${periodo}).`;

  return ratios.map((r) => {
    let explicacionGeneral = "";
    let explicacionEspecifica = "";

    switch (r.id) {
      case "liquidez_corriente":
        explicacionGeneral =
          "Mide cuántos pesos de activo corriente hay por cada peso de pasivo corriente. Valores muy bajos sugieren tensiones para afrontar obligaciones inmediatas; valores muy altos pueden indicar activos ociosos.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "prueba_acida":
        explicacionGeneral =
          "Similar a la liquidez corriente pero excluye inventarios, que suelen ser menos líquidos. Refleja la capacidad de cubrir deudas de corto plazo con activos de más rápida realización.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "capital_trabajo":
        explicacionGeneral =
          "Es la diferencia entre activo y pasivo corriente. Un saldo positivo suele asociarse a margen para operar el ciclo corto sin depender de financiamiento extraordinario.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "rotacion_cxc":
        explicacionGeneral =
          "Indica cuántas veces, en promedio, se cobran las ventas a crédito en el año. Rotaciones más altas suelen implicar políticas de cobranza más eficientes (siempre que no se sacrifique volumen).";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "plazo_cobro_dias":
        explicacionGeneral =
          "Estima el tiempo promedio que transcurre entre la venta y el cobro. Plazos largos pueden tensionar la caja aun con buen resultado contable.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "rotacion_inventarios":
        explicacionGeneral =
          "Mide cuántas veces se renueva el stock en relación al costo de ventas. Sectores con inventarios perecederos suelen buscar rotaciones más altas.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "plazo_inventario_dias":
        explicacionGeneral =
          "Aproxima los días que el inventario permanece en poder de la empresa antes de venderse. Debe interpretarse junto con la estacionalidad y el tipo de producto.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "margen_bruto":
        explicacionGeneral =
          "Porcentaje de cada peso de ventas que queda después del costo directo de lo vendido. Es un primer filtro de rentabilidad comercial antes de gastos operativos.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "margen_operativo":
        explicacionGeneral =
          "Refleja la rentabilidad del negocio antes de intereses e impuestos. Ayuda a comparar el desempeño operativo entre empresas con estructuras de deuda distintas.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "margen_neto":
        explicacionGeneral =
          "Porcentaje de las ventas que finalmente se traduce en resultado neto. Integra endeudamiento, política fiscal y otros ingresos/gastos no operativos.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "roa":
        explicacionGeneral =
          "Retorno sobre activos totales: qué parte del activo se convierte en utilidad neta. Es útil para evaluar la eficiencia global en el uso de los recursos.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "roe":
        explicacionGeneral =
          "Retorno sobre patrimonio: rentabilidad para los dueños respecto del capital aportado y retenido. Debe leerse junto con el apalancamiento y el riesgo financiero.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "rotacion_activos":
        explicacionGeneral =
          "Ventas generadas por cada peso invertido en el activo total. Mayor rotación suele asociarse a modelos de negocio intensivos en volumen o activos más eficientes.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "endeudamiento_total":
        explicacionGeneral =
          "Participación del pasivo total en el financiamiento de los activos. Niveles elevados aumentan sensibilidad a tasas y a shocks de demanda.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "endeudamiento_patrimonial":
        explicacionGeneral =
          "Relación deuda (financiera) frente al patrimonio. Es un indicador clásico de apalancamiento: más deuda por cada peso de patrimonio implica mayor riesgo para accionistas.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "cobertura_intereses":
        explicacionGeneral =
          "Cuántas veces el resultado operativo cubre los gastos financieros (intereses). Valores bajos advierten fragilidad ante alzas de costo de deuda o caídas del margen operativo.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "solvencia":
        explicacionGeneral =
          "Capacidad general de los activos para respaldar el pasivo total. Valores mayores indican más colchón frente a acreedores en un horizonte amplio.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "patrimonio_activo":
        explicacionGeneral =
          "Proporción del activo financiada con patrimonio neto. Complementa el análisis de endeudamiento al mostrar el peso del capital propio en la estructura.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "margen_ebitda":
        explicacionGeneral =
          "Mide la generación operativa antes de intereses e impuestos, sin el efecto contable de amortizaciones. Suele usarse para comparar empresas con distinta política de inversiones en activos fijos.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "cobertura_ebitda_intereses":
        explicacionGeneral =
          "Versión más amplia de la cobertura de intereses: el EBITDA absorbe mejor la carga financiera que el resultado operativo solo cuando hay amortizaciones relevantes.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "deuda_financiera_sobre_ebitda":
        explicacionGeneral =
          "Indica cuántos años de EBITDA (aprox.) equivaldrían a la deuda financiera bruta. Es habitual en análisis de crédito; conviene contrastarlo con el sector y con la estructura de vencimientos.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "margen_flujo_operativo":
        explicacionGeneral =
          "Relaciona el efectivo generado por la operación con las ventas. Complementa los márgenes contables al reflejar cobranzas, pagos y working capital de forma más directa.";
        explicacionEspecifica = indicadorArroja(r) + notaOrigenFlujo;
        break;
      case "flujo_sobre_deuda_financiera":
        explicacionGeneral =
          "Cuántas veces el flujo operativo cubre la deuda financiera total. Valores bajos sugieren menor holgura para refinanciar o reducir deuda con caja propia.";
        explicacionEspecifica = indicadorArroja(r) + notaOrigenFlujo;
        break;
      case "flujo_sobre_pasivo_corriente":
        explicacionGeneral =
          "Aproxima si el flujo anual de la operación es suficiente frente al pasivo que vence en el corto plazo. No reemplaza proyecciones de tesorería pero da una foto de orden de magnitud.";
        explicacionEspecifica = indicadorArroja(r) + notaOrigenFlujo;
        break;
      case "dupont_multiplicador_patrimonio":
        explicacionGeneral =
          "Segundo pilar del DuPont junto al margen y la rotación: cuántos pesos de activos se financian con cada peso de patrimonio. Un multiplicador alto amplifica el ROE pero también el riesgo financiero.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "roe_dupont":
        explicacionGeneral =
          "Reexpresa el ROE como producto de margen neto, rotación de activos y multiplicador de patrimonio. Debe coincidir (salvo redondeos) con el ROE directo y ayuda a ver de dónde viene la rentabilidad del accionista.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      case "plazo_pago_proveedores":
        explicacionGeneral =
          "Estima los días medios de pago a proveedores usando el costo de ventas como proxy de compras. Es útil para analizar el ciclo de caja junto con cobranzas e inventarios.";
        explicacionEspecifica = indicadorArroja(r);
        break;
      default:
        explicacionGeneral =
          r.explicacion.trim() ||
          "Indicador calculado a partir de los datos contables cargados.";
        explicacionEspecifica = valorObservado(r);
    }

    const explicacion = `${explicacionGeneral} ${explicacionEspecifica}`.trim();

    return {
      ...r,
      explicacion,
      explicacionGeneral,
      explicacionEspecifica,
    };
  });
}
