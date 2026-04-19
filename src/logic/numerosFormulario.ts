import type { DatosFinancieros } from "../types";
import { CAMPOS_IMPORT_EXCEL } from "../types";

/**
 * Interpreta montos en formulario: coma o punto como decimal; si hay coma,
 * los puntos se tratan como separador de miles (uso típico es-AR).
 */
export function parseMontoIngreso(raw: string): number {
  let t = raw.trim().replace(/\s/g, "").replace(/−/g, "-");
  if (t === "" || t === "-" || t === "+") return 0;

  const neg = t.startsWith("-");
  if (neg) t = t.slice(1);
  if (t === "") return 0;

  let s = t;
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    const parts = s.split(".");
    if (parts.length > 2) {
      const dec = parts.pop()!;
      s = `${parts.join("")}.${dec}`;
    }
  }

  const n = Number(s);
  let v = Number.isFinite(n) ? n : 0;
  if (neg) v = -v;
  return v;
}

/**
 * Valor en el input: punto como separador decimal (estable al tipear decimales).
 * El parseo acepta también coma y miles con punto (p. ej. 1.234,56).
 */
export function montoAStringEdicion(n: number): string {
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", {
    useGrouping: false,
    maximumFractionDigits: 20,
  });
}

/** Monto en el input con cantidad fija de decimales (p. ej. ejercicio anterior). */
export function montoAStringEdicionDecimales(n: number, decimales: number): string {
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", {
    useGrouping: false,
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

export function redondearDecimales(n: number, decimales: number): number {
  if (!Number.isFinite(n)) return n;
  const f = 10 ** decimales;
  return Math.round(n * f) / f;
}

/** Redondea todos los montos numéricos (p. ej. ejercicio anterior con 2 decimales). */
export function redondearDatosFinancieros(d: DatosFinancieros, decimales: number): DatosFinancieros {
  const out: DatosFinancieros = { ...d };
  for (const k of CAMPOS_IMPORT_EXCEL) {
    if (k === "razonSocial" || k === "periodo") continue;
    if (k === "flujoEfectivoOperativo") {
      const v = out.flujoEfectivoOperativo;
      if (v !== null && Number.isFinite(v)) {
        out.flujoEfectivoOperativo = redondearDecimales(v, decimales);
      }
    } else {
      const cur = out[k] as number;
      if (Number.isFinite(cur)) {
        (out[k] as number) = redondearDecimales(cur, decimales);
      }
    }
  }
  return out;
}
