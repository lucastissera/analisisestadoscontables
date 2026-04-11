import type { FormatoRatio } from "../types";

/** Texto de ratios en pantalla, PDF y explicaciones (decimales amplios). */
export function formatearValorRatio(formato: FormatoRatio, valor: number | null): string {
  if (valor === null) return "N/D";
  const n = valor;
  const opt = { locale: "es-AR" as const, useGrouping: true };
  switch (formato) {
    case "porcentaje":
      return `${n.toLocaleString(opt.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
        useGrouping: opt.useGrouping,
      })} %`;
    case "dias":
      return `${n.toLocaleString(opt.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
        useGrouping: opt.useGrouping,
      })} días`;
    case "veces":
      return `${n.toLocaleString(opt.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
        useGrouping: opt.useGrouping,
      })} veces`;
    case "monto":
      return `$${n.toLocaleString(opt.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: opt.useGrouping,
      })}`;
    default:
      return n.toLocaleString(opt.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
        useGrouping: opt.useGrouping,
      });
  }
}
