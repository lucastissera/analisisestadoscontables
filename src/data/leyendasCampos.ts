import type { DatosFinancieros } from "../types";

/** Texto al pasar el cursor sobre el título de cada dato. */
export const LEYENDA_CAMPO: Record<keyof DatosFinancieros, string> = {
  razonSocial: "Nombre legal o comercial de la sociedad, tal como figura en el balance o informe.",
  periodo: "Período o ejercicio contable (por ejemplo, año o trimestre) que se está analizando.",
  activoCorriente:
    "Total de activo corriente según el balance: circulante que se realiza, vende o vence en el corto plazo (incluye caja, cobranzas, existencias, etc., según la presentación de tu informe).",
  efectivoYEquivalentes:
    "Caja, bancos y inversiones con vencimiento muy corto (casi inmediatamente convertibles) sin riesgo relevante. Es la liquidez inmediata.",
  creditosPorVentas:
    "Cuentas por cobrar a clientes por ventas a crédito (facturas impagas) al cierre. No incluye otros documentos a cobrar, salvo lo informado bajo otra rúbrica en tu balance.",
  inventarios: "Materia prima, producto en proceso y producto terminado, valorizados al costo o criterio del estado contable.",
  otrosActivosCorrientes:
    "Cualquier otro activo de corto plazo (anticipos, impuestos a recuperar, etc.) que no encaje en las líneas anteriores.",
  activoNoCorriente: "Suma de activos no corrientes (a largo plazo): inmovilizados, inversiones, intangibles y otros, según su presentación en el balance.",
  bienesDeUso:
    "Inmuebles, maquinarias, vehículos y equipos: activos fijos con uso en la operación (puede incluir ajustes y depreciaciones acumuladas en la misma partida, según el ejercicio).",
  inversionesLargoPlazo: "Inversiones financieras o participaciones a mantener a más de un año (no inmediatamente en curso de liquidación).",
  intangibles: "Concesiones, software, marcas, fondo de comercio capitalizado, etc., según el balance.",
  otrosActivosNoCorrientes: "Cualquier activo a largo plazo no clasificado en bienes, inversiones o intangibles.",
  pasivoCorriente: "Obligaciones a pagar en el corto plazo: total del pasivo corriente según el balance (proveedores, deuda CA, otras deudas).",
  deudaFinancieraCortoPlazo: "Préstamos, descuentos y otras deudas con entidades financieras a vencimiento en doce meses o menos.",
  proveedores: "Cuentas por pagar a proveedores de bienes o servicios (documentos a pagar operativos).",
  otrosPasivosCorrientes: "Otras deudas de corto plazo (impuestos, sueldos, anticipos, etc.) no incluidas en deuda financiera o proveedores.",
  pasivoNoCorriente: "Obligaciones a largo plazo: totales de pasivo no corriente según el balance.",
  deudaFinancieraLargoPlazo: "Deuda con bancos o terceros con vencimiento a más de un año.",
  otrosPasivosNoCorrientes: "Provisiones, impuestos diferidos, y otras deudas no corrientes no clasificadas en deuda financiera.",
  patrimonioNeto:
    "Capital, reservas, resultados no asignados y ajuste del patrimonio. Es la parte de los recursos aportada por propietarios y no retirada.",
  ventasNetas: "Ingreso por ventas de bienes o servicios, neto de devoluciones y descuentos comerciales.",
  costoDeVentas: "Costo de lo vendido: materiales, mano de obra de producción y carga vinculada, según criterio contable (COGS / costo de ventas).",
  gastosOperativos:
    "Gastos de administración, comercialización y no financieros (alquileres, servicios, sueldos no productivos, etc.), generalmente aproximable al estructura operativa por debajo del margen bruto.",
  gastosFinancieros: "Intereses y cargos similares de la estructura de endeudamiento (gastos por entidades financieras o intereses a proveedores).",
  resultadoNeto: "Utilidad o pérdida del ejercicio después de impuestos, según el balance o estado de resultados.",
  amortizacionesYDepreciaciones: "Carga periódica de amortización de intangibles y depreciación de inmovilizados (gasto no desembolsable, útil para aproximar EBITDA/FCF).",
  flujoEfectivoOperativo:
    "Flujo de efectivo por actividades operativas en el estado de flujo de efectivo. Si lo dejás vacío, se estima con resultado neto + amortizaciones/depreciaciones aproximado.",
  inversionesActivosFijos: "Erogaciones de capital en el período (CAPEX) para activos: compras o mejoras inmovilizadas.",
};

export function leyendaCampo(k: keyof DatosFinancieros): string {
  return LEYENDA_CAMPO[k] ?? "";
}
