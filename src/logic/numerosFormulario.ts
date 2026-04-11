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
