import type { FormatoRatio } from "../types";

/** Texto de ratios en pantalla, PDF y exportaciones: siempre 2 decimales. */
export function formatearValorRatio(formato: FormatoRatio, valor: number | null): string {
  if (valor === null) return "N/D";
  const n = valor;
  const opt = { locale: "es-AR" as const, useGrouping: true };
  const dec2 = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: opt.useGrouping,
  };
  switch (formato) {
    case "porcentaje":
      return `${n.toLocaleString(opt.locale, dec2)} %`;
    case "dias":
      return `${n.toLocaleString(opt.locale, dec2)} días`;
    case "veces":
      return `${n.toLocaleString(opt.locale, dec2)} veces`;
    case "monto":
      return `$${n.toLocaleString(opt.locale, dec2)}`;
    default:
      return n.toLocaleString(opt.locale, dec2);
  }
}
